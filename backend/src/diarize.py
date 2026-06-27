# -*- coding: utf-8 -*-
"""Диаризация: кто говорит. ECAPA-эмбеддинг голоса на каждый речевой сегмент
(speechbrain/spkrec-ecapa-voxceleb, ungated) + агломеративная кластеризация по
косинусу. Число говорящих определяется порогом. Метки анонимные (0,1,2…) —
имена (мама/папа) присваиваются переименованием в UI/БД.

ВАЖНО: speechbrain ломает inspect/warnings главного процесса (ленивые импорты
k2_fsa/wordemb падают и роняют форматирование трейсбеков). Поэтому диаризацию
гоняем В ОТДЕЛЬНОМ ПРОЦЕССЕ (этот модуль как `python -m backend.src.diarize`):
главный ASR-процесс speechbrain не импортирует. При любой ошибке воркера —
говорящие = None (пайплайн не падает).

Настройка env: SPK_EMB_MODEL, DIARIZE_THRESHOLD (по умолч. 0.72), ASR_DEVICE.
"""
import os
import sys
import json

SR = 16000


# --- сторона главного процесса: спавн воркера ------------------------------
def assign_speakers(wav_path, segments, sampling_rate: int = SR):
    """Возвращает список меток говорящих (0,1,2…), выровненный по segments.
    <=1 сегмента -> [0]. Считается в отдельном процессе (изоляция speechbrain)."""
    if not segments:
        return []
    if len(segments) == 1:
        return [0]
    import subprocess
    payload = json.dumps({
        "wav": wav_path,
        "segments": [[int(s["start_sample"]), int(s["end_sample"])] for s in segments],
        "threshold": float(os.environ.get("DIARIZE_THRESHOLD", "0.72")),
        # потолок числа говорящих (семейные записи: мама/папа/ребёнок -> 3)
        "max_speakers": int(os.environ.get("DIARIZE_MAX_SPEAKERS", "3")),
    })
    try:
        p = subprocess.run([sys.executable, "-m", "backend.src.diarize"],
                           input=payload, capture_output=True, text=True,
                           timeout=int(os.environ.get("DIARIZE_TIMEOUT", "900")),
                           env=dict(os.environ), cwd=os.getcwd())
        line = [l for l in p.stdout.splitlines() if l.strip().startswith("[")]
        if line:
            labels = json.loads(line[-1])
            if isinstance(labels, list) and len(labels) == len(segments):
                return labels
    except Exception:
        pass
    return [None] * len(segments)             # мягкая деградация


# --- сторона воркера: эмбеддинги + кластеризация ----------------------------
def _worker():
    import warnings
    warnings.filterwarnings("ignore")
    os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
    import numpy as np
    import torch
    from faster_whisper.audio import decode_audio
    from speechbrain.inference.speaker import EncoderClassifier
    from speechbrain.utils.fetching import LocalStrategy
    from sklearn.cluster import AgglomerativeClustering

    req = json.loads(sys.stdin.read())
    audio = decode_audio(req["wav"], sampling_rate=SR)
    segs = req["segments"]
    name = os.environ.get("SPK_EMB_MODEL", "speechbrain/spkrec-ecapa-voxceleb")
    savedir = os.path.join(os.environ.get("HF_HOME", "."), "spkrec_ecapa")
    enc = EncoderClassifier.from_hparams(source=name, savedir=savedir,
                                         run_opts={"device": os.environ.get("ASR_DEVICE", "cpu")},
                                         local_strategy=LocalStrategy.COPY)
    embs = []
    for a, b in segs:
        sig = torch.tensor(audio[a:b].astype(np.float32)).unsqueeze(0)
        with torch.no_grad():
            v = enc.encode_batch(sig).squeeze().cpu().numpy()
        n = (v ** 2).sum() ** 0.5
        embs.append(v / n if n else v)
    X = np.vstack(embs)
    thr = float(req.get("threshold", 0.72))
    max_spk = max(1, min(int(req.get("max_speakers", 2)), len(X)))
    # авто-число говорящих по порогу...
    labels = list(AgglomerativeClustering(n_clusters=None, distance_threshold=thr,
                                          metric="cosine", linkage="average").fit_predict(X))
    # ...но не больше потолка (домен мама/папа). Оставляем max_spk КРУПНЕЙШИХ кластеров
    # (реальные голоса), а мелкие выбросы (интро/шум) приклеиваем к ближайшему по
    # центроиду — иначе выброс «съел» бы слот и 2 голоса слиплись бы в один.
    from collections import Counter
    if len(set(labels)) > max_spk:
        keep = [c for c, _ in Counter(labels).most_common(max_spk)]
        cents = {}
        for c in keep:
            v = X[[i for i, l in enumerate(labels) if l == c]].mean(0)
            n = (v ** 2).sum() ** 0.5
            cents[c] = v / n if n else v
        labels = [l if l in keep else max(keep, key=lambda c: float(X[i] @ cents[c]))
                  for i, l in enumerate(labels)]
    remap, out = {}, []
    for lbl in labels:
        remap.setdefault(lbl, len(remap))
        out.append(remap[lbl])
    print(json.dumps(out))


if __name__ == "__main__":
    _worker()
