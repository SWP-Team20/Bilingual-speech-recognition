# -*- coding: utf-8 -*-
"""Сквозной mixed-пайплайн обработки одного аудио (ru/tt).

Шаги:
  1. process_silence: декод + неагрессивный VAD -> original_16k.wav, processed.wav,
     карта сегментов, декодированный массив.
  2. По каждому речевому сегменту (дроблённому на под-окна <= WIN_SEC):
       аудио-LID (mms-lid-256) -> язык сегмента ->
       tt: Whisper-TT (tatar_asr) | ru: Whisper large-v3 (asr).
  3. Фильтр осмысленных слов + пословный тег языка (спецбуквы/лексикон/язык сегмента).
  4. Артефакты в storage/<id>/: transcription.json (+ transcription.txt).
  5. (опц.) индексация в БД: слова для поиска, счётчики, метрики, сегменты.

Тяжёлые модели грузятся лениво-синглтонами. Порядок первого использования
(LID -> Whisper-TT -> large-v3) безопасен; CTranslate2 (large-v3) грузится
последним, иначе возможен нативный краш загрузки MMS-моделей.
"""
import os
import json
from uuid import uuid4, UUID

from backend.src import audio_process, asr, tatar_asr, lid, lang_tag, text_filter

SR = 16000
WIN_SEC = int(os.environ.get("ASR_WINDOW_SEC", "25"))   # под-окно для LID/ASR (память + роутинг)
_SENT_END = (".", "?", "!", "…")


def build_sentences(words):
    """Группирует слова в предложения-реплики: новая реплика при смене говорящего
    ИЛИ после слова с финальной пунктуацией (из raw). Каждая реплика несёт спикера,
    язык (ru/tt/mixed) и слова с raw+lang (для покраски по-словно на фронте)."""
    sents, cur = [], None

    def finalize(c):
        ws = c["words"]
        langs = {w["lang"] for w in ws if w["lang"] in ("ru", "tt")}
        lang = "mixed" if len(langs) > 1 else (next(iter(langs), ws[0]["lang"]) if ws else "unknown")
        return {
            "speaker": c["speaker"], "lang": lang,
            "start": ws[0]["start"], "end": ws[-1]["end"],
            "text": " ".join((w.get("raw") or w["text"]) for w in ws),
            "words": [{"raw": w.get("raw") or w["text"], "text": w["text"], "lang": w["lang"]} for w in ws],
        }

    for w in words:
        spk = w.get("speaker")
        if cur is None or cur["speaker"] != spk:
            if cur:
                sents.append(finalize(cur))
            cur = {"speaker": spk, "words": []}
        cur["words"].append(w)
        if (w.get("raw") or "").rstrip().endswith(_SENT_END):
            sents.append(finalize(cur))
            cur = None
    if cur:
        sents.append(finalize(cur))
    return sents


def process_audio(input_path, storage_dir="./storage", audio_id=None,
                  original_filename=None, db=None, language=None):
    """language игнорируется (язык определяется аудио-LID по сегменту);
    параметр оставлен для совместимости вызова из роутера."""
    audio_id = str(audio_id or uuid4())
    folder = os.path.join(storage_dir, audio_id)
    os.makedirs(folder, exist_ok=True)

    # 1. препроцессинг (VAD) + декодированный массив -> processed.wav сохраняется на диск
    proc = audio_process.process_silence(input_path, folder)
    audio = proc["audio"]

    # ОБНОВЛЕНИЕ СТАТУСА: аудио готово (плеер может его грузить), переходим к тексту
    if db is not None:
        from backend.src import models
        try:
            db_audio = db.query(models.AudioFile).filter(models.AudioFile.id == UUID(audio_id)).first()
            if db_audio:
                db_audio.status = "processing_text"
                db.commit()
        except Exception:
            pass  # Игнорируем ошибки БД, чтобы не прерывать пайплайн

    # 2a. диаризация: кто говорит -> метка говорящего на каждый VAD-сегмент.
    seg_speakers = [None] * len(proc["segments"])
    if os.environ.get("ASR_DIARIZE", "1") == "1":
        try:
            print("[Pipeline] Launching speaker diarization step...")
            from backend.src import diarize
            idx = diarize.assign_speakers(proc["original_wav"], proc["segments"])
            seg_speakers = [f"Говорящий {k + 1}" if k is not None else None for k in idx]
            print(f"[Pipeline] Diarization complete. Assigned labels: {seg_speakers}")
        except Exception as diarize_err:
            # Crucial: Log the actual error stack trace to your terminal/logs!
            import traceback
            print(f"[Pipeline DIARIZATION ERROR]: {diarize_err}")
            traceback.print_exc()
    else:
        print("[Pipeline] Speaker diarization is explicitly DISABLED via ASR_DIARIZE env var.")

    # 2-3. посегментная маршрутизация LID -> ASR -> тег (+ говорящий сегмента)
    words = []
    win = int(WIN_SEC * SR)
    for si, s in enumerate(proc["segments"]):
        speaker = seg_speakers[si] if si < len(seg_speakers) else None
        for a in range(s["start_sample"], s["end_sample"], win) or [s["start_sample"]]:
            b = min(a + win, s["end_sample"])
            chunk = audio[a:b].astype("float32")
            sub_dur = (b - a) / SR
            base_off = a / SR
            seg_lang, p_tt, p_ru = lid.detect(chunk)
            if seg_lang == "tt":
                raw = tatar_asr.transcribe(chunk, sub_dur)
            else:
                raw = asr.transcribe_array(chunk, language="ru")
            for w in raw:
                if not text_filter.is_meaningful(w["text"], w["conf"]):
                    continue
                norm, lang = lang_tag.tag_language_seg(w["text"], seg_lang)
                words.append({
                    "text": norm, "raw": w["text"],
                    "start": round(base_off + w["start"], 3),
                    "end": round(base_off + w["end"], 3),
                    "conf": w["conf"], "lang": lang,
                    "seg_lang": seg_lang, "speaker": speaker,
                    "lang_tuple": (norm, lang),
                })

    result = {
        "audio_id": audio_id,
        "filename": original_filename,
        "timeline": "original",
        "engine": "VAD + MMS-LID + Whisper-large-v3(ru) / Whisper-TT(tt)",
        "stats": proc["stats"],
        "segment_map": proc["segments"],
        "sentences": build_sentences(words),
        "words": words,
    }

    # 4. Save physical file artifacts to disk
    with open(os.path.join(folder, "transcription.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
        
    with open(os.path.join(folder, "transcription.txt"), "w", encoding="utf-8") as f:
        for s in result["sentences"]:
            prefix = f"{s['speaker']}: " if s.get("speaker") else ""
            f.write(prefix + s["text"] + "\n")

    # 5. Index inside database AND declare processing completeness
    if db is not None:
        from backend.src import db_index
        try:
            db_index.save_transcription(db, audio_id, words, proc["segments"], proc["stats"])
            
            # --- MOVE THE DONE UPDATE HERE ---
            from backend.src import models
            db_audio = db.query(models.AudioFile).filter(models.AudioFile.id == UUID(audio_id)).first()
            if db_audio:
                db_audio.status = "done"
                db.commit()
                print(f"[Pipeline] Successfully set status to 'done' for {audio_id}")
        except Exception as db_err:
            db.rollback()
            print(f"[Pipeline DB Error] Failed indexing or updating status: {db_err}")

    return result
