# Contributing

Document outlines the required workflow for contributors to ensure high code quality, maintainability, and compliance with our project standards.

## 1. Issue-Linked Workflow and Branching

All changes to the product must be tracked and linked to an issue.

-   Every non-automated change must start with a relevant issue (e.g., User Story, Bug Report, or Technical Task)
-   Create a separate branch for each change directly from the relevant issue page where supported
-   Branches must be named using the format `<issue-number>-short-description` (for example, `42-add-login-form`)

## 2. Pull Request (PR) Expectations

We follow a strict Pull Request workflow to merge changes into the protected `main` branch. Direct pushes to the default branch are disabled.

-   Keep your PR focused on one specific change where practical
-   Link the PR to the relevant issue
-   You must completely fill out the PR template, which prompts for a summary of changes, testing performed, and a reviewer checklist
-   You must complete the changelog checklist in the PR template by selecting exactly one option
-   Squash and rebase merging are disabled; all PRs must use merge commits

## 3. Local Verification and CI Quality Gates

Before a PR can be merged, it must pass all configured Continuous Integration (CI) checks. You are expected to run and verify these locally when possible.

-   **Link Checking:** Lychee CI checks all Markdown files for broken links, this check must pass on your PR
-   **Code Quality & Tests:** The CI pipeline enforces source-code linting, formatting, builds, unit tests, integration tests, automated quality requirement tests (QRTs), and an additional QA check
-   **Test Coverage:** Critical product modules must maintain at least 30% automated line coverage
-   **Documentation:** Ensure you document the automated and/or manual testing performed for your change

## 4. Review and Merge Requirements

To mark a Product Backlog Item (PBI) as `Done` and merge it into `main`, the following conditions must be met:

-   **Peer Review:** At least one approval is required from another team member. You cannot approve your own PR
-   **Acceptance Criteria:** All issue-specific acceptance criteria must be verified
-   **Definition of Done:** The change must fully satisfy the team's shared minimum completion standard
-   **No Sensitive Data:** Ensure no credentials, PII, large binaries, or secret `.env` files are committed to the repository

## 5. Maintained Documentation Map

For deeper operational and architectural insight, contributors should refer to the following maintained documents:

-   [README.md](/README.md) - Repository entry point, setup instructions, and deployment artifacts
-   [Definition of Done](/docs/definition-of-done.md) - The complete checklist defining our completion standards
-   [Testing Strategy](/docs/testing.md) - Testing definitions and critical module identification
-   [Architecture](/docs/architecture/README.md) - System structures and Architecture Decision Records (ADRs)
-   [Quality Requirements](/docs/quality-requirements.md) - ISO/IEC 25010 sub-characteristic mappings and automated QRTs
