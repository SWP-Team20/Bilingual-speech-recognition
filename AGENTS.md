
# AGENTS.md

This file provides operating guidance and repository expectations for AI coding agents working in this codebase. It complements `README.md` and `CONTRIBUTING.md` by focusing strictly on automated execution, constraints, and verification steps.

## Agent Profile & Context

You are an AI coding agent working on **Bilingual Speech Recognition**, a web application for transcribing and analyzing bilingual Russian-Tatar speech recordings. The system features a decoupled frontend and backend architecture.


## Verification and Execution Commands

Agents must run the following verification commands to ensure changes do not break existing quality gates before submitting code.

### Backend Validation
The backend test suite is structured within the `scripts` directory and categorized by markers defined in `pytest.ini`. Target your testing commands based on the scope of your changes.

-   **Unit Tests:** Run `pytest -m unit` to execute pure logic tests that require no database or running API
-   **Integration Tests:** Run `pytest -m integration` for pipeline, database, or API tests. **Note: Postgres is required for these tests**
-   **Quality Requirement Tests (QRT):** Run `pytest -m qrt` to verify quality requirements. **Note: Postgres is required for these tests**
-   **Full Suite:** Run `pytest` to discover and execute all `test_*.py` files across the test paths


## Repository Workflow and PR Compliance

Agents must adhere strictly to the automated PR governance pipeline. Any Pull Request that fails the static metadata analysis script defined in `check-tasks.yml` will be automatically blocked from merging.

### Strict Pull Request Rules (QR-003)

When creating or updating a Pull Request, the agent must ensure the PR markdown description adheres to these formatting rules:

- **No Placeholders:** Default template placeholders must be completely overwritten or removed

- **Task Checkboxes:** All mandatory checkboxes must be explicitly marked as completed using `- [x]`

- **Issue Linking:** A valid tracking issue reference must be explicitly declared in the body (e.g., `Closes #<id>`) to preserve development traceability

- **Changelog Section:** Under the Changelog section of the PR template, exactly one single option must be selected


## Safety, Privacy, and Secrets Handling

Agent must handle credentials and environment configurations with extreme care to maintain system security.

- **Environment Variables:** The system relies on local environment variables injected via a `.env` file

- **Do Not Commit Secrets:** Agents must never hardcode or commit actual secret values to version control


## Maintained Documentation Map

Agents can consult deeper technical documentation at the following paths for additional architectural context:

- `/docs/architecture/README.md` - System views, components, and Architecture Decision Records (ADR-001 through ADR-003)

- `/docs/deployment.md` - Docker configurations, containerized setups, and infrastructure requirements

- `/docs/testing.md` - Maintained testing strategies, critical module lists, and test coverage metrics

- `/docs/quality-requirements.md` - Specific ISO/IEC 25010 sub-characteristic mappings and scenario constraints

- `/docs/definition-of-done.md` - Current engineering standard expectations for completing engineering tasks
