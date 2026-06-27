## QR-001: Audio Files Confidentiality
**ISO/IEC 25010 sub-characteristic:** Confidentiality

**Why this matters:** Audio files are protected user assets or intellectual property. Unauthorized access causes data leaks and breaches system security.

**Scenario:** When an unauthorized source submits an HTTP GET request for a protected audio file under a standard testing environment, the system shall respond with a 401 Unauthorized status code within 200 ms.

**Linked quality requirement tests:** [QRT-001](quality-requirements-tests.md#qrt-001-unauthorized-audio-access-verification)
## QR-002: Transcription Accuracy and Correctness
**ISO/IEC 25010 sub-characteristic:** Functional correctness

**Why this matters:** The seamless integration of VAD, language identification (MMS-LID), and specialized bilingual models (Whisper-Tatar and Whisper-large-v3) ensures that processing occurs without data corruption or pipeline execution failures.

**Scenario:** When a Manager or Admin uploads a bilingual Russian/Tatar audio sample under normal operational load, the automated speech-to-text pipeline shall process the entire audio file without execution errors, successfully mapping language tags (ru/tt) to individual words and generating both structured .json metadata and flat .txt transcripts.

**Linked quality requirement tests:** [QRT-002](quality-requirements-tests.md#qrt-002-automated-transcription-accuracy-verification-)

## QR-003: User Authentication Latency
**ISO/IEC 25010 sub-characteristic:** Time behaviour

**Why this matters:** Authentication is the first entry point to the system. Delays during login lead to perceived poor application performance and user frustration.

**Scenario:** When a user submits a valid username and password through the login endpoint under standard production load, the system shall complete the authorization process and return an authentication token within 1000 ms.

**Linked quality requirement tests:** [QRT-003](quality-requirements-tests.md#qrt-003-automated-authentication-latency-performance-test-)