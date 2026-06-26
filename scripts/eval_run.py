# -*- coding: utf-8 -*-
"""Тест-риг ru/tt mixed-пайплайна на наборе аудио (offline-оценка качества).

Использует те же бэкенд-модули, что и прод (backend/src): VAD -> аудио-LID ->
маршрут tt:Whisper-TT / ru:Whisper-large-v3 -> пословный тег. На каждый файл
пишет <name>.json (слова с таймкодами и тегами) и <name>.txt в OUT_DIR.

Запуск:
  python scripts/eval_run.py            # все файлы из SRC_ROOT
  python scripts/eval_run.py <substr>   # только файлы, чьё имя содержит substr
"""
import os, sys, json, shutil, glob, time

os.environ.setdefault("HF_HOME", r"D:\hf_cache")
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("HF_DEACTIVATE_ASYNC_LOAD", "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
sys.path.insert(0, os.getcwd())

import numpy as np
from faster_whisper.audio import decode_audio
from transformers import logging as _hf_logging
_hf_logging.set_verbosity_error()

from backend.src import audio_process, asr, tatar_asr, lid, lang_tag, text_filter

SR = 16000
WIN_SEC = int(os.environ.get("ASR_WINDOW_SEC", "25"))
SRC_ROOT = r"D:\swp\test audios + transcriptions"
OUT_DIR = os.path.join(SRC_ROOT, "_results")
ASCII_DIR = os.path.join(os.environ.get("TEMP", "."), "ru_tt_ascii")


def process_file(src_path):
    name = os.path.splitext(os.path.basename(src_path))[0]
    os.makedirs(ASCII_DIR, exist_ok=True)
    ascii_path = os.path.join(ASCII_DIR, f"{abs(hash(name)) % 10**8}.mp3")
    shutil.copyfile(src_path, ascii_path)               # PyAV не открывает кириллицу

    audio = decode_audio(ascii_path, sampling_rate=SR)
    segs = audio_process.detect_speech_segments(audio)

    words, seg_report = [], []
    win = int(WIN_SEC * SR)
    for s in segs:
        for a in range(s["start_sample"], s["end_sample"], win) or [s["start_sample"]]:
            b = min(a + win, s["end_sample"])
            chunk = audio[a:b].astype(np.float32)
            sub_dur = (b - a) / SR
            base_off = a / SR
            seg_lang, p_tt, p_ru = lid.detect(chunk)
            raw = (tatar_asr.transcribe(chunk, sub_dur) if seg_lang == "tt"
                   else asr.transcribe_array(chunk, language="ru"))
            kept = 0
            for w in raw:
                if not text_filter.is_meaningful(w["text"], w["conf"]):
                    continue
                norm, lang = lang_tag.tag_language_seg(w["text"], seg_lang)
                words.append({
                    "text": norm, "raw": w["text"],
                    "start": round(base_off + w["start"], 3),
                    "end": round(base_off + w["end"], 3),
                    "conf": w["conf"], "seg_lang": seg_lang, "lang": lang,
                })
                kept += 1
            seg_report.append({
                "orig_start": round(base_off, 3), "orig_end": round(b / SR, 3),
                "lid": seg_lang, "p_tt": round(p_tt, 3), "p_ru": round(p_ru, 3),
                "n_words": kept,
            })

    n = len(words)
    tt = sum(1 for w in words if w["lang"] == "tt")
    ru = sum(1 for w in words if w["lang"] == "ru")
    result = {
        "file": os.path.basename(src_path),
        "engine": "VAD + MMS-LID + Whisper-large-v3(ru) / Whisper-TT(tt)",
        "duration_sec": round(len(audio) / SR, 2),
        "n_segments": len(segs), "n_words": n,
        "n_tt": tt, "n_ru": ru, "n_unknown": n - tt - ru,
        "segments": seg_report, "words": words,
    }
    os.makedirs(OUT_DIR, exist_ok=True)
    base = os.path.join(OUT_DIR, name)
    with open(base + ".json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    with open(base + ".txt", "w", encoding="utf-8") as f:
        f.write(" ".join(w["text"] for w in words))
    return result


def main():
    substr = sys.argv[1] if len(sys.argv) > 1 else None
    files = []
    for p in sorted(glob.glob(os.path.join(SRC_ROOT, "**", "*.mp3"), recursive=True)):
        if substr and substr.lower() not in os.path.basename(p).lower():
            continue
        files.append(p)
    print(f"[run] {len(files)} файл(ов). OUT={OUT_DIR}", flush=True)
    for p in files:
        t0 = time.time()
        r = process_file(p)
        print(f"\n=== {r['file']} {r['duration_sec']}s {r['n_segments']}сег "
              f"{r['n_words']}слов tt={r['n_tt']} ru={r['n_ru']} "
              f"({time.time()-t0:.1f}s) ===", flush=True)
        print("TXT:", " ".join(w["text"] for w in r["words"])[:600], flush=True)


if __name__ == "__main__":
    main()
