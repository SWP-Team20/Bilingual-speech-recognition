# -*- coding: utf-8 -*-
"""Аудио-LID (определение языка по звуку) для маршрутизации сегмента ru/tt.

Движок: facebook/mms-lid-256 (Wav2Vec2 классификатор на 256 языков). По куску
волны сравниваем вероятности татарского (tat) и русского (rus) и выбираем язык.
Модель грузится один раз (синглтон). Настройка через env:
  LID_MODEL (по умолчанию 'facebook/mms-lid-256'), ASR_DEVICE ('cpu'/'cuda').
"""
import os

# конфликт дублирующихся OpenMP-рантаймов (CTranslate2 + torch) -> нативный краш
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
# синхронная загрузка весов transformers: на Windows многопоточная материализация
# (spawn_materialize) даёт access violation при чтении mmap safetensors. См. docs.
os.environ.setdefault("HF_DEACTIVATE_ASYNC_LOAD", "1")

SR = 16000
_fe = _model = None
_i_ru = _i_tt = None


def _load():
    global _fe, _model, _i_ru, _i_tt
    if _model is not None:
        return
    import torch  # noqa: F401  (нужен в detect)
    from transformers import AutoFeatureExtractor, Wav2Vec2ForSequenceClassification
    name = os.environ.get("LID_MODEL", "facebook/mms-lid-256")
    _fe = AutoFeatureExtractor.from_pretrained(name)
    _model = Wav2Vec2ForSequenceClassification.from_pretrained(name)
    _model.eval()
    id2label = _model.config.id2label
    _i_ru = next((i for i, l in id2label.items() if str(l).lower().startswith("rus")), None)
    _i_tt = next((i for i, l in id2label.items() if str(l).lower().startswith("tat")), None)


def detect(chunk, sampling_rate: int = SR):
    """Возвращает (lang, p_tt, p_ru): lang in {'tt','ru'} по сравнению tat vs rus.

    Сравниваем именно эти два языка, а не общий argmax по 256 — иначе близкий
    тюркский (башкирский/казахский) может перетянуть top-1.
    """
    import torch
    _load()
    inp = _fe(chunk, sampling_rate=sampling_rate, return_tensors="pt")
    with torch.no_grad():
        logits = _model(**inp).logits
    p = torch.softmax(logits, dim=-1)[0]
    p_tt = float(p[_i_tt]) if _i_tt is not None else 0.0
    p_ru = float(p[_i_ru]) if _i_ru is not None else 0.0
    return ("tt" if p_tt >= p_ru else "ru"), p_tt, p_ru
