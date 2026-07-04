# -*- coding: utf-8 -*-
"""Регрессия на FK-баг при создании нового спикера (issue #207).

save_transcription создаёт спикера и flush'ит его, но слова остаются pending
(сессия autoflush=False). Если cleanup_orphan_speakers вызвать ДО commit и без
предварительного flush слов, новый спикер выглядит «сиротой без слов» и удаляется,
а commit затем вставляет слова с несуществующим speaker_id -> ForeignKeyViolation.

Тест проверяет, что два разных голоса (ортогональные эмбеддинги = разные люди из
разных аудио) сохраняются как два РАЗНЫХ спикера без ошибок.

Нужна поднятая БД (docker start pg-container); иначе тест пропускается.
"""
import socket
from uuid import uuid4

import numpy as np
import pytest
from sqlalchemy import text

from backend.src.database import engine, SessionLocal, Base
from backend.src import models, db_index

pytestmark = pytest.mark.integration


def _db_up():
    s = socket.socket()
    s.settimeout(1.5)
    try:
        s.connect((engine.url.host, engine.url.port or 5432))
        return True
    except Exception:
        return False
    finally:
        s.close()


pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(not _db_up(), reason="Postgres is not reachable on 127.0.0.1:15432"),
]


def _emb(seed):
    r = np.random.RandomState(seed).randn(192)
    r /= np.linalg.norm(r)
    return r.tolist()


def test_two_voices_persist_as_distinct_speakers():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE speakers ADD COLUMN IF NOT EXISTS embedding JSON"))
    db = SessionLocal()
    made = []
    try:
        speaker_ids = []
        for emb in (_emb(1), _emb(2)):                 # ортогональные -> разные люди
            aid = uuid4()
            made.append(aid)
            db.add(models.AudioFile(id=aid, filename=f"pytest-spk-{aid}", content_type="audio/wav",
                                    folder_path="/tmp/pytest", duration_sec=10.0, status="done"))
            db.commit()
            words = [{"text": "x", "raw": "X", "start": 0.0, "end": 1.0, "conf": 0.9,
                      "lang": "ru", "speaker": "Говорящий 1"}]
            # не должно бросать ForeignKeyViolation
            db_index.save_transcription(db, aid, words, [], {}, {"Говорящий 1": emb})
            w = db.query(models.Word).filter(models.Word.audio_id == aid).first()
            assert w is not None and w.speaker_id is not None
            assert db.get(models.Speaker, w.speaker_id) is not None   # спикер реально в БД
            speaker_ids.append(w.speaker_id)
        assert speaker_ids[0] != speaker_ids[1]        # два голоса -> два спикера
    finally:
        for aid in made:
            a = db.get(models.AudioFile, aid)
            if a:
                db.delete(a)
        db.commit()
        db_index.cleanup_orphan_speakers(db)
        db.commit()
        db.close()
