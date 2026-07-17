# Storage and Search

This document describes what is stored for each recording, how transcript artifacts are structured, and which fields are used for corpus search.

## Storage Split

The application deliberately separates large artifacts from searchable metadata.

| Data | Location |
|---|---|
| Uploaded original audio as `original.<ext>` | Disk: `storage/<audio_id>/` |
| Normalized 16 kHz audio as `original_16k.wav` | Disk: `storage/<audio_id>/` |
| VAD-processed audio as `processed.wav` | Disk: `storage/<audio_id>/` |
| Full transcript artifacts: `transcription.json`, `transcription.txt` | Disk: `storage/<audio_id>/` |
| Recording metadata, processing status, metrics, word index, speakers, VAD segments | PostgreSQL |

PostgreSQL is the searchable index and metadata store. The filesystem holds the heavier audio and transcript artifacts.

## Transcript Artifacts

### `transcription.json`

`transcription.json` is the source artifact for the processed transcript. It contains:

- `audio_id`
- `filename`
- `timeline` set to `original`
- `engine`
- `stats`
- `segment_map`
- optional `speaker_embeddings`
- `words`
- `sentences`

Typical word shape:

```json
{
  "text": "station",
  "raw": "Station,",
  "start": 4.12,
  "end": 4.63,
  "conf": 0.91,
  "lang": "ru",
  "seg_lang": "ru",
  "speaker": "Speaker 1"
}
```

| Field | Meaning |
|---|---|
| `text` | Normalized word used for search: lower-case letters only. |
| `raw` | ASR output used for display, preserving punctuation/case when available. |
| `start`, `end` | Word timecodes in original-audio coordinates. |
| `conf` | ASR confidence. Tatar Whisper output can have `null`. |
| `lang` | Per-word language tag: `ru`, `tt`, or `unknown`. |
| `seg_lang` | Audio language ID result for the ASR chunk. |
| `speaker` | Local speaker label from diarization or fallback. |

### `transcription.txt`

`transcription.txt` is a line-based readable export generated from transcript sentences:

```text
Speaker 1: first sentence text
Speaker 2: second sentence text
```

The download endpoint regenerates TXT from the current JSON when possible, so recent word and speaker edits are reflected.

## PostgreSQL Tables

### `users`

Application users and roles.

| Field | Meaning |
|---|---|
| `id` | UUID primary key. |
| `username` | Unique login name. |
| `hashed_password` | Password hash. |
| `role` | `user`, `manager`, or `admin`. |
| `created_at` | Creation timestamp. |
| `deleted_at` | Soft-delete marker for the 60-second restore window. |

### `audio_files`

One row per recording.

| Field | Meaning |
|---|---|
| `id` | UUID primary key. |
| `filename` | Display title; unique case-insensitively at upload/update time. |
| `content_type` | Uploaded media MIME type. |
| `uploaded_at` | Upload timestamp. |
| `recorded_at` | Optional recording date used by date filters. |
| `folder_path` | Path to `storage/<audio_id>/`. |
| `primary_language` | Dominant language based on indexed word counts. |
| `status` | `processing_audio`, `processing_text`, `done`, or `error`. |
| `deleted_at` | Soft-delete marker for the 60-second restore window. |
| `duration_sec`, `speech_sec`, `silence_removed_sec` | Audio duration metrics. |
| `total_words`, `unique_words`, `words_per_minute` | Transcript metrics. |
| `ru_words`, `tt_words`, `unknown_words` | Language split. |
| `avg_confidence` | Average word confidence. |

### `words`

One row per word. This is the core corpus search index.

| Field | Meaning |
|---|---|
| `id` | Integer primary key. |
| `audio_id` | Recording UUID. |
| `text` | Normalized searchable word. |
| `raw` | Display form from ASR or manual edits. |
| `start_sec`, `end_sec` | Original-audio timecodes. |
| `language` | `ru`, `tt`, or `unknown`. |
| `confidence` | ASR confidence. |
| `position` | Word order inside the audio. |
| `speaker_id` | Linked speaker; nullable. |

### `speakers`

Global speakers across the corpus.

| Field | Meaning |
|---|---|
| `id` | Integer primary key. |
| `label` | Display label, such as `Speaker 1`, `mother`, or `child`. |
| `embedding` | Optional normalized voice centroid for cross-audio matching. |
| `created_at` | Creation timestamp. |

### `word_counts`

Per-recording word frequencies used by statistics:

`id`, `audio_id`, `text`, `language`, `count`.

### `speech_segments`

VAD segment map used to relate original and processed audio coordinates:

`id`, `audio_id`, `orig_start`, `orig_end`, `trim_start`, `trim_end`.

## Search Filters

The shared filter implementation is `backend/src/services/audio_filter.py`. It is used by:

- `GET /api/v1/audio/`
- `GET /api/v1/search/`
- `GET /api/v1/transcriptions/`

Supported query filters:

| Parameter | Meaning |
|---|---|
| `q` | Word search. Repeated values or comma-separated values are supported. |
| `lang` | `ru`, `tt`, or `unknown`. Repeated/comma-separated values are supported. |
| `speaker` | Speaker label. Repeated/comma-separated values are supported. |
| `date_from`, `date_to` | Recording date range. `date_to` is inclusive for date-only input. |
| `status` | Recording processing status. |
| `audio_id` | One or more recording UUIDs. |

For audio-level filtering, multiple words/languages are combined as AND constraints: a recording must contain each requested word and each requested language. For word-hit search, the returned rows are the matching word occurrences with timecodes.

All routes require JWT authentication except `POST /api/v1/auth/login`.
