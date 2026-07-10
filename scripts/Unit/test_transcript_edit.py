# -*- coding: utf-8 -*-
"""Юнит-тесты чистой логики пословной правки транскрипции (US-010, issue #13).
Покрывают mutate_* и compute_stats без БД и без тяжёлого ASR-пайплайна."""
import pytest

from backend.src.services.transcript_edit import (
    normalize_word, split_input_tokens, mutate_edit, mutate_insert, mutate_delete,
    mutate_bulk_set_language, mutate_bulk_delete, compute_stats,
)

pytestmark = pytest.mark.unit


def _word(raw, text, lang, speaker="Говорящий 1", start=0.0, end=1.0, conf=0.9):
    return {"raw": raw, "text": text, "lang": lang, "seg_lang": lang,
            "speaker": speaker, "start": start, "end": end, "conf": conf,
            "lang_tuple": [text, lang]}


def test_normalize_word_strips_punct_and_lowercases():
    assert normalize_word("Привет!") == "привет"
    assert normalize_word("  Дом,") == "дом"
    assert normalize_word("!!!") == ""


def test_split_input_tokens():
    assert split_input_tokens("привет мир") == ["привет", "мир"]
    assert split_input_tokens("  а   б  ") == ["а", "б"]
    assert split_input_tokens("") == []
    assert split_input_tokens(None) == []
    assert split_input_tokens("одно") == ["одно"]


def test_edit_changes_word_and_language():
    words = [_word("превет", "превет", "ru")]
    mutate_edit(words, 0, raw="Привет", language="tt")
    assert words[0]["raw"] == "Привет"
    assert words[0]["text"] == "привет"          # нормализовано из raw
    assert words[0]["lang"] == "tt"
    assert words[0]["lang_tuple"] == ["привет", "tt"]


def test_edit_language_only_keeps_text():
    words = [_word("сәлам", "сәлам", "ru")]
    mutate_edit(words, 0, language="tt")
    assert words[0]["raw"] == "сәлам"
    assert words[0]["lang"] == "tt"


def test_edit_invalid_language_falls_back_to_unknown():
    words = [_word("дом", "дом", "ru")]
    mutate_edit(words, 0, language="fr")
    assert words[0]["lang"] == "unknown"


def test_edit_out_of_range_raises():
    words = [_word("дом", "дом", "ru")]
    try:
        mutate_edit(words, 5, raw="x")
        assert False, "expected IndexError"
    except IndexError:
        pass


def test_insert_inherits_speaker_from_previous():
    words = [_word("привет", "привет", "ru", speaker="Говорящий 2", start=0.0, end=1.5)]
    new_w, pos = mutate_insert(words, 1, "матур", "tt")
    assert pos == 1
    assert words[1] is new_w
    assert new_w["speaker"] == "Говорящий 2"     # унаследован от соседа слева
    assert new_w["text"] == "матур" and new_w["lang"] == "tt"
    assert new_w["conf"] is None                 # ручное слово без уверенности
    assert new_w["start"] == 1.5                 # таймкод = конец предыдущего


def test_insert_at_start_inherits_from_next():
    words = [_word("привет", "привет", "ru", speaker="Говорящий 3", start=2.0, end=3.0)]
    new_w, pos = mutate_insert(words, 0, "әйдә", "tt")
    assert pos == 0
    assert new_w["speaker"] == "Говорящий 3"
    assert new_w["start"] == 2.0                 # таймкод = начало следующего


def test_insert_clamps_position():
    words = [_word("а", "а", "ru")]
    _, pos = mutate_insert(words, 99, "б", "ru")
    assert pos == 1 and len(words) == 2


def test_display_speaker_label_treats_null_as_default():
    from backend.src.services.transcript_edit import _display_speaker_label

    assert _display_speaker_label(None) == "Говорящий"
    assert _display_speaker_label("") == "Говорящий"
    assert _display_speaker_label("мама") == "мама"


def test_delete_removes_word():
    words = [_word("а", "а", "ru"), _word("б", "б", "tt")]
    removed = mutate_delete(words, 0)
    assert removed["text"] == "а"
    assert [w["text"] for w in words] == ["б"]


def test_bulk_set_language_updates_multiple_words():
    words = [_word("а", "а", "ru"), _word("б", "б", "ru"), _word("в", "в", "tt")]
    changed = mutate_bulk_set_language(words, [0, 2], "tt")
    assert changed == 2
    assert words[0]["lang"] == "tt"
    assert words[1]["lang"] == "ru"
    assert words[2]["lang"] == "tt"


def test_bulk_delete_removes_multiple_words():
    words = [_word("а", "а", "ru"), _word("б", "б", "ru"), _word("в", "в", "tt")]
    removed = mutate_bulk_delete(words, [0, 2])
    assert len(removed) == 2
    assert [w["text"] for w in words] == ["б"]


def test_compute_stats_counts_languages_and_ignores_none_conf():
    words = [
        _word("дом", "дом", "ru", conf=0.8),
        _word("матур", "матур", "tt", conf=0.6),
        _word("дом", "дом", "ru", conf=None),     # ручное слово, дубль
        _word("что", "что", "unknown", conf=None),
    ]
    stats = compute_stats(words, duration_sec=60.0)
    assert stats["total_words"] == 4
    assert stats["unique_words"] == 3             # дом, матур, что
    assert stats["ru_words"] == 2
    assert stats["tt_words"] == 1
    assert stats["unknown_words"] == 1
    assert stats["words_per_minute"] == 4.0       # 4 слова / 1 минута
    assert stats["avg_confidence"] == 0.7         # (0.8+0.6)/2, None игнорируются
    assert stats["primary_language"] == "ru"


def test_compute_stats_empty():
    stats = compute_stats([], duration_sec=0.0)
    assert stats["total_words"] == 0
    assert stats["avg_confidence"] == 0.0
    assert stats["words_per_minute"] == 0.0
