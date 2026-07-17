# ADR-002: Frontend Build Quality

## Status

Accepted

## Context

Parallel frontend development can introduce lint errors, build errors, and broken production bundles. Manual checks before every merge are unreliable and slow.

## Decision

The CI pipeline runs frontend quality checks with `npm run lint` and `npm run build` from the `frontend` directory. A failing lint or build command blocks the Pull Request.

## Consequences

- Broken frontend builds are caught before merge.
- Developers get repeatable feedback from CI.
- Pipeline runtime increases because the frontend must be installed and built.

## Quality Requirements Addressed

- [QR-002: Front-End Code and Build Quality](/docs/quality-requirements.md#qr-002-front-end-code-and-build-quality)
