# -*- coding: utf-8 -*-
"""Фильтр осмысленных слов: отсекает пунктуацию, одиночные символы-мусор и
распознавания с низкой уверенностью."""

MIN_CONFIDENCE = 0.35          # ниже — считаем ненадёжным
SHORT_ALLOWED = {"я", "и", "а", "в", "к", "с", "у", "о"}  # валидные короткие рус. слова


def normalize(word: str) -> str:
    return "".join(ch for ch in word.lower() if ch.isalpha())


def is_meaningful(word: str, confidence: float) -> bool:
    w = normalize(word)
    if not w:
        return False                       # одна пунктуация
    if confidence is not None and confidence < MIN_CONFIDENCE:
        return False                       # слишком неуверенно
    if len(w) == 1 and w not in SHORT_ALLOWED:
        return False                       # одиночная буква-мусор
    return True
