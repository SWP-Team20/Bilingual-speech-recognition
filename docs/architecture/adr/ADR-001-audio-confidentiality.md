
# Audio Confidentiality

## Stable ID
ADR-001

## Status
Accepted

## Context
Within the Bilingual Speech Recognition application, user audio files contain confidential information. We must prevent unauthorized external access to these media by enforcing access control. The verification process must be optimized, while remaining verifiable through automated integration tests.

## Decision
Implement a centralized backend authorization mechanism. Access to protected audio file endpoints will require an authenticated request. The system will intercept incoming HTTP GET requests and validate the client's authorization status. If the request is unauthenticated or unauthorized, the system will immediately reject it with an HTTP 401 Unauthorized status code. This architectural constraint is verified via automated `pytest` integration testing (`test_security.py`) in the CI pipeline.

## Consequences and tradeoffs
  - Complete isolation and protection of user audio files from direct public access

  - Predictable API behavior that is easily testable via automated CI scripts


## Quality requirements addressed where applicable
[QR-001: Audio Files Confidentiality](https://github.com/SWP-Team20/Bilingual-speech-recognition/blob/494babd5786051e98e87f6e7b8eb391054b4040a/docs/quality-requirements.md#L3)
