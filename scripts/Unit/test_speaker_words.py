# -*- coding: utf-8 -*-
import pytest
from uuid import uuid4

from backend.src.services.speaker_words import compute_speaker_word_hits

pytestmark = pytest.mark.unit


class FakeSpeaker:
    def __init__(self, speaker_id, label):
        self.id = speaker_id
        self.label = label


class FakeWord:
    def __init__(self, audio_id, position, text="слово", speaker_id=1):
        self.audio_id = audio_id
        self.position = position
        self.text = text
        self.raw = text
        self.language = "ru"
        self.start_sec = float(position)
        self.end_sec = float(position) + 0.5
        self.confidence = 0.9
        self.speaker_id = speaker_id


class FakeAudio:
    def __init__(self, audio_id, filename="test.wav"):
        self.id = audio_id
        self.filename = filename
        self.recorded_at = None
        self.uploaded_at = None
        self.deleted_at = None
        self.status = "done"


class FakeQuery:
    def __init__(self, rows):
        self._rows = rows

    def join(self, *args, **kwargs):
        return self

    def filter(self, *args, **kwargs):
        return self

    def with_entities(self, *args, **kwargs):
        return self

    def scalar(self):
        return len(self._rows)

    def order_by(self, *args, **kwargs):
        return self

    def offset(self, n):
        self._rows = self._rows[n:]
        return self

    def limit(self, n):
        self._rows = self._rows[:n]
        return self

    def all(self):
        return self._rows


class FakeDb:
    def __init__(self, speaker, rows):
        self.speaker = speaker
        self.rows = rows

    def query(self, *entities):
        if entities[0].__name__ == "Speaker":
            return FakeSpeakerQuery(self.speaker)
        return FakeQuery(self.rows)


class FakeSpeakerQuery:
    def __init__(self, speaker):
        self.speaker = speaker

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self.speaker


def test_compute_speaker_word_hits_returns_none_for_missing_speaker():
    db = FakeDb(None, [])
    assert compute_speaker_word_hits(db, 99) is None


def test_compute_speaker_word_hits_maps_rows(monkeypatch):
    speaker = FakeSpeaker(1, "мама")
    aid = uuid4()
    rows = [(FakeWord(aid, 0), FakeAudio(aid, "clip.wav"))]
    db = FakeDb(speaker, rows)

    monkeypatch.setattr(
        "backend.src.services.speaker_words.audio_soft_delete.active_audio_filter",
        lambda q: q,
    )
    monkeypatch.setattr(
        "backend.src.services.speaker_words.apply_date_filters",
        lambda q, f: q,
    )

    result = compute_speaker_word_hits(db, 1, limit=10, offset=0)
    assert result is not None
    assert result.speaker_label == "мама"
    assert result.total == 1
    assert len(result.items) == 1
    assert result.items[0].audio_filename == "clip.wav"
    assert result.items[0].position == 0
