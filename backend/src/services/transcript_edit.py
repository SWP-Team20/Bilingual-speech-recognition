# -*- coding: utf-8 -*-
"""Ручная правка транскрипции (US-010, issue #13): изменить/добавить/удалить слово
и его языковой тег.

Держит в синхроне три вещи:
  1) transcription.json (words + пересобранные sentences) — источник для показа;
  2) строки Word в БД (для поиска/фильтров) — точечно, СОХРАНЯЯ speaker_id по позиции
     (правка текста/языка не меняет, кто это сказал);
  3) производную статистику (WordCount + метрики аудио) — пересчёт «в реальном времени».

Идентификатор слова = его индекс (position) в массиве words == Word.position в БД.

Чистые функции (mutate_*, compute_stats, normalize_word) не трогают БД и покрыты
юнит-тестами; функции edit_word/insert_word/delete_word связывают их с JSON и БД.
"""
import json
import os
from collections import Counter
from uuid import UUID

from backend.src import models, text_filter

VALID_LANGS = ("ru", "tt", "unknown")


# --- чистая логика (без БД, тестируемая) -----------------------------------

def normalize_word(raw: str) -> str:
    """Нормализованная форма для поиска (как в исходном пайплайне): нижний регистр,
    только буквы."""
    return text_filter.normalize(raw or "")


def normalize_lang(lang) -> str:
    return lang if lang in VALID_LANGS else "unknown"


def mutate_edit(words, position, raw=None, text=None, language=None):
    """Меняет слово по индексу: видимую форму (raw), нормализованную (text) и/или
    языковой тег. Возвращает изменённое слово."""
    if not 0 <= position < len(words):
        raise IndexError("position out of range")
    w = words[position]
    if raw is not None:
        w["raw"] = raw
        if text is None:
            text = normalize_word(raw)
    if text is not None:
        w["text"] = text
    if language is not None:
        w["lang"] = normalize_lang(language)
    w["lang_tuple"] = [w.get("text", ""), w.get("lang", "unknown")]
    return w


def mutate_insert(words, position, raw, language="unknown"):
    """Вставляет новое слово по индексу. Спикер и таймкод наследуются от соседа
    (предыдущего, иначе следующего). Возвращает (слово, фактический_индекс)."""
    position = max(0, min(position, len(words)))
    text = normalize_word(raw)
    lang = normalize_lang(language)
    prev_w = words[position - 1] if position > 0 else None
    next_w = words[position] if position < len(words) else None
    neighbour = prev_w or next_w
    speaker = neighbour.get("speaker") if neighbour else None
    # таймкод: конец предыдущего, иначе начало следующего, иначе 0
    if prev_w is not None:
        ts = prev_w.get("end", 0.0)
    elif next_w is not None:
        ts = next_w.get("start", 0.0)
    else:
        ts = 0.0
    new_w = {
        "text": text, "raw": raw, "start": ts, "end": ts,
        "conf": None, "lang": lang, "seg_lang": lang,
        "speaker": speaker, "lang_tuple": [text, lang],
    }
    words.insert(position, new_w)
    return new_w, position


def mutate_delete(words, position):
    """Удаляет слово по индексу. Возвращает удалённое слово."""
    if not 0 <= position < len(words):
        raise IndexError("position out of range")
    return words.pop(position)


def compute_stats(words, duration_sec):
    """Метрики аудио + распределение по языкам из актуального списка words.
    avg_confidence считается только по словам с известной уверенностью (ручные
    слова без conf не занижают среднее)."""
    lang_counter = Counter(w.get("lang", "unknown") for w in words)
    confs = [w["conf"] for w in words if w.get("conf") is not None]
    n = len(words)
    dur = duration_sec or 0.0
    ru = lang_counter.get("ru", 0)
    tt = lang_counter.get("tt", 0)
    return {
        "total_words": n,
        "unique_words": len({w.get("text", "") for w in words}),
        "words_per_minute": round(n / (dur / 60), 2) if dur else 0.0,
        "ru_words": ru,
        "tt_words": tt,
        "unknown_words": lang_counter.get("unknown", 0),
        "avg_confidence": round(sum(confs) / len(confs), 4) if confs else 0.0,
        "primary_language": "ru" if ru >= tt else "tt",
    }


