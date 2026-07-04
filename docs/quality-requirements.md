# Quality Requirements

## QR-001: Audio Files Confidentiality
**ISO/IEC 25010 sub-characteristic:** Confidentiality

**Why this matters:** Audio files are protected user assets or intellectual property. Unauthorized access causes data leaks and breaches system security.

**Scenario:** When an unauthorized source submits an HTTP request to a protected API route (including audio listing, upload, search, transcription, speaker list, or admin user management) under a standard testing environment, the system shall respond with a 401 Unauthorized status code within 200 ms.

**Linked quality requirement tests:** [QRT-001](quality-requirements-tests.md#qrt-001-unauthorized-audio-access-verification)

## QR-002: Front-End Code and Build Quality
**ISO/IEC 25010 sub-characteristic:** Maintainability 

**Why this matters:** Unchecked linter errors and broken production builds slow down development, introduce UI bugs, and block deployment pipelines. Ensuring code compliance before merging maintains repository health.

**Scenario:** When a developer pushes code to the repository or opens a Pull Request, the CI system shall execute static analysis and compilation checks, requiring zero errors and a successful production build.

**Linked quality requirement tests:** [QRT-002](quality-requirements-tests.md#qrt-002-front-end-build-and-code-quality-verification)

## QR-003: Pull Request Quality and Compliance Check
**ISO/IEC 25010 sub-characteristic:** Maintainability

**Why this matters:** When a developer opens or updates a Pull Request, the system shall verify that the PR body contains a non-empty description, has all mandatory checkboxes completed, and includes a valid reference linking it to a tracking issue.

**Scenario:** When the PR body contains a non-empty description, and all mandatory checkboxes are completed, and a valid tracking issue reference is present, then the system marks the compliance check as successful

**Linked quality requirement tests:** [QRT-003](quality-requirements-tests.md#qrt-003-pull-request-compliance-static-analysis-test)

## QR-004: Role-Based Endpoint Authorization
**ISO/IEC 25010 sub-characteristic:** Integrity

**Why this matters:** MVP v2 adds an admin user-management panel and manager-only transcription editing. Authenticated users with insufficient role must not perform privileged operations even when they present a valid JWT.

**Scenario:** When an authenticated user with the `user` role requests an admin-only route (for example `GET /api/v1/users/`) or a manager/admin-only mutation (for example `PATCH /api/v1/transcriptions/{id}/words/{position}`), the system shall respond with HTTP 403 Forbidden. When an authenticated user with a sufficient role requests an allowed route (for example `GET /api/v1/auth/me` for any role, or `GET /api/v1/users/` for `admin`), the system shall allow the operation.

**Linked quality requirement tests:** [QRT-004](quality-requirements-tests.md#qrt-004-role-based-endpoint-authorization)
