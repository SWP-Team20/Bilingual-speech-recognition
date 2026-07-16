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
from backend.src.speaker_labels import ensure_word_speakers, is_auto_diarization_label

SR = 16000
MATCH_THRESHOLD = float(os.environ.get("DIARIZE_MATCH_THRESHOLD", "0.72"))
EMBEDDING_BLEND_WEIGHT = float(os.environ.get("DIARIZE_EMB_BLEND", "0.3"))
_SPEAKER_LABEL_RE = re.compile(r"^Говорящий (\d+)$")


def _normalize(vec):
    if not vec:
        return []
    n = sum(x * x for x in vec) ** 0.5
    return [x / n for x in vec] if n else list(vec)


def _cosine_sim(a, b):
    if not a or not b:
        return -1.0
    return sum(x * y for x, y in zip(a, b))


def _valid_embedding(emb) -> bool:
    return isinstance(emb, (list, tuple)) and len(emb) > 0


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


def _find_speaker_by_label(db, label: str):
    label = (label or "").strip()
    if not label:
        return None
    return (
        db.query(models.Speaker)
        .filter(func.lower(models.Speaker.label) == label.lower())
        .first()
    )


def _create_speaker(db, label, embedding=None):
    sp = models.Speaker(
        label=label,
        embedding=_normalize(embedding) if embedding is not None else None,
    )
    db.add(sp)
    db.flush()
    return sp


def _speaker_for_custom_label(db, label, embedding=None):
    """Пользовательская метка (мама, папа, …): один глобальный Speaker на имя."""
    existing = _find_speaker_by_label(db, label)
    if existing is not None:
        if embedding is not None and existing.embedding is not None:
            existing.embedding = _blend_embedding(existing.embedding, embedding)
        elif embedding is not None and existing.embedding is None:
            existing.embedding = _normalize(embedding)
        return existing
    return _create_speaker(db, label, embedding)


def _distinct_speaker_labels(words):
    return {w.get("speaker") for w in words if w.get("speaker")}


def _is_singleton_speaker_label(words, lbl):
    """В записи только один говорящий (типичный монолог или fallback «Говорящий 1»)."""
    return _distinct_speaker_labels(words) == {lbl}


def _find_best_speaker_match(db, emb, exclude_ids=None):
    """Ближайший глобальный спикер по косинусу (>= порога). exclude_ids — спикеры,
    уже занятые другой локальной меткой этого же аудио (нельзя переиспользовать).
    Возвращает (Speaker|None, similarity)."""
    if not _valid_embedding(emb):
        return None, -1.0
    exclude_ids = exclude_ids or set()
    emb = _normalize(emb)
    best_sp = None
    best_sim = -1.0
    for sp in db.query(models.Speaker).filter(models.Speaker.embedding.isnot(None)).all():
        if sp.id in exclude_ids or not _valid_embedding(sp.embedding):
            continue
        sim = _cosine_sim(emb, sp.embedding)
        if sim > best_sim:
            best_sim = sim
            best_sp = sp
    if best_sp is not None and best_sim >= MATCH_THRESHOLD:
        return best_sp, best_sim
    return None, best_sim


