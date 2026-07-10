# -*- coding: utf-8 -*-
"""Тесты стека отмены удаления слов в транскрипции."""
import json
import os
import tempfile
import pytest

from backend.src.services import transcript_edit

pytestmark = pytest.mark.unit


def _word(raw, text, lang):
    return {
        "raw": raw, "text": text, "lang": lang, "seg_lang": lang,
        "speaker": "Говорящий 1", "start": 0.0, "end": 1.0, "conf": 0.9,
        "lang_tuple": [text, lang],
    }


class _FakeAudio:
    def __init__(self, folder):
        self.id = "00000000-0000-0000-0000-000000000001"
        self.folder_path = folder
        self.filename = "test.wav"
        self.duration_sec = 10.0


def test_undo_stack_push_and_depth(tmp_path):
    folder = str(tmp_path)
    audio = _FakeAudio(folder)
    data = {"words": [_word("привет", "привет", "ru")]}

    transcript_edit._push_undo_snapshot(None, audio, data)
    assert transcript_edit.undo_stack_depth(audio) == 1

    data["words"] = []
    transcript_edit._push_undo_snapshot(None, audio, data)
    assert transcript_edit.undo_stack_depth(audio) == 2


def test_undo_stack_respects_max_depth(tmp_path, monkeypatch):
    monkeypatch.setattr(transcript_edit, "TRANSCRIPT_UNDO_MAX", 2)
    folder = str(tmp_path)
    audio = _FakeAudio(folder)

    for i in range(4):
        transcript_edit._push_undo_snapshot(None, audio, {"words": [_word(str(i), str(i), "ru")]})

    stack = transcript_edit._load_undo_stack(audio)
    assert len(stack) == 2
    assert stack[0]["words"][0]["raw"] == "2"
    assert stack[1]["words"][0]["raw"] == "3"


def test_load_undo_stack_handles_corrupt_file(tmp_path):
    folder = str(tmp_path)
    audio = _FakeAudio(folder)
    path = transcript_edit._undo_stack_path(audio)
    with open(path, "w", encoding="utf-8") as f:
        f.write("not json")

    assert transcript_edit._load_undo_stack(audio) == []
