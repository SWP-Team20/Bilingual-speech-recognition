# Russian/Tatar Recognition Pipeline

This document describes the production pipeline in `backend/src/pipeline.py`, the quality harness in `scripts/QualityRequirements/transcription_quality_test.py`, and the main extension points for future ASR improvements.

## End-to-End Flow

The production application and the quality harness use the same ASR/LID/tagging modules. Uploaded audio is processed through the following chain:

```text
uploaded file: storage/<audio_id>/original.<ext>
  -> audio_process.process_silence
       -> decode to 16 kHz mono
       -> write original_16k.wav
       -> run non-aggressive VAD
       -> write processed.wav
       -> produce speech segment map
  -> optional ECAPA diarization
       -> local labels such as "Speaker 1", "Speaker 2"
       -> speaker embeddings for cross-audio matching
  -> split speech segments into windows <= ASR_WINDOW_SEC (default 25 s)
  -> for each window:
       -> audio LID with facebook/mms-lid-256
       -> tt -> Tatar Whisper model
       -> ru -> faster-whisper large-v3 with language=ru
       -> text_filter removes low-confidence/noise tokens
       -> lang_tag assigns per-word ru/tt/unknown tags
  -> sentence_builder groups words into sentences
  -> write transcription.json and transcription.txt
  -> db_index.save_transcription persists words, speakers, segments, counts, metrics
  -> audio_files.status becomes done
```

The upload API returns `202 Accepted` before this pipeline finishes. Processing runs in a FastAPI background task.

## Status Lifecycle

The backend stores processing state in `audio_files.status`:

- `processing_audio` after upload and before VAD/preprocessing is complete;
- `processing_text` after processed audio is available and ASR starts;
- `done` after transcript artifacts and database indexes are written;
- `error` if the background task raises an exception.

## Model Routing

### Audio Language Identification

`backend/src/lid.py` uses `facebook/mms-lid-256`. For each audio window, it compares the Tatar (`tat`) and Russian (`rus`) probabilities and routes the window to the higher one. It intentionally compares only those two languages instead of using global top-1 over all 256 labels.

Environment variables:

- `LID_MODEL` default: `facebook/mms-lid-256`
- `ASR_DEVICE`

### Russian ASR

`backend/src/asr.py` uses faster-whisper. Defaults:

- `WHISPER_MODEL=large-v3`
- `WHISPER_DEVICE=cpu`
- `WHISPER_COMPUTE=int8` on CPU, `float16` otherwise

It runs with `language="ru"` for Russian-routed windows and word timestamps enabled.

### Tatar ASR

`backend/src/tatar_asr.py` uses a fine-tuned Whisper model. Defaults:

- `TT_ASR_MODEL=yasalma/whisper-finetuned-tt-asr`
- `ASR_DEVICE`

The Tatar model returns text without real word-level timestamps, so the implementation distributes approximate word timecodes across the ASR window.

## Diarization

If `ASR_DIARIZE=1` (default), `backend/src/diarize.py` assigns speakers to VAD segments using `speechbrain/spkrec-ecapa-voxceleb` embeddings and clustering. The pipeline stores local labels in transcript words and speaker embeddings in `transcription.json`.

`db_index.save_transcription` maps local labels to global `speakers` rows. Existing global speakers can be reused when voice embeddings pass the match threshold.

Relevant environment variables:

- `ASR_DIARIZE=0` disables diarization.
- `DIARIZE_THRESHOLD` controls clustering.
- `DIARIZE_MAX_SPEAKERS` caps clusters.
- `DIARIZE_MATCH_THRESHOLD` controls cross-audio global speaker matching.

If diarization is unavailable or returns no labels, the pipeline falls back to a default local speaker label so words still have a usable speaker value.

## Per-Word Language Tags

`backend/src/lang_tag.py` assigns word language with this priority:

1. Tatar-specific Cyrillic letters -> `tt`.
2. Tatar word list in `backend/src/data/tatar_wordlist.txt` -> `tt`.
3. Segment language from audio LID -> `ru` or `tt`.
4. Fallback -> `ru`.

The word list is important for Tatar words written only with Russian Cyrillic letters. Do not add ambiguous words that are also common Russian words, or Russian words will be mislabeled as Tatar.

## Hallucination and Noise Filtering

The Russian and Tatar ASR wrappers remove common hallucination markers such as subtitle/editorial text. `backend/src/text_filter.py` also drops low-confidence or non-meaningful tokens before indexing.

## Transcript Grouping

`sentence_builder.build_sentences` groups words into `sentences[]`. New sentences are created on speaker changes and final punctuation boundaries. `transcription.txt` is then written one sentence per line with an optional speaker prefix.

## Evaluation Harness

Run the manual ASR quality harness with:

```bash
python scripts/QualityRequirements/transcription_quality_test.py
```

This is not a CI gate because it depends on local ML models and audio assets. It is still the main manual check for ASR quality changes.

## Extension Points

- Replace `TT_ASR_MODEL` with a stronger Tatar Whisper model and run the harness before adoption.
- Fine-tune a Tatar model on corrected transcript/audio pairs.
- Replace MMS-LID with a dedicated Russian/Tatar classifier if routing becomes the main accuracy limit.
- Extend `backend/src/data/tatar_wordlist.txt` for unambiguous Tatar words written in Russian Cyrillic.