def _resolve_speakers(db, words, speaker_embeddings=None):
    """Сопоставляет локальные метки диаризации с глобальными спикерами в БД по голосу.

    Гарантия: два РАЗНЫХ локальных голоса одного аудио никогда не схлопываются в
    одного глобального спикера — каждый глобальный спикер занимается максимум одной
    меткой за вызов (жадно, сначала самое сильное совпадение).

    Монологи с одной меткой «Говорящий 1» (без эмбеддинга) переиспользуют одного
    глобального говорящего; в записи с несколькими голосами — отдельные id."""
    speaker_embeddings = speaker_embeddings or {}
    labels = sorted({w.get("speaker") for w in words if w.get("speaker")})
    out = {}
    claimed = set()                       # id глобальных спикеров, занятых в ЭТОМ аудио

    pending = [
        (lbl, speaker_embeddings[lbl])
        for lbl in labels
        if _valid_embedding(speaker_embeddings.get(lbl))
    ]
    pending_labels = {lbl for lbl, _ in pending}
    without_emb = [lbl for lbl in labels if lbl not in pending_labels]

    # Жадное назначение: на каждом шаге берём пару (метка, спикер) с макс. сходством
    # среди ещё не занятых спикеров, фиксируем её и убираем спикера из доступных.
    while pending:
        best = None                       # (sim, idx, label, emb, speaker)
        for idx, (lbl, emb) in enumerate(pending):
            matched, sim = _find_best_speaker_match(db, emb, exclude_ids=claimed)
            if matched is not None and (best is None or sim > best[0]):
                best = (sim, idx, lbl, emb, matched)
        if best is None:
            break                         # оставшимся меткам не с кем сопоставиться
        _sim, idx, lbl, emb, matched = best
        out[lbl] = matched.id
        matched.embedding = _blend_embedding(matched.embedding, emb)
        claimed.add(matched.id)
        pending.pop(idx)

    # Метки без приемлемого совпадения по голосу -> новый глобальный спикер
    for lbl, emb in pending:
        if not is_auto_diarization_label(lbl):
            sp = _speaker_for_custom_label(db, lbl, embedding=emb)
        else:
            sp = _create_speaker(db, _allocate_speaker_label(db), embedding=emb)
        out[lbl] = sp.id
        claimed.add(sp.id)
    for lbl in without_emb:
        if not is_auto_diarization_label(lbl) or _is_singleton_speaker_label(words, lbl):
            sp = _speaker_for_custom_label(db, lbl)
        else:
            sp = _create_speaker(db, _allocate_speaker_label(db))
        out[lbl] = sp.id

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

    ensure_word_speakers(words)
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

    # ВАЖНО: материализуем слова ДО чистки сирот. Сессия создаётся с autoflush=False,
    # поэтому без явного flush слова остаются pending, и только что созданный спикер
    # выглядит «сиротой без слов» -> cleanup_orphan_speakers его удалит, а commit затем
    # вставит слова с уже несуществующим speaker_id (ForeignKeyViolation).
    db.flush()
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

    if ensure_word_speakers(words):
        data["words"] = words
        from backend.src.pipeline import build_sentences
        data["sentences"] = build_sentences(words)
        if write_back_json:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    if not speaker_embeddings:
        speaker_embeddings = compute_speaker_embeddings_from_audio(audio, segments)
        if write_back_json and speaker_embeddings:
            data["speaker_embeddings"] = speaker_embeddings
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

    save_transcription(db, aid, words, segments, stats, speaker_embeddings)


def reconcile_corpus_speaker_labels(db):
    """Синхронизирует Word.speaker_id с words[].speaker из transcription.json.

    Нужно после ручного переименования меток в транскрипции, если вкладка «Говорящие»
    всё ещё показывает отдельные «Говорящий N» вместо заданных имён."""
    from backend.src.services import audio_soft_delete

    query = db.query(models.AudioFile).filter(models.AudioFile.status == "done")
    query = audio_soft_delete.active_audio_filter(query)
    updated = 0

    for audio in query.all():
        json_path = os.path.join(audio.folder_path, "transcription.json")
        if not os.path.exists(json_path):
            continue
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        words = data.get("words") or []
        if not words:
            continue

        speaker_embeddings = data.get("speaker_embeddings") or {}
        if not isinstance(speaker_embeddings, dict):
            speaker_embeddings = {}

        spk_map = _resolve_speakers(db, words, speaker_embeddings)
        aid = UUID(str(audio.id))
        rows = (
            db.query(models.Word)
            .filter(models.Word.audio_id == aid)
            .order_by(models.Word.position)
            .all()
        )
        if len(rows) != len(words):
            continue

        for row, w in zip(rows, words):
            speaker_id = spk_map.get(w.get("speaker"))
            if row.speaker_id != speaker_id:
                row.speaker_id = speaker_id
                updated += 1

    cleanup_orphan_speakers(db)
    return updated
