# -*- coding: utf-8 -*-
"""Запись результата транскрипции в БД: слова (для поиска), счётчики вхождений,
метрики аудио, карта сегментов. DB-агностично: работает с любой SQLAlchemy-сессией."""

import json
import os
import re
from collections import Counter
from uuid import UUID

from sqlalchemy import func

from backend.src import models

SR = 16000
MATCH_THRESHOLD = float(os.environ.get("DIARIZE_MATCH_THRESHOLD", "0.72"))
EMBEDDING_BLEND_WEIGHT = float(os.environ.get("DIARIZE_EMB_BLEND", "0.3"))
_SPEAKER_LABEL_RE = re.compile(r"^Говорящий (\d+)$")


def _normalize(vec):
    n = sum(x * x for x in vec) ** 0.5
    return [x / n for x in vec] if n else list(vec)


def _cosine_sim(a, b):
    return sum(x * y for x, y in zip(a, b))


def _blend_embedding(existing, new, weight=EMBEDDING_BLEND_WEIGHT):
    blended = [existing[i] * (1 - weight) + new[i] * weight for i in range(len(existing))]
    return _normalize(blended)


def _allocate_speaker_label(db):
    """Уникальная глобальная метка для нового голоса в корпусе."""
    nums = []
    for (label,) in db.query(models.Speaker.label).all():
        match = _SPEAKER_LABEL_RE.fullmatch(label or "")
        if match:
            nums.append(int(match.group(1)))
    return f"Говорящий {max(nums, default=0) + 1}"


def _find_best_speaker_match(db, emb):
    emb = _normalize(emb)
    best_sp = None
    best_sim = -1.0
    for sp in db.query(models.Speaker).filter(models.Speaker.embedding.isnot(None)).all():
        sim = _cosine_sim(emb, sp.embedding)
        if sim > best_sim:
            best_sim = sim
            best_sp = sp
    if best_sp is not None and best_sim >= MATCH_THRESHOLD:
        return best_sp
    return None


def _resolve_speakers(db, words, speaker_embeddings=None):
    """Сопоставляет локальные метки диаризации с глобальными спикерами в БД по голосу."""
    speaker_embeddings = speaker_embeddings or {}
    labels = {w.get("speaker") for w in words if w.get("speaker")}
    out = {}

    for label in labels:
        emb = speaker_embeddings.get(label)
        if emb:
            matched = _find_best_speaker_match(db, emb)
            if matched is not None:
                out[label] = matched.id
                matched.embedding = _blend_embedding(matched.embedding, emb)
                continue

        sp = models.Speaker(label=_allocate_speaker_label(db), embedding=_normalize(emb) if emb else None)
        db.add(sp)
        db.flush()
        out[label] = sp.id

    return out


def _segments_for_diarize(segments):
    diarize_segments = []
    for s in segments:
        if s.get("start_sample") is not None and s.get("end_sample") is not None:
            diarize_segments.append(s)
        elif s.get("orig_start") is not None and s.get("orig_end") is not None:
            diarize_segments.append({
                "start_sample": int(float(s["orig_start"]) * SR),
                "end_sample": int(float(s["orig_end"]) * SR),
            })
    return diarize_segments


def _resolve_wav_path(audio):
    wav_16k = os.path.join(audio.folder_path, "original_16k.wav")
    if os.path.exists(wav_16k):
        return wav_16k
    if audio.filename:
        ext = os.path.splitext(audio.filename)[1] or ".wav"
        original = os.path.join(audio.folder_path, f"original{ext}")
        if os.path.exists(original):
            return original
    return None


def compute_speaker_embeddings_from_audio(audio, segments):
    """Пересчитывает ECAPA-центроиды из wav + VAD-сегментов (если нет в JSON)."""
    from backend.src import diarize

    wav_path = _resolve_wav_path(audio)
    diarize_segments = _segments_for_diarize(segments)
    if not wav_path or not diarize_segments:
        return {}

    idx, cluster_centroids = diarize.assign_speakers(wav_path, diarize_segments)
    if not cluster_centroids:
        return {}

    return {
        f"Говорящий {cluster_id + 1}": centroid
        for cluster_id, centroid in cluster_centroids.items()
    }