# --- связка с диском и БД ----------------------------------------------------

def _json_path(audio):
    return os.path.join(audio.folder_path, "transcription.json")


def _load(audio):
    path = _json_path(audio)
    if not os.path.exists(path):
        raise FileNotFoundError("transcription.json not found")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _word_row(db, audio_id, position):
    return (
        db.query(models.Word)
        .filter(models.Word.audio_id == UUID(str(audio_id)), models.Word.position == position)
        .first()
    )


def _recompute_stats(db, audio, words):
    """Перезаписывает WordCount и метрики аудио из актуального списка words."""
    aid = UUID(str(audio.id))
    db.query(models.WordCount).filter(models.WordCount.audio_id == aid).delete(synchronize_session=False)
    counter = Counter()
    for w in words:
        counter[(w.get("text", ""), w.get("lang", "unknown"))] += 1
    for (text, lang), cnt in counter.items():
        db.add(models.WordCount(audio_id=aid, text=text, language=lang, count=cnt))

    stats = compute_stats(words, audio.duration_sec)
    audio.total_words = stats["total_words"]
    audio.unique_words = stats["unique_words"]
    audio.words_per_minute = stats["words_per_minute"]
    audio.ru_words = stats["ru_words"]
    audio.tt_words = stats["tt_words"]
    audio.unknown_words = stats["unknown_words"]
    audio.avg_confidence = stats["avg_confidence"]
    audio.primary_language = stats["primary_language"]
    return stats


def _finalize(db, audio, data, words):
    """Пересобирает sentences, пересчитывает статистику, коммитит БД и пишет JSON.
    Возвращает полезную нагрузку для фронта (words + sentences + stats)."""
    from backend.src.pipeline import build_sentences   # ленивый импорт (тяжёлый пайплайн)

    data["words"] = words
    data["sentences"] = build_sentences(words)
    stats = _recompute_stats(db, audio, words)
    db.commit()
    with open(_json_path(audio), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return {
        "id": str(audio.id),
        "filename": audio.filename,
        "words": words,
        "sentences": data["sentences"],
        "stats": stats,
    }


def edit_word(db, audio, position, raw=None, text=None, language=None):
    """Изменить существующее слово (написание и/или языковой тег). speaker_id не трогаем."""
    data = _load(audio)
    words = data.get("words") or []
    w = mutate_edit(words, position, raw=raw, text=text, language=language)
    row = _word_row(db, audio.id, position)
    if row is not None:
        row.text = w["text"]
        row.raw = w.get("raw")
        row.language = w["lang"]
    return _finalize(db, audio, data, words)


def insert_word(db, audio, position, raw, language="unknown"):
    """Добавить новое слово по индексу. speaker_id наследуется от соседа."""
    data = _load(audio)
    words = data.get("words") or []
    # speaker_id соседа берём ДО сдвига позиций
    prev_row = _word_row(db, audio.id, position - 1) if position > 0 else None
    next_row = _word_row(db, audio.id, position)
    speaker_id = prev_row.speaker_id if prev_row is not None else (
        next_row.speaker_id if next_row is not None else None
    )

    new_w, pos = mutate_insert(words, position, raw, language)

    aid = UUID(str(audio.id))
    db.query(models.Word).filter(models.Word.audio_id == aid, models.Word.position >= pos).update(
        {models.Word.position: models.Word.position + 1}, synchronize_session=False
    )
    db.add(models.Word(
        audio_id=aid, text=new_w["text"], raw=new_w["raw"],
        start_sec=new_w["start"], end_sec=new_w["end"], language=new_w["lang"],
        confidence=None, position=pos, speaker_id=speaker_id,
    ))
    return _finalize(db, audio, data, words)


def delete_word(db, audio, position):
    """Удалить слово по индексу."""
    data = _load(audio)
    words = data.get("words") or []
    mutate_delete(words, position)   # бросит IndexError при плохом индексе

    aid = UUID(str(audio.id))
    row = _word_row(db, audio.id, position)
    if row is not None:
        db.delete(row)
    db.query(models.Word).filter(models.Word.audio_id == aid, models.Word.position > position).update(
        {models.Word.position: models.Word.position - 1}, synchronize_session=False
    )
    return _finalize(db, audio, data, words)
