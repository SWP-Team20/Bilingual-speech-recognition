#Quality Requirements Tests

## QRT-001: Unauthorized Audio Access Verification
**Linked quality requirement:** QR-001

**Verification method:** Automated integration API test.

**Test data, setup, or environment:** CI testing environment containing at least one protected audio file resource with a known endpoint.

**Automated command or CI check:** `pytest scripts/test_security.py` (executed during the `api-security-test` CI job).

**Expected measurable result:** The test suite exits with code 0 if the server explicitly rejects unauthenticated requests with an HTTP 401 status.

**Evidence location:** GitHub CI job log for the `api-security-test` runner on the default branch.

## QRT-002: Automated Transcription Accuracy Verification 
**Linked quality requirement:** QR-002

**Verification method:**

**Automated command or CI check:** 

**Expected measurable result:**

**Evidence location:**

## QRT-003: Pull Request Compliance Static Analysis Test
**Linked quality requirement:** QR-003

**Verification method:** Automated static analysis text parsing script running directly on the integration platform metadata.

**Test data, setup, or environment:** Execution inside the GitHub virtual environment triggered by incoming pull request events, parsing the raw markdown body of the PR description field.

**Automated command or CI check:** `validate-pr` job running the `actions/github-script@v7` step within the `check-tasks.yml` workflow.

**Expected measurable result:** The validation script completes execution with exit code 0, confirming that the default template placeholders are completely overwritten, a valid tracking issue reference (`Closes #<id>`) is explicitly declared, all base task checkboxes are marked as completed (`- [x]`), and exactly one single option is selected under the Changelog section.

**Evidence location:** GitHub Actions check runs interface and log history execution data for the `Check PR Tasks and Issue Linking` workflow.