def cleanup_orphan_speakers(db):
    """Удаляет спикеров без слов (остатки после переиндексации)."""
    orphans = (
        db.query(models.Speaker.id)
        .outerjoin(models.Word, models.Word.speaker_id == models.Speaker.id)
        .group_by(models.Speaker.id)
        .having(func.count(models.Word.id) == 0)
        .all()
    )
    if not orphans:
        return 0
    orphan_ids = [row[0] for row in orphans]
    return db.query(models.Speaker).filter(models.Speaker.id.in_(orphan_ids)).delete(synchronize_session=False)


def _clear_audio_index(db, audio_id):
    """Удаляет индекс слов/сегментов записи перед повторной индексацией."""
    aid = UUID(str(audio_id))
    db.query(models.Word).filter(models.Word.audio_id == aid).delete(synchronize_session=False)
    db.query(models.WordCount).filter(models.WordCount.audio_id == aid).delete(synchronize_session=False)
    db.query(models.SpeechSegment).filter(models.SpeechSegment.audio_id == aid).delete(synchronize_session=False)


def save_transcription(db, audio_id, words, segments, stats, speaker_embeddings=None):
    """words: [{'text','start','end','conf','lang','speaker'?}]; segments: карта VAD;
    stats: dict из audio_process.process_silence()['stats']."""

    _clear_audio_index(db, audio_id)
    spk_map = _resolve_speakers(db, words, speaker_embeddings)

    counter = Counter()
    lang_counter = Counter()
    conf_sum = 0.0
    for i, w in enumerate(words):
        db.add(models.Word(
            audio_id=audio_id, text=w["text"], raw=w.get("raw"),
            start_sec=w["start"], end_sec=w["end"], language=w["lang"],
            confidence=w["conf"], position=i,
            speaker_id=spk_map.get(w.get("speaker")),
        ))
        counter[(w["text"], w["lang"])] += 1
        lang_counter[w["lang"]] += 1
        conf_sum += w["conf"] or 0.0

    for (text, lang), cnt in counter.items():
        db.add(models.WordCount(audio_id=audio_id, text=text, language=lang, count=cnt))

    audio = db.get(models.AudioFile, audio_id)
    if audio is not None:
        n = len(words)
        dur = stats.get("total_sec") or 0.0
        audio.duration_sec = dur
        audio.speech_sec = stats.get("speech_sec")
        audio.silence_removed_sec = stats.get("silence_removed_sec")
        audio.total_words = n
        audio.unique_words = len({w["text"] for w in words})
        audio.words_per_minute = round(n / (dur / 60), 2) if dur else 0.0
        audio.ru_words = lang_counter.get("ru", 0)
        audio.tt_words = lang_counter.get("tt", 0)
        audio.unknown_words = lang_counter.get("unknown", 0)
        audio.avg_confidence = round(conf_sum / n, 4) if n else 0.0
        audio.primary_language = "ru" if lang_counter.get("ru", 0) >= lang_counter.get("tt", 0) else "tt"

    for s in segments:
        db.add(models.SpeechSegment(
            audio_id=audio_id, orig_start=s["orig_start"], orig_end=s["orig_end"],
            trim_start=s["trim_start"], trim_end=s["trim_end"],
        ))

    cleanup_orphan_speakers(db)
    db.commit()


def reindex_from_json(db, audio_id, write_back_json=True):
    """Переиндексирует слова и спикеров из transcription.json на диске."""
    aid = UUID(str(audio_id))
    audio = db.get(models.AudioFile, aid)
    if audio is None:
        raise ValueError("audio not found")

    json_path = os.path.join(audio.folder_path, "transcription.json")
    if not os.path.exists(json_path):
        raise ValueError("transcription.json not found")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    words = data.get("words") or []
    segments = data.get("segment_map") or data.get("segments") or []
    stats = data.get("stats") or {}
    speaker_embeddings = data.get("speaker_embeddings") or {}

    if not speaker_embeddings:
        speaker_embeddings = compute_speaker_embeddings_from_audio(audio, segments)
        if write_back_json and speaker_embeddings:
            data["speaker_embeddings"] = speaker_embeddings
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    save_transcription(db, aid, words, segments, stats, speaker_embeddings)
