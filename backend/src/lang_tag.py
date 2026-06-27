# -*- coding: utf-8 -*-
"""Пословное определение языка: русский / татарский.

Стратегия (от самого надёжного сигнала к слабому):
  1. Спецбуквы татарского (ә ө ү җ ң һ) — их нет в русском алфавите -> 'tt'.
  2. Словарь татарских слов (builtin + опциональный файл) -> 'tt'.
  3. Кириллическое слово без татарских признаков -> 'ru' (основной язык корпуса).
  4. Иначе -> 'unknown'.

tag_language возвращает кортеж (нормализованное_слово, язык).
"""

import os

# Буквы, которые есть только в татарском кириллическом алфавите
TATAR_ONLY_CHARS = set("әөүҗңһ")  # U+04D9 04E9 04AF 0497 04A3 04BB

RU_ALPHA = set("абвгдеёжзийклмнопрстуфхцчшщъыьэюя")

# Небольшой базовый словник частых татарских слов (для MVP/демо).
# В проде подгружается полный список из data/tatar_wordlist.txt
_BUILTIN_TATAR = {
    "әйдә", "малай", "матур", "бар", "юк", "әти", "әни", "бала", "су",
    "икмәк", "рәхмәт", "сәлам", "кил", "кит", "аша", "йокла", "уйна",
    "зур", "кечкенә", "яхшы", "начар", "кызым", "улым", "апа", "абый",
}

_tatar_words = set(_BUILTIN_TATAR)


def load_tatar_wordlist(path: str) -> int:
    """Догружает татарский словник из файла (по слову на строку).
    Пустые строки и комментарии (#) пропускаются."""
    if not os.path.exists(path):
        return 0
    added = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            w = line.strip().lower()
            if w and not w.startswith("#"):
                _tatar_words.add(w)
                added += 1
    return added


# Автозагрузка словника из data/tatar_wordlist.txt при импорте модуля.
_DEFAULT_WORDLIST = os.path.join(os.path.dirname(__file__), "data", "tatar_wordlist.txt")
load_tatar_wordlist(_DEFAULT_WORDLIST)


def _clean(word: str) -> str:
    return "".join(ch for ch in word.lower() if ch.isalpha())


def has_tatar_letters(word: str) -> bool:
    return any(ch in TATAR_ONLY_CHARS for ch in word.lower())


def tag_language(word: str) -> tuple:
    """Возвращает кортеж (нормализованное_слово, язык)."""
    w = _clean(word)
    if not w:
        return (word, "unknown")
    if has_tatar_letters(w):
        return (w, "tt")
    if w in _tatar_words:
        return (w, "tt")
    if all(ch in RU_ALPHA for ch in w):
        return (w, "ru")
    return (w, "unknown")


def tag_language_seg(word: str, seg_lang: str) -> tuple:
    """Тег с учётом языка сегмента из аудио-LID (mixed-пайплайн).

    Приоритет: спецбуквы -> tt; лексикон -> tt; иначе язык сегмента (LID);
    в крайнем случае -> ru. seg_lang ловит татарские слова, записанные русскими
    буквами и не попавшие в лексикон (по акустике сегмента).
    """
    w = _clean(word)
    if not w:
        return (word, "unknown")
    if has_tatar_letters(w):
        return (w, "tt")
    if w in _tatar_words:
        return (w, "tt")
    if seg_lang in ("ru", "tt"):
        return (w, seg_lang)
    return (w, "ru")
