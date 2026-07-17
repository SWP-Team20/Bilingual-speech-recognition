# ADR-003: Pull Request Compliance

## Status

Accepted

## Context

Every Pull Request must be traceable to an issue and include a meaningful description. Manual review can miss default template placeholders, unchecked mandatory boxes, missing issue links, or ambiguous changelog selections.

## Decision

The `check-tasks.yml` workflow performs static validation of Pull Request metadata. A PR is structurally valid only when:

1. Default template placeholders are removed or overwritten.
2. A valid tracking issue reference is present.
3. Mandatory task checkboxes are completed with `- [x]`.
4. Exactly one changelog option is selected.

## Consequences

- PR metadata remains consistent and traceable.
- The repository has a repeatable governance gate for QR-003.
- Contributors must complete the template carefully before merge.

## Quality Requirements Addressed

- [QR-003: Pull Request Quality and Compliance Check](/docs/quality-requirements.md#qr-003-pull-request-quality-and-compliance-check)
