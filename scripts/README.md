# Automated Tests (`scripts/`)

All pytest suites live under `scripts/` and exercise backend logic **without modifying** `backend/` or `frontend/` source. CI runs them from the `backend-quality-tests` job in [`.github/workflows/quality-requirements-tests.yml`](../.github/workflows/quality-requirements-tests.yml).

## Layout

| Directory | Marker | Purpose |
| :--- | :--- | :--- |
| [`Unit/`](Unit/) | `unit` | Fast, isolated tests for pure functions (pipeline sentence building, corpus filters, speaker matching, transcript edits, text filter, language tagging, auth helpers). |
| [`Integration/`](Integration/) | `integration` | End-to-end pipeline with mocked ASR/LID/VAD; Postgres regression tests for speaker persistence. |
| [`QualityRequirements/`](QualityRequirements/) | `qrt` / `integration` | QRT-001 (401), QRT-004 (403), supplementary auth performance. |

Shared fixtures (database availability, seeded users, JWT headers, FastAPI `TestClient`) are defined in [`conftest.py`](conftest.py).

## Commands

From the repository root (Python 3.10+, dependencies from `backend/requirements.txt`):

```bash
pip install -r backend/requirements.txt pytest pytest-cov httpx psycopg2-binary

# Fast unit suite (no Postgres required)
pytest scripts/Unit/ -m unit -v

# Integration + QRT (Postgres on 127.0.0.1:15432 — same as CI/docker)
python init_db.py
pytest scripts/Integration/ scripts/QualityRequirements/ -m "integration or qrt" -v

# Full CI-equivalent run with coverage
pytest scripts/ --cov=backend/src --cov-report=term-missing
```

## Test inventory

### Unit (`scripts/Unit/`)

| File | Module under test | What is verified |
| :--- | :--- | :--- |
| `test_pipeline_unit.py` | `backend.src.pipeline.build_sentences` | Empty input, speaker grouping, punctuation splits, mixed-language detection. |
| `test_audio_filter.py` | `backend.src.services.audio_filter` | Word normalization, multi-value/date parsing, status/language filter chain (MVP v2 filters). |
| `test_speaker_filter.py` | `backend.src.services.audio_filter` | Speaker corpus filter join/skip behaviour. |
| `test_speaker_matching.py` | `backend.src.db_index._resolve_speakers` | Embedding similarity, new speaker creation, diarization merge rules (issue #207). |
| `test_transcript_edit.py` | `backend.src.services.transcript_edit` | Word edit/insert/delete mutations and corpus statistics (US-010). |
| `test_text_filter.py` | `backend.src.text_filter` | Meaningful-word filter thresholds and short-word allowlist. |
| `test_lang_tag.py` | `backend.src.lang_tag` | ru/tt tagging via Tatar letters, lexicon, segment language. |
| `test_auth_service.py` | `backend.src.services.auth` | Password hashing and JWT creation. |

### Integration (`scripts/Integration/`)

| File | Scope | Postgres required |
| :--- | :--- | :--- |
| `test_pipeline_integration.py` | Mocked `process_audio` pipeline: artifact files, JSON schema, sentence building. | No |
| `test_speaker_persistence_db.py` | Regression for speaker FK orphan bug (#207) via `save_transcription`. | Yes (skipped locally if DB down) |

### Quality requirements (`scripts/QualityRequirements/`)

| File | Linked requirement | Notes |
| :--- | :--- | :--- |
| `test_security.py` | [QRT-001 / QR-001](../docs/quality-requirements-tests.md#qrt-001-unauthorized-audio-access-verification) | Unauthenticated requests return 401 on audio, profile, speakers, admin routes. |
| `test_authorization.py` | [QRT-004 / QR-004](../docs/quality-requirements-tests.md#qrt-004-role-based-endpoint-authorization) | Role enforcement: admin vs user on admin list and transcript edit (MVP v2). |
| `test_auth_perf.py` | Supplementary (see [testing.md](../docs/testing.md)) | Admin login completes within 1 s budget. |
| `transcription_quality_test.py` | Manual evaluation only | **Not collected by pytest.** Offline ASR quality harness; see [ru_tt_pipeline.md](../docs/extra/ru_tt_pipeline.md). |

**Counts:** 55 unit · 3 integration · 9 QRT · 1 supplementary perf · **68 total pytest tests**.

## CI behaviour

On push/PR to protected branches, the workflow:

1. Starts Postgres and runs `init_db.py`.
2. Runs lint/format/audit checks on `backend/src` and `scripts/`.
3. Executes unit tests, then integration + QRT tests with combined coverage (68 pytest tests).
4. Runs frontend lint/build in a separate job when frontend files change.

Tests that require Postgres are skipped automatically when the database is unreachable (local dev without Docker).

## Adding tests

- Place new files under the matching subdirectory with the `test_*.py` prefix.
- Tag suites with `pytestmark = pytest.mark.unit` (or `integration` / `qrt`).
- Prefer unit tests for pure logic; use integration tests only when DB or full pipeline wiring is required.
- Do not add heavyweight model downloads to pytest — keep ML evaluation in `transcription_quality_test.py`.
