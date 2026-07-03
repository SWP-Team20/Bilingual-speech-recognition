
# Frontend Build Quality

## Stable ID
ADR-002

## Status
Accepted

## Context
Parallel frontend development can lead to syntax formatting discrepancies, bugs in build configurations, and broken production deployments. Manually checking code quality and compilation health before every merge is inefficient and delays feature delivering. We need an automated gateway to ensure repository health.

## Decision
Integrate automated code quality and compilation gates directly into the CI/CD pipeline using a dedicated `frontend-quality-check` job. The CI environment will utilize Node.js to execute `npm run lint && npm run build` against the frontend source repository. The pipeline will require an exit code 0, any warning or compilation failure will automatically block the Pull Request.

## Consequences and tradeoffs
  - Only clean, compliant, and successfully compiling code ever reaches the main production branch.
  - Prevents scenarios where a broken build submitted by one developer blocks the workflow of the entire team.
  - Pipeline execution time increases, as the entire frontend application must rebuild on every update.

## Quality requirements addressed where applicable
[QR-002: Front-End Code and Build Quality](https://github.com/SWP-Team20/Bilingual-speech-recognition/blob/3445e048b12310228c7ce70a148cfe5dc6a0291b/docs/quality-requirements.md#L12)