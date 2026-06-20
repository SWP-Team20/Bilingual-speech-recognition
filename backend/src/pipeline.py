# -*- coding: utf-8 -*-
"""Сквозной пайплайн обработки одного аудио.

Шаги:
  1. process_silence: декод + неагрессивный VAD -> original_16k.wav, processed.wav, карта сегментов.
  2. transcribe(ОРИГИНАЛ): слова с таймкодами (координаты оригинала).
  3. фильтр осмысленных слов + тег языка (ru/tt) кортежем.
  4. артефакты в storage/<id>/: transcription.json (+ transcription.txt).
  5. (опц.) индексация в БД: слова для поиска, счётчики, метрики, сегменты.
"""

import os
import json
from uuid import uuid4

from backend.src import audio_process, asr, lang_tag, text_filter


def process_audio(input_path, storage_dir="./storage", audio_id=None,
                  original_filename=None, db=None, language="ru"):
    audio_id = str(audio_id or uuid4())
    folder = os.path.join(storage_dir, audio_id)
    os.makedirs(folder, exist_ok=True)

    # 1. препроцессинг (VAD)
    proc = audio_process.process_silence(input_path, folder)

    # 2. транскрипция ОРИГИНАЛА (таймкоды в координатах оригинала)
    raw_words = asr.transcribe(proc["original_wav"], language=language, vad_filter=True)

    # 3. только осмысленные слова + тег языка (кортеж word/lang)
    words = []
    for w in raw_words:
        if not text_filter.is_meaningful(w["text"], w["conf"]):
            continue
        norm, lang = lang_tag.tag_language(w["text"])
        words.append({
            "text": norm, "raw": w["text"],
            "start": w["start"], "end": w["end"],
            "conf": w["conf"], "lang": lang,
            "lang_tuple": (norm, lang),
        })

    result = {
        "audio_id": audio_id,
        "filename": original_filename,
        "timeline": "original",            # транскрипция по оригиналу
        "stats": proc["stats"],
        "segment_map": proc["segments"],
        "words": words,
    }

    # 4. артефакты
    with open(os.path.join(folder, "transcription.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    with open(os.path.join(folder, "transcription.txt"), "w", encoding="utf-8") as f:
        f.write(" ".join(w["text"] for w in words))

    # 5. индексация в БД (если передана сессия)
    if db is not None:
        from backend.src import db_index
        db_index.save_transcription(db, audio_id, words, proc["segments"], proc["stats"])

    return result
