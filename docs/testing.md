# Testing

## Critical Modules and Coverage

| Critical module | Why critical | Required line coverage | Current line coverage | Evidence |
| :--- | :--- | ---: | ---: | :--- |
| `backend/src/pipeline.py` | Coordinates the core mixed ASR routing logic, speech processing pipelines, and text delivery workflows. | 30% | 71% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/services/auth.py` | Core security logic providing hash verification and secure credential validations. | 30% | 95% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/routers/auth.py` | Distributes JWT access tokens, configures session protocols, and manages edge security. | 30% | 56% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/text_filter.py` | Cleans text data and filters out noise and low-confidence alignment words. | 30% | 100% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/services/audio_filter.py` | Builds corpus search and filter queries (word, language, speaker, date, status) for MVP v2 dashboard features. | 30% | 72% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/services/transcript_edit.py` | Supports manual transcription correction (word edit, insert, delete, statistics). | 30% | 48% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/services/word_stats.py` | Corpus word-frequency and speaker/language/date aggregate statistics for the dashboard. | 30% | 43% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/db_index.py` | Persists speakers and words; cross-audio speaker matching (regression #207). | 30% | 48% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/lang_tag.py` | Per-word ru/tt language tagging in the mixed pipeline. | 30% | 91% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| `backend/src/dependencies.py` | JWT validation and role checks for admin and editor routes (MVP v2). | 30% | 0% | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |

**Global line coverage (`backend/src`):** 48% from the full `pytest scripts/ --cov=backend/src` suite (79 tests with Postgres in CI).

---

## Automated Test Status

| Test type | Scope | Command or CI check | Latest result | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Unit tests | Critical product logic (`build_sentences`, corpus filters, speaker matching, transcript edit, `text_filter`, `lang_tag`, auth helpers, word stats) | `pytest scripts/Unit/ -m unit` | Passing (64 tests) | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| Integration tests | Mocked ASR pipeline artifacts; Postgres speaker persistence regression (#207) | `pytest scripts/Integration/ -m integration` | Passing (3 tests) | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| Automated QRTs | QR-001 unauthorized access (`test_security.py`); QR-004 role-based authorization (`test_authorization.py`) | `pytest scripts/QualityRequirements/ -m qrt` | Passing (11 tests) | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| Auth performance check | Admin login latency budget (< 1 s) | `pytest scripts/QualityRequirements/test_auth_perf.py` | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| Transcription quality harness | Manual offline ru/tt ASR evaluation (not a DoD gate) | `python scripts/QualityRequirements/transcription_quality_test.py` | Manual / not in CI | [`docs/extra/ru_tt_pipeline.md`](extra/ru_tt_pipeline.md) |
| Combined backend suite | All pytest tests under `scripts/` with line coverage | `pytest scripts/ --cov=backend/src` | Passing (79 tests); 48% global line coverage | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |

Detailed file-level inventory: [`scripts/README.md`](../scripts/README.md).

---

## CI and QA Check Status

| Gate or check | Required for Done? | Latest protected-branch status | Evidence |
| :--- | :--- | :--- | :--- |
| Linting | Yes | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| Formatting or type checking | Yes | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| Additional QA check | Yes | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| Backend unit, integration, and QRT tests | Yes | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |
| PR compliance (QRT-003) | Yes (PRs to `main`) | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) |

---

## Additional QA Check Rationale

| QA objective or risk | Additional QA check | Scope | Latest result | Evidence | Limitations or follow-up |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Backend dependencies with known vulnerabilities may expose users or deployment servers to avoidable security risk. | Automated dependency vulnerability scan via `pip-audit`. | Product dependency manifests in `backend/requirements.txt`. | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) | Analyzes only Python package manifests; compiled local binary resources are out of scope. |
| Frontend packaging setups containing high or critical threats could endanger the user runtime environment. | Automated vulnerability scanning via `npm audit --audit-level=high`. | Package dependencies inside `frontend/package-lock.json`. | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) | Limited to public advisory database reporting cycles and delayed upstream patches. |
| Slow authentication could block admin workflows under load. | Login latency check in `test_auth_perf.py`. | `/api/v1/auth/login` with seeded admin user. | Passing | [CI Run](https://github.com/SWP-Team20/Bilingual-speech-recognition/actions/runs/28302441842/job/83853012352) | Measures single-request latency in CI, not concurrent load. |
| ASR quality regressions on bilingual audio. | Manual `transcription_quality_test.py` harness. | Local ML models and audio corpus. | Manual | [`docs/extra/ru_tt_pipeline.md`](extra/ru_tt_pipeline.md) | Not run in CI; not a Definition-of-Done gate. |

---

## Manual Evidence That Does Not Count as QRT

| Evidence | Scope                                                                                                                    | Result | Follow-up PBI or issue                                                                   |
| :--- |:-------------------------------------------------------------------------------------------------------------------------| :--- |:-----------------------------------------------------------------------------------------|
| Admin Web Portal Authentication Pass | Manual verification of the front-end login page integration with the `/auth/login` (FastAPI) endpoint.                   | Passed. JWT access token is successfully received, stored in the browser, and redirects the admin to the dashboard. | [#18](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/18)              |
| Multipart Audio File Upload Validation | Manual verification of the browser file-picker interaction with the backend audio upload router (`multipart/form-data`). | Passed. The file is successfully transmitted, saved under the local storage tree, and initiates processing. | [#12](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/12)              |
