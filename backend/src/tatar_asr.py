# -*- coding: utf-8 -*-
"""Татарская ASR: Whisper-финетюн yasalma/whisper-finetuned-tt-asr (Whisper-small,
обучен на реальных тат. ASR-датасетах). В отличие от wav2vec2 CTC даёт стандартную
орфографию + пунктуацию + ПРОБЕЛЫ между словами.

Возвращаем слова с приблизительными таймкодами (generate не даёт слов-границ —
равномерно по длине куска). Модель грузится один раз (синглтон). Настройка env:
  TT_ASR_MODEL (по умолчанию 'yasalma/whisper-finetuned-tt-asr'), ASR_DEVICE.
"""
import os
import re

os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("HF_DEACTIVATE_ASYNC_LOAD", "1")   # синхронная загрузка весов (Windows mmap)

SR = 16000
_proc = _model = None

# Редкие одиночные галлюцинации Whisper-TT на неречевых кусках (джинглах).
_HALLUCINATION = {"кайганда", "субтитры", "продолжение"}

# Маркеры runaway-галлюцинаций (как в asr.py для русской ветки).
HALLUCINATION_MARKERS = [
    "субтитр", "продолжение следует", "спасибо за просмотр", "редактор",
    "корректор", "dimatorzok", "создавал", "amara.org", "озвучка",
    "подписывайтесь", "колокольчик",
]

# Допустимые буквы: кириллица (ru/tt) + латиница (редкие заимствования в речи).
_ALLOWED_LETTERS = re.compile(
    r"[a-zA-Z"
    r"а-яА-ЯёЁ"
    r"әөүҗңһӘӨҮҖҢҺ"
    r"]"
)

MAX_WORDS_PER_SEC = float(os.environ.get("TT_ASR_MAX_WORDS_PER_SEC", "4.5"))
MAX_FOREIGN_SCRIPT_RATIO = float(os.environ.get("TT_ASR_MAX_FOREIGN_RATIO", "0.12"))


def _load():
    global _proc, _model
    if _model is not None:
        return
    from transformers import WhisperProcessor, WhisperForConditionalGeneration
    name = os.environ.get("TT_ASR_MODEL", "yasalma/whisper-finetuned-tt-asr")
    _proc = WhisperProcessor.from_pretrained(name)
    _model = WhisperForConditionalGeneration.from_pretrained(name)
    _model.eval()


def ensure_loaded() -> None:
    """Явная загрузка весов (для прогрева до large-v3 в pipeline)."""
    _load()


def max_new_tokens_for_duration(seg_dur: float) -> int:
    """Лимит токенов по длительности куска — не даём generate разрастись до 256."""
    return min(128, max(32, int(seg_dur * 10) + 24))


def foreign_script_ratio(text: str) -> float:
    """Доля букв вне ru/tt/латиницы (иероглифы, корейский и т.п. → галлюцинация)."""
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 0.0
    foreign = sum(1 for c in letters if _ALLOWED_LETTERS.fullmatch(c) is None)
    return foreign / len(letters)


def latin_only_word_ratio(text: str) -> float:
    """Доля «чисто латинских» слов — типичный паттерн runaway на tt-сегменте."""
    words = text.split()
    if not words:
        return 0.0
    latin = 0
    for w in words:
        alpha = "".join(c for c in w if c.isalpha())
        if len(alpha) >= 2 and alpha.isascii() and alpha.isalpha():
            latin += 1
    return latin / len(words)


def is_runaway_output(text: str, seg_dur: float, n_words: int) -> bool:
    """True — декод похож на runaway-галлюцинацию Whisper, результат лучше отбросить."""
    low = (text or "").lower()
    if any(m in low for m in HALLUCINATION_MARKERS):
        return True
    if seg_dur > 0 and n_words / seg_dur > MAX_WORDS_PER_SEC:
        return True
    if foreign_script_ratio(text) > MAX_FOREIGN_SCRIPT_RATIO:
        return True
    if n_words >= 8 and latin_only_word_ratio(text) > 0.55:
        return True
    return False


def _generate(feats, seg_dur: float):
    gen_kw = {
        "max_new_tokens": max_new_tokens_for_duration(seg_dur),
        "num_beams": 5,
        "do_sample": False,
    }
    try:
        return _model.generate(feats, language="tt", task="transcribe", **gen_kw)
    except TypeError:
        return _model.generate(feats, **gen_kw)
    except Exception:
        return _model.generate(feats, max_new_tokens=gen_kw["max_new_tokens"])


def transcribe(chunk, seg_dur: float, sampling_rate: int = SR):
    """chunk (np.float32 моно) -> список слов [{'text','start','end','conf'}].
    Таймкоды относительны началу куска (0..seg_dur)."""
    import torch
    _load()
    feats = _proc(chunk, sampling_rate=sampling_rate, return_tensors="pt").input_features
    with torch.no_grad():
        ids = _generate(feats, seg_dur)
    text = _proc.batch_decode(ids, skip_special_tokens=True)[0].strip()
    toks = [w for w in text.split()
            if any(c.isalpha() for c in w)
            and "".join(c for c in w.lower() if c.isalpha()) not in _HALLUCINATION]
    if is_runaway_output(text, seg_dur, len(toks)):
        return []
    out, n = [], len(toks)
    for i, w in enumerate(toks):
        out.append({"text": w,
                    "start": round(seg_dur * i / n, 3) if n else 0.0,
                    "end": round(seg_dur * (i + 1) / n, 3) if n else 0.0,
                    "conf": None})
    return out
