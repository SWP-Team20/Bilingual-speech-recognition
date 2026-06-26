# -*- coding: utf-8 -*-
"""Татарская ASR: Whisper-финетюн yasalma/whisper-finetuned-tt-asr (Whisper-small,
обучен на реальных тат. ASR-датасетах). В отличие от wav2vec2 CTC даёт стандартную
орфографию + пунктуацию + ПРОБЕЛЫ между словами.

Возвращаем слова с приблизительными таймкодами (generate не даёт слов-границ —
равномерно по длине куска). Модель грузится один раз (синглтон). Настройка env:
  TT_ASR_MODEL (по умолчанию 'yasalma/whisper-finetuned-tt-asr'), ASR_DEVICE.
"""
import os

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("HF_DEACTIVATE_ASYNC_LOAD", "1")   # синхронная загрузка весов (Windows mmap)

SR = 16000
_proc = _model = None

# Редкие одиночные галлюцинации Whisper-TT на неречевых кусках (джинглах).
_HALLUCINATION = {"кайганда", "субтитры", "продолжение"}


def _load():
    global _proc, _model
    if _model is not None:
        return
    from transformers import WhisperProcessor, WhisperForConditionalGeneration
    name = os.environ.get("TT_ASR_MODEL", "yasalma/whisper-finetuned-tt-asr")
    _proc = WhisperProcessor.from_pretrained(name)
    _model = WhisperForConditionalGeneration.from_pretrained(name)
    _model.eval()


def transcribe(chunk, seg_dur: float, sampling_rate: int = SR):
    """chunk (np.float32 моно) -> список слов [{'text','start','end','conf'}].
    Таймкоды относительны началу куска (0..seg_dur)."""
    import torch
    _load()
    feats = _proc(chunk, sampling_rate=sampling_rate, return_tensors="pt").input_features
    with torch.no_grad():
        try:
            ids = _model.generate(feats, language="tt", task="transcribe", max_new_tokens=256)
        except Exception:
            ids = _model.generate(feats, max_new_tokens=256)
    text = _proc.batch_decode(ids, skip_special_tokens=True)[0].strip()
    toks = [w for w in text.split()
            if any(c.isalpha() for c in w)
            and "".join(c for c in w.lower() if c.isalpha()) not in _HALLUCINATION]
    out, n = [], len(toks)
    for i, w in enumerate(toks):
        out.append({"text": w,
                    "start": round(seg_dur * i / n, 3) if n else 0.0,
                    "end": round(seg_dur * (i + 1) / n, 3) if n else 0.0,
                    "conf": None})
    return out
