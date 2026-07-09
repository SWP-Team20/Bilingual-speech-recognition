# -*- coding: utf-8 -*-
"""Ручная правка транскрипции (US-010, issue #13): изменить/добавить/удалить слово
и его языковой тег.

Держит в синхроне три вещи:
  1) transcription.json (words + пересобранные sentences) — источник для показа;
  2) transcription.txt — текстовый экспорт «Спикер: текст»;
  3) строки Word в БД (для поиска/фильтров) — точечно, СОХРАНЯЯ speaker_id по позиции
     (правка текста/языка не меняет, кто это сказал; смена метки — см. relabel_speaker_in_audio);
  4) производную статистику (WordCount + метрики аудио) — пересчёт «в реальном времени».

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


def split_input_tokens(raw) -> list:
    """Разбивает ввод по пробелам на отдельные непустые слова."""
    if raw is None:
        return []
    return [token for token in str(raw).split() if token]


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

# Как на фронте: пустой/null speaker в JSON показывается как «Говорящий».
_DEFAULT_SPEAKER_LABEL = "Говорящий"


def _display_speaker_label(raw) -> str:
    if isinstance(raw, str):
        label = raw.strip()
    else:
        label = raw or ""
    return label if label else _DEFAULT_SPEAKER_LABEL


def _json_path(audio):
    return os.path.abspath(os.path.join(audio.folder_path, "transcription.json"))


def _txt_path(audio):
    return os.path.abspath(os.path.join(audio.folder_path, "transcription.txt"))


def _load(audio):
    path = _json_path(audio)
    if not os.path.exists(path):
        raise FileNotFoundError("transcription.json not found")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _write_txt(audio, sentences):
    """Перезаписывает transcription.txt в формате «Спикер: текст»."""
    path = _txt_path(audio)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    lines = []
    for s in sentences or []:
        prefix = f"{_display_speaker_label(s.get('speaker'))}: "
        lines.append(prefix + (s.get("text") or "") + "\n")
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.writelines(lines)
        f.flush()
        os.fsync(f.fileno())


def sync_txt_from_json(audio):
    """Пересобирает transcription.txt из актуального transcription.json (для скачивания)."""
    from backend.src.pipeline import build_sentences

    data = _load(audio)
    words = data.get("words") or []
    sentences = build_sentences(words) if words else (data.get("sentences") or [])
    _write_txt(audio, sentences)
    return _txt_path(audio)


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
    """Пересобирает sentences, пересчитывает статистику, коммитит БД и пишет JSON+TXT.
    Возвращает полезную нагрузку для фронта (words + sentences + stats)."""
    from backend.src.pipeline import build_sentences   # ленивый импорт (тяжёлый пайплайн)

    data["words"] = words
    data["sentences"] = build_sentences(words)
    stats = _recompute_stats(db, audio, words)
    db.commit()

    json_path = _json_path(audio)
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    _write_txt(audio, data["sentences"])
    return {
        "id": str(audio.id),
        "filename": audio.filename,
        "words": words,
        "sentences": data["sentences"],
        "stats": stats,
    }


def _speaker_used_outside_audio(db, speaker_id, audio_id) -> bool:
    """True, если у спикера есть слова в других записях."""
    aid = UUID(str(audio_id))
    return (
        db.query(models.Word.id)
        .filter(models.Word.speaker_id == speaker_id, models.Word.audio_id != aid)
        .first()
        is not None
    )


def _find_speaker_by_label(db, label: str):
    from sqlalchemy import func

    return (
        db.query(models.Speaker)
        .filter(func.lower(models.Speaker.label) == label.lower())
        .first()
    )


def relabel_speaker_in_audio(db, audio, current_label: str, new_label=None, speaker_id=None):
    """Меняет метку говорящего ТОЛЬКО в этой записи.

    - JSON words[].speaker + sentences обновляются;
    - transcription.txt перезаписывается;
    - Word.speaker_id в БД переназначается только для слов этого audio_id;
    - другие аудио не затрагиваются (при необходимости создаётся отдельный Speaker).

    Можно задать либо speaker_id (выбрать существующего), либо new_label
    (новая метка / найти по имени).
    """
    current_label = (current_label or "").strip()
    if not current_label:
        raise ValueError("current_label is required")

    if speaker_id is None and not (new_label and str(new_label).strip()):
        raise ValueError("Укажите new_label или speaker_id")

    data = _load(audio)
    words = data.get("words") or []
    # Совпадает с отображением на фронте: null/"" → «Говорящий»
    matched_positions = [
        i for i, w in enumerate(words)
        if _display_speaker_label(w.get("speaker")) == current_label
    ]
    if not matched_positions:
        raise LookupError("Говорящий с такой меткой не найден в этой записи")

    # Текущий speaker_id берём из БД по первой совпавшей позиции
    old_row = _word_row(db, audio.id, matched_positions[0])
    old_speaker_id = old_row.speaker_id if old_row is not None else None
    old_speaker = (
        db.query(models.Speaker).filter(models.Speaker.id == old_speaker_id).first()
        if old_speaker_id is not None
        else None
    )

    target = None
    if speaker_id is not None:
        target = db.query(models.Speaker).filter(models.Speaker.id == speaker_id).first()
        if target is None:
            raise LookupError("Говорящий не найден")
    else:
        label = str(new_label).strip()
        existing = _find_speaker_by_label(db, label)
        if existing is not None:
            target = existing
        elif old_speaker is not None and not _speaker_used_outside_audio(db, old_speaker.id, audio.id):
            # Спикер только в этом аудио — просто переименовываем запись
            old_speaker.label = label
            target = old_speaker
        else:
            # Спикер общий или отсутствует — создаём отдельную запись для этого аудио
            target = models.Speaker(
                label=label,
                embedding=list(old_speaker.embedding) if old_speaker and old_speaker.embedding else None,
            )
            db.add(target)
            db.flush()

    display_label = target.label

    # Обновляем JSON-метки только в этом файле
    for i in matched_positions:
        words[i]["speaker"] = display_label

    # Переназначаем speaker_id только у слов этой записи с данной меткой
    for pos in matched_positions:
        row = _word_row(db, audio.id, pos)
        if row is not None:
            row.speaker_id = target.id

    # Если старый спикер остался без слов — убираем сироту
    if old_speaker_id is not None and old_speaker_id != target.id:
        still_used = (
            db.query(models.Word.id)
            .filter(models.Word.speaker_id == old_speaker_id)
            .first()
        )
        if still_used is None:
            db.query(models.Speaker).filter(models.Speaker.id == old_speaker_id).delete(
                synchronize_session=False
            )

    return _finalize(db, audio, data, words)


def _db_insert_word_at(db, audio_id, pos, new_w, speaker_id):
    """Сдвигает позиции в БД и добавляет строку Word на индекс pos."""
    aid = UUID(str(audio_id))
    db.query(models.Word).filter(models.Word.audio_id == aid, models.Word.position >= pos).update(
        {models.Word.position: models.Word.position + 1}, synchronize_session=False
    )
    db.add(models.Word(
        audio_id=aid, text=new_w["text"], raw=new_w["raw"],
        start_sec=new_w["start"], end_sec=new_w["end"], language=new_w["lang"],
        confidence=None, position=pos, speaker_id=speaker_id,
    ))


def edit_word(db, audio, position, raw=None, text=None, language=None):
    """Изменить слово по индексу.

    - пустой raw → удалить слово;
    - несколько слов через пробел → первое заменяет текущее, остальные вставляются после;
    - speaker_id сохраняется / наследуется.
    """
    data = _load(audio)
    words = data.get("words") or []
    if not 0 <= position < len(words):
        raise IndexError("position out of range")

    # Пустой ввод при правке = удаление
    if raw is not None and not str(raw).strip():
        mutate_delete(words, position)
        aid = UUID(str(audio.id))
        row = _word_row(db, audio.id, position)
        if row is not None:
            db.delete(row)
        db.query(models.Word).filter(models.Word.audio_id == aid, models.Word.position > position).update(
            {models.Word.position: models.Word.position - 1}, synchronize_session=False
        )
        return _finalize(db, audio, data, words)

    tokens = split_input_tokens(raw) if raw is not None else None
    if tokens is not None:
        old_row = _word_row(db, audio.id, position)
        speaker_id = old_row.speaker_id if old_row is not None else None
        insert_lang = language if language is not None else words[position].get("lang", "unknown")

        w = mutate_edit(words, position, raw=tokens[0], language=language)
        if old_row is not None:
            old_row.text = w["text"]
            old_row.raw = w.get("raw")
            old_row.language = w["lang"]

        for i, token in enumerate(tokens[1:], start=1):
            pos = position + i
            new_w, _ = mutate_insert(words, pos, token, insert_lang)
            _db_insert_word_at(db, audio.id, pos, new_w, speaker_id)

        return _finalize(db, audio, data, words)

    # Только text и/или language без raw
    w = mutate_edit(words, position, text=text, language=language)
    row = _word_row(db, audio.id, position)
    if row is not None:
        row.text = w["text"]
        row.raw = w.get("raw")
        row.language = w["lang"]
    return _finalize(db, audio, data, words)


def insert_word(db, audio, position, raw, language="unknown"):
    """Добавить слово(а) по индексу вставки. Несколько слов через пробел — каждое отдельно.
    speaker_id наследуется от соседа."""
    tokens = split_input_tokens(raw)
    if not tokens:
        raise ValueError("Слово не может быть пустым")

    data = _load(audio)
    words = data.get("words") or []
    position = max(0, min(position, len(words)))

    prev_row = _word_row(db, audio.id, position - 1) if position > 0 else None
    next_row = _word_row(db, audio.id, position)
    speaker_id = prev_row.speaker_id if prev_row is not None else (
        next_row.speaker_id if next_row is not None else None
    )

    for i, token in enumerate(tokens):
        pos = position + i
        new_w, _ = mutate_insert(words, pos, token, language)
        _db_insert_word_at(db, audio.id, pos, new_w, speaker_id)

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
