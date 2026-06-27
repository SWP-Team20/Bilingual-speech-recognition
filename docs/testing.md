# Testing

## Critical Modules and Coverage

The repository maintains a strict quality gate requiring a **minimum of 30% automated line coverage** for each critical module. Global repository coverage is at **47%** (`857` total statements, `456` missed statements).

| Critical module | Why critical | Required line coverage | Current line coverage | Evidence |
| :--- | :--- | ---: | ---: | :--- |
| `backend/src/pipeline.py` | Coordinates the core mixed ASR routing logic, speech processing pipelines, and text delivery workflows. | 30% | 71% | [CI Run](https://github.com) |
| `backend/src/services/auth.py` | Core security logic providing hash verification and secure credential validations. | 30% | 90% | [CI Run](https://github.com) |
| `backend/src/routers/auth.py` | Distributes JWT access tokens, configures session protocols, and manages edge security. | 30% | 56% | [CI Run](https://github.com) |
| `backend/src/text_filter.py` | Cleans text data and filters out noise and low-confidence alignment words. | 30% | 31% | [CI Run](https://github.com) |

---

## Automated Test Status

| Test type | Scope | Command or CI check | Latest result | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| Unit tests | Critical product logic (e.g., `build_sentences` and text manipulation) | `pytest scripts/Unit/` | Passing (47% global coverage) | [CI Run](https://github.com) |
| Integration tests | API, VAD sequencing, file generation pipelines, and database interactions | `pytest scripts/Integration/` | Passing (47% global coverage) | [CI Run](https://github.com) |
| Automated QRTs | Quality requirement validation (QR-001 Security, QR-002 Transcription Quality) | `pytest scripts/QualityRequirements/` | Passing (47% global coverage) | [CI Run](https://github.com) |

---

## CI and QA Check Status

| Gate or check | Required for Done? | Latest protected-branch status | Evidence |
| :--- | :--- | :--- | :--- |
| Linting | Yes | Passing | [CI Run (Ruff & ESLint)](https://github.com) |
| Formatting or type checking | Yes | Passing | [CI Run (Black & FE Toolchain)](https://github.com) |
| Additional QA check | Yes | Passing | [Check Report (pip-audit & npm audit)](https://github.com) |

---

## Additional QA Check Rationale

| QA objective or risk | Additional QA check | Scope | Latest result | Evidence | Limitations or follow-up |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Backend dependencies with known vulnerabilities may expose users or deployment servers to avoidable security risk. | Automated dependency vulnerability scan via `pip-audit`. | Product dependency manifests in `backend/requirements.txt`. | Passing | [CI Run](https://github.com) | Analyzes only Python package manifests; compiled local binary resources are out of scope. |
| Frontend packaging setups containing high or critical threats could endanger the user runtime environment. | Automated vulnerability scanning via `npm audit --audit-level=high`. | Package dependencies inside `frontend/package-lock.json`. | Passing | [CI Run](https://github.com) | Limited to public advisory database reporting cycles and delayed upstream patches. |

---

## Manual Evidence That Does Not Count as QRT

| Evidence | Scope | Result | Follow-up PBI or issue |
| :--- | :--- | :--- | :--- |
| Audio File Upload Player Mock Check | UI Playback components interaction. | Passed with minor layout rendering feedback. | [#42](https://github.com) |
| Multi-language Toggle Manual Validation | Verification of dynamic locale switches on login UI. | Completed successfully without visual artifact leaks. | [#43](https://github.com) |
