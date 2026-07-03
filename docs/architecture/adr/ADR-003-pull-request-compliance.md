
# Pull Request Compliance

## Stable ID
ADR-003

## Status
Accepted

## Context
To guarantee development process transparency and satisfy traceability expectations required, every Pull Request must be explicitly linked to an issue and include a meaningful description. Human oversight is prone to error, resulting in developers leaving default template placeholders untouched or ignoring mandatory checklists.

## Decision
Deploy automated static analysis of Pull Request metadata using validation workflow (`check-tasks.yml`). This workflow will parse the raw markdown body of the PR description field. A PR is structurally validated and allowed to proceed only if:
1. Default template placeholders are completely overwritten
2. A valid tracking issue reference is explicitly declared
3. All base task checkboxes are marked as completed
4. Exactly one single option is selected under the Changelog section

## Consequences and tradeoffs
  - Guarantees automated traceability connecting codebase updates, pull requests, and tracking issues
  - Enforces consistent team discipline and proper changelog generation without requiring manual oversight.
  - The mandatory compliance with strict PR structural rules slows down the data uploading process

## Quality requirements addressed where applicable
[QR-003: Pull Request Quality and Compliance Check](https://github.com/SWP-Team20/Bilingual-speech-recognition/blob/5f9407d10c4f79e8d40dc3422683fa7d6bfef1e9/docs/quality-requirements.md#L21)
