# -*- coding: utf-8 -*-
"""Запись результата транскрипции в БД: слова (для поиска), счётчики вхождений,
метрики аудио, карта сегментов. DB-агностично: работает с любой SQLAlchemy-сессией."""

from collections import Counter
from backend.src import models


def save_transcription(db, audio_id, words, segments, stats):
    """words: [{'text','start','end','conf','lang'}]; segments: карта VAD;
    stats: dict из audio_process.process_silence()['stats']."""

    # --- слова (место для всех слов, для поиска) ---
    counter = Counter()
    lang_counter = Counter()
    conf_sum = 0.0
    for i, w in enumerate(words):
        db.add(models.Word(
            audio_id=audio_id, text=w["text"], start_sec=w["start"],
            end_sec=w["end"], language=w["lang"], confidence=w["conf"],
            position=i,
        ))
        counter[(w["text"], w["lang"])] += 1
        lang_counter[w["lang"]] += 1
        conf_sum += w["conf"] or 0.0

    # --- счётчики вхождений каждого слова в этом аудио ---
    for (text, lang), cnt in counter.items():
        db.add(models.WordCount(audio_id=audio_id, text=text, language=lang, count=cnt))

    # --- метрики аудио (US-006) ---
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

    # --- карта сегментов ---
    for s in segments:
        db.add(models.SpeechSegment(
            audio_id=audio_id, orig_start=s["orig_start"], orig_end=s["orig_end"],
            trim_start=s["trim_start"], trim_end=s["trim_end"],
        ))

    db.commit()
