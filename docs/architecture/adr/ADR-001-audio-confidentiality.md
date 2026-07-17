# ADR-001: Audio Confidentiality

## Status

Accepted

## Context

User audio files contain confidential information. Direct public access to media and transcript artifacts must be prevented. The rule must be simple enough to verify through automated integration tests.

## Decision

All audio, transcript, search, speaker, statistics, and admin routes are exposed through the FastAPI backend and protected by JWT authentication. Unauthenticated requests to protected routes return HTTP 401. Authenticated users with insufficient role return HTTP 403 on privileged routes.

The rule is verified by automated quality requirement tests in `scripts/QualityRequirements/test_security.py` and `scripts/QualityRequirements/test_authorization.py`.

## Consequences

- Audio files are not served directly from public file storage.
- Authorization behavior is centralized in backend dependencies and role checks.
- API clients must include a valid bearer token for protected operations.

## Quality Requirements Addressed

- [QR-001: Audio Files Confidentiality](/docs/quality-requirements.md#qr-001-audio-files-confidentiality)
- [QR-004: Role-Based Endpoint Authorization](/docs/quality-requirements.md#qr-004-role-based-endpoint-authorization)
