## QRT-001: Unauthorized Audio Access Verification
**Linked quality requirement:** QR-001

**Verification method:** Automated integration API test.

**Test data, setup, or environment:** CI testing environment containing at least one protected audio file resource with a known endpoint.

**Automated command or CI check:** `pytest scripts/test_security.py` (executed during the `api-security-test` CI job).

**Expected measurable result:** The test suite exits with code 0 if the server explicitly rejects unauthenticated requests with an HTTP 401 status.

**Evidence location:** GitHub CI job log for the `api-security-test` runner on the default branch.

## QRT-002: Automated Transcription Accuracy Verification 
**Linked quality requirement:** QR-002

**Verification method:** Automated end-to-end integration test rig utilizing production processing components. **Test data, setup, or environment:** Execution inside the repository pipeline environment targeting a set of verified bilingual reference audio files. 

**Automated command or CI check:** `python scripts/transcription_quality_test.py` (executed via the `transcription-accuracy-test` job in the repository pipeline). 

**Expected measurable result:** The test script completes execution with exit code 0, verifying that every processed audio file successfully generates a corresponding valid JSON file containing word timestamps and a flat text transcript. 

**Evidence location:** GitHub Actions log history execution data tracking the output metrics of the `transcription-accuracy-test` job.

## QRT-003: Automated Authentication Latency Performance Test 
**Linked quality requirement:** QR-003

**Verification method:** Automated performance and API response time unit testing.

**Test data, setup, or environment:** Active local application instance targeting a mock database container with 10,000 pre-registered user accounts.

**Automated command or CI check:** `pytest scripts/test_auth_perf.py` (executed via the `auth-performance-test` job in the repository pipeline).

**Expected measurable result:** The test logs verify that the 95th percentile of 50 consecutive login API calls does not exceed the 1000 ms threshold.

**Evidence location:** GitHub Actions execution output attached to the current active Pull Request branch.
