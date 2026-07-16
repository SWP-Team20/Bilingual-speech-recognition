# -*- coding: utf-8 -*-
import pytest

from backend.src.db_index import _cosine_sim, _normalize, _resolve_speakers
from backend.src import models

pytestmark = pytest.mark.unit


class FakeSpeaker:
    def __init__(self, id, label, embedding):
        self.id = id
        self.label = label
        self.embedding = embedding


class FakeQuery:
    def __init__(self, speakers, label_filter=None):
        self._speakers = speakers
        self._label_filter = label_filter

    def filter(self, *args, **kwargs):
        label_filter = kwargs.get("label_filter")
        if label_filter is None and args:
            # func.lower(models.Speaker.label) == value.lower()
            for arg in args:
                if hasattr(arg, "right") and hasattr(arg.right, "value"):
                    label_filter = arg.right.value.lower()
        return FakeQuery(self._speakers, label_filter=label_filter)

    def all(self):
        return [sp for sp in self._speakers if sp.embedding is not None]

    def first(self):
        if self._label_filter is not None:
            for sp in self._speakers:
                if (sp.label or "").lower() == self._label_filter:
                    return sp
            return None
        items = self.all()
        return items[0] if items else None


class FakeDB:
    def __init__(self, speakers=None):
        self.speakers = speakers or []
        # id новых спикеров идёт за максимальным уже существующим (как autoincrement в БД)
        self._next_id = max((s.id for s in self.speakers), default=0) + 1
        self.added = []

    def query(self, target):
        if target is models.Speaker:
            return FakeQuery(self.speakers)
        return FakeLabelQuery(self.speakers)

    def add(self, speaker):
        speaker.id = self._next_id
        self._next_id += 1
        self.speakers.append(speaker)
        self.added.append(speaker)

    def flush(self):
        pass


class FakeLabelQuery:
    def __init__(self, speakers):
        self._speakers = speakers

    def all(self):
        return [(sp.label,) for sp in self._speakers]


def test_normalize_unit_vector():
    vec = _normalize([3.0, 4.0])
    assert abs(sum(x * x for x in vec) - 1.0) < 1e-6


def test_cosine_sim_identical_vectors():
    vec = _normalize([1.0, 2.0, 3.0])
    assert abs(_cosine_sim(vec, vec) - 1.0) < 1e-6


def test_resolve_speakers_reuses_similar_embedding():
    existing = FakeSpeaker(1, "Говорящий 1", _normalize([1.0, 0.0, 0.0]))
    db = FakeDB([existing])
    words = [{"speaker": "Говорящий 1"}]
    near = _normalize([0.99, 0.01, 0.0])

    result = _resolve_speakers(db, words, {"Говорящий 1": near})

    assert result["Говорящий 1"] == 1
    assert len(db.added) == 0


def test_resolve_speakers_creates_new_for_different_voice():
    existing = FakeSpeaker(1, "Говорящий 1", _normalize([1.0, 0.0, 0.0]))
    db = FakeDB([existing])
    words = [{"speaker": "Говорящий 1"}]
    different = _normalize([0.0, 1.0, 0.0])

    result = _resolve_speakers(db, words, {"Говорящий 1": different})

    assert result["Говорящий 1"] == 2
    assert len(db.added) == 1
    assert db.added[0].label == "Говорящий 2"


def test_resolve_speakers_without_embedding_reuses_singleton_auto_label():
    existing = FakeSpeaker(1, "Говорящий 1", _normalize([1.0, 0.0, 0.0]))
    db = FakeDB([existing])
    words = [{"speaker": "Говорящий 1"}]

    result = _resolve_speakers(db, words, {})

    assert result["Говорящий 1"] == 1
    assert len(db.added) == 0


def test_singleton_auto_label_reuses_across_audios():
    db = FakeDB([])
    words1 = [{"speaker": "Говорящий 1"}]
    words2 = [{"speaker": "Говорящий 1"}, {"speaker": "Говорящий 1"}]

    r1 = _resolve_speakers(db, words1, {})
    r2 = _resolve_speakers(db, words2, {})

    assert r1["Говорящий 1"] == r2["Говорящий 1"]
    assert len(db.added) == 1
    assert db.added[0].label == "Говорящий 1"


def test_multi_auto_labels_without_embedding_allocate_separately():
    db = FakeDB([])
    words = [{"speaker": "Говорящий 1"}, {"speaker": "Говорящий 2"}]

    result = _resolve_speakers(db, words, {})

    assert result["Говорящий 1"] != result["Говорящий 2"]
    assert len(db.added) == 2
    assert {sp.label for sp in db.added} == {"Говорящий 1", "Говорящий 2"}


def test_resolve_speakers_reuses_custom_label_without_embedding():
    existing = FakeSpeaker(1, "мама", None)
    db = FakeDB([existing])
    words = [{"speaker": "Мама"}]

    result = _resolve_speakers(db, words, {})

    assert result["Мама"] == 1
    assert len(db.added) == 0


def test_resolve_speakers_creates_custom_label_once():
    db = FakeDB([])
    words = [{"speaker": "папа"}, {"speaker": "папа"}]

    result = _resolve_speakers(db, words, {})

    assert result["папа"] == 1
    assert len(db.added) == 1
    assert db.added[0].label == "папа"


def test_find_best_speaker_match_skips_null_embedding():
    from backend.src.db_index import _find_best_speaker_match

    db = FakeDB([FakeSpeaker(1, "Говорящий 1", None)])
    matched, sim = _find_best_speaker_match(db, [1.0, 0.0, 0.0])
    assert matched is None
    assert sim == -1.0


def test_two_local_voices_never_merge_into_one_speaker():
    """Два разных голоса ОДНОГО аудио, оба близких к единственному глобальному
    спикеру, не должны схлопнуться в него — иначе диаризация (2 человека)
    противоречила бы БД (1 человек)."""
    existing = FakeSpeaker(1, "Говорящий 1", _normalize([1.0, 0.0, 0.0]))
    db = FakeDB([existing])
    words = [{"speaker": "Говорящий 1"}, {"speaker": "Говорящий 2"}]
    embeddings = {
        "Говорящий 1": _normalize([0.99, 0.14, 0.0]),   # оба близки к existing (cos ~0.99)
        "Говорящий 2": _normalize([0.99, 0.0, 0.14]),
    }

    result = _resolve_speakers(db, words, embeddings)

    # разные глобальные id — голоса не слились
    assert result["Говорящий 1"] != result["Говорящий 2"]
    # один занял существующего спикера, второй завёл нового
    assert set(result.values()) == {1, 2}
    assert len(db.added) == 1


def test_two_distinct_new_voices_get_two_speakers():
    """Пустой корпус: два непохожих голоса -> два новых глобальных спикера."""
    db = FakeDB([])
    words = [{"speaker": "Говорящий 1"}, {"speaker": "Говорящий 2"}]
    embeddings = {
        "Говорящий 1": _normalize([1.0, 0.0, 0.0]),
        "Говорящий 2": _normalize([0.0, 1.0, 0.0]),
    }

    result = _resolve_speakers(db, words, embeddings)

    assert result["Говорящий 1"] != result["Говорящий 2"]
    assert len(db.added) == 2
