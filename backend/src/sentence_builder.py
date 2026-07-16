# -*- coding: utf-8 -*-
"""Сборка предложений из списка слов (без импорта ML-пайплайна)."""

_SENT_END = (".", "?", "!", "…")


def build_sentences(words):
    """Группирует слова в предложения-реплики: новая реплика при смене говорящего
    ИЛИ после слова с финальной пунктуацией (из raw)."""
    sents, cur = [], None

    def finalize(c):
        ws = c["words"]
        langs = {w["lang"] for w in ws if w["lang"] in ("ru", "tt")}
        lang = "mixed" if len(langs) > 1 else (next(iter(langs), ws[0]["lang"]) if ws else "unknown")
        return {
            "speaker": c["speaker"], "lang": lang,
            "start": ws[0]["start"], "end": ws[-1]["end"],
            "text": " ".join((w.get("raw") or w["text"]) for w in ws),
            "words": [{"raw": w.get("raw") or w["text"], "text": w["text"], "lang": w["lang"]} for w in ws],
        }

    for w in words:
        spk = w.get("speaker")
        if cur is None or cur["speaker"] != spk:
            if cur:
                sents.append(finalize(cur))
            cur = {"speaker": spk, "words": []}
        cur["words"].append(w)
        if (w.get("raw") or "").rstrip().endswith(_SENT_END):
            sents.append(finalize(cur))
            cur = None
    if cur:
        sents.append(finalize(cur))
    return sents
