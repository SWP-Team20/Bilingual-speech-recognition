# Database Schema Reference

This reference describes the current SQLAlchemy models in `backend/src/models.py` and the artifact layout used by the backend.

## Storage Principle

Large artifacts live on disk under `storage/<audio_id>/`:

- uploaded original audio: `original.<ext>`;
- normalized 16 kHz audio: `original_16k.wav`;
- VAD-processed audio: `processed.wav`;
- transcript artifacts: `transcription.json` and `transcription.txt`.

PostgreSQL stores metadata, metrics, users, speakers, searchable words, per-recording word counts, and VAD segment maps.

## Search Filters

Corpus filters support:

- recording date;
- word;
- speaker;
- language;
- processing status;
- audio ID.

Repeated query parameters and comma-separated values are supported in the backend parser.

## `users`

Users and roles for authorization. Users are unrelated to speakers in transcripts.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key. |
| `username` | string | Unique, indexed. |
| `hashed_password` | string | Password hash. |
| `role` | enum | `user`, `manager`, or `admin`. |
| `created_at` | datetime | Creation timestamp. |
| `deleted_at` | datetime/null | Soft-delete marker. |

## `audio_files`

One row per recording.

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key. |
| `filename` | string | Display title. Upload/update rejects case-insensitive duplicates. |
| `content_type` | string | Uploaded MIME type. |
| `uploaded_at` | datetime | Upload timestamp. |
| `recorded_at` | datetime/null | Recording date used by filters. |
| `folder_path` | string | Path to `storage/<audio_id>/`. |
| `primary_language` | string/null | Dominant indexed language. |
| `status` | string | `processing_audio`, `processing_text`, `done`, or `error`. |
| `deleted_at` | datetime/null | Soft-delete marker. |
| `duration_sec` | float/null | Original duration. |
| `speech_sec` | float/null | Speech duration after VAD. |
| `silence_removed_sec` | float/null | Removed silence duration. |
| `total_words` | int/null | Indexed word count. |
| `unique_words` | int/null | Unique normalized words. |
| `words_per_minute` | float/null | Speech pace metric. |
| `ru_words`, `tt_words`, `unknown_words` | int/null | Per-language counts. |
| `avg_confidence` | float/null | Average word confidence. |

## `words`

One row per indexed word.

| Field | Type | Notes |
|---|---|---|
| `id` | int | Primary key. |
| `audio_id` | UUID | Foreign key to `audio_files`. |
| `text` | string | Normalized searchable word. |
| `raw` | string/null | Display form. |
| `start_sec`, `end_sec` | float | Timecodes in original-audio coordinates. |
| `language` | string | `ru`, `tt`, or `unknown`. |
| `confidence` | float/null | ASR confidence. |
| `position` | int | Word position inside the recording. |
| `speaker_id` | int/null | Foreign key to `speakers`. |

Indexes exist on `audio_id`, `text`, `language`, `speaker_id`, and the composite `(text, language)`.

## `speakers`

Global speaker identities across the corpus.

| Field | Type | Notes |
|---|---|---|
| `id` | int | Primary key. |
| `label` | string | Display label. |
| `embedding` | JSON/null | Normalized ECAPA voice centroid. |
| `created_at` | datetime | Creation timestamp. |

The speaker list for a recording is derived from distinct `speaker_id` values in `words`.

## `word_counts`

Per-recording word frequencies for statistics:

`id`, `audio_id`, `text`, `language`, `count`.

## `speech_segments`

VAD map between original and processed audio:

`id`, `audio_id`, `orig_start`, `orig_end`, `trim_start`, `trim_end`.

## Main API Data Access

All routes are under `/api/v1`.

### Authentication

- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/change-password`
- `DELETE /auth/me`

### Audio and Transcripts

All authenticated roles can read:

- `GET /audio/`
- `GET /audio/by-filename`
- `GET /audio/{id}/status`
- `GET /audio/{id}/sizes`
- `GET /audio/storage/total`
- `GET /search/`
- `GET /transcriptions/`
- `GET /transcriptions/{id}`
- `GET /transcriptions/{id}/download?format=txt`
- `GET /audio/{id}?type=original`
- `GET /audio/{id}?type=processed`

Managers and admins can mutate:

- `POST /upload-audio/`
- `PATCH /audio/{id}`
- `PATCH /audio/{id}/processed`
- `PATCH /transcriptions/{id}`
- `PATCH /transcriptions/{id}/words/{position}`
- `POST /transcriptions/{id}/words`
- `DELETE /transcriptions/{id}/words/{position}`
- `POST /transcriptions/{id}/undo`
- `PATCH /transcriptions/{id}/words/bulk`
- `PATCH /transcriptions/{id}/speakers`
- `POST /audio/{id}/reindex-db`
- `DELETE /audio/{id}`
- `POST /audio/{id}/restore`

JSON transcript download is restricted: `GET /transcriptions/{id}/download?format=json` is forbidden for the plain `user` role.

### Speakers

- `GET /speakers/`
- `GET /speakers/{speaker_id}/words` for manager/admin.
- `PATCH /speakers/{speaker_id}` for manager/admin.
- `POST /speakers/reconcile-labels` for manager/admin.
- `POST /speakers/cleanup-orphans` for manager/admin.

### Statistics

- `GET /stats/words/frequent`
- `GET /stats/languages/words`
- `GET /stats/dates/words`
- `GET /stats/speakers/words`
- `GET /stats/*/export?format=csv|xlsx`
- `POST /stats/export/all`
- `POST /stats/rebuild`
- `POST /stats/rebuild/all`
- `POST /stats/rebuild/{audio_id}`

Statistics rebuild routes require manager/admin.

## Does the Schema Need More Tables?

For the implemented filters and statistics, the current schema is sufficient. The search path uses indexed `words`, `speakers`, and `audio_files` rows. Transcript JSON remains the full artifact, while PostgreSQL stores the searchable projection.
