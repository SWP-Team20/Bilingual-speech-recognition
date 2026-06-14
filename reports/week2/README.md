Bilingual Family Speech: Russian–Tatar Transcription and Corpus Manager
Project Description
This project supports a longitudinal study of bilingual language development in a Russian–Tatar family environment. The goal is to automate transcription, speaker identification, language tagging, and corpus management for researchers working with large collections of family audio recordings.
The system is designed to reduce manual transcription effort while providing researchers with tools to explore, search, filter, and analyse multilingual speech data collected over an extended period.
[License](https://github.com/ProPupok/Bilingual-speech-recognition/blob/ba0fba13f0526c9d7a58846a3b3d4e2501aee197/LICENSE)


⸻


Week 2 Deliverables
[User Stories](user-stories.md)
The project requirements were refined into stable user stories with MoSCoW prioritisation.


⸻


Prototype and Interface Artifacts
Lo-Fi Prototype
Figma Prototype:
https://www.figma.com/design/tFQ5C8t2KZ0TdIYPErtd7P/Lo-FI-Prototype
Prototype Overview
The prototype demonstrates the intended researcher workflow:
Upload audio recordings
View generated transcripts
Review speaker-separated content
Search and filter corpus entries
View language usage statistics
Correct transcription mistakes
Prototype Coverage
The prototype covers the following user stories:
Story ID
Description
US-002
Filter by speakers
US-003
Transcription
US-006
Statistics
US-008
Corpus manager
US-009
Audio upload
US-010
Correct mistakes


⸻


MVP v0
[MVP v0 Report](mvp-v0-report.md)
Current Status
At the end of Week 2, MVP v0 remains in the planning and architecture phase.
Completed work includes:
Customer interview
Requirements gathering
User-story development
MoSCoW prioritisation
Prototype design
Initial technology investigation
No production implementation or deployment has been completed yet.
Planned MVP v0 Foundation
The MVP foundation will provide:
Audio upload workflow
Transcript storage

Run Instructions

Deployment
https://web-liard-ten-15.vercel.app/
Public Video Demonstration
Not available.


⸻


Customer Validation
[Customer Meeting Summary](customer-meeting-summary.md)
[Customer Meeting Transcript](customer-meeting-transcript.md)
Key Findings
The customer confirmed:
Automatic transcription is the primary requirement.
Existing ASR solutions should be used instead of developing a custom recogniser.
Speaker identification is essential.
Researchers need searchable and editable transcripts.
Corpus exploration and statistics are important.
Child speech recognition is desirable but not required for the initial MVP.
Tatar support is valuable but may require future work.


⸻


Coverage
User Story Coverage by Prototype
Story ID
Coverage
US-002
Prototype
US-003
Prototype
US-006
Prototype
US-008
Prototype
US-009
Prototype
US-010
Prototype
Planned MVP Coverage
The following stories are expected to be represented by MVP v0 and MVP v1 implementation work:
Story ID
Description
US-003
Transcription
US-008
Corpus manager
US-009
Audio upload
US-010
Correct mistakes
Future Stories
The following stories are currently outside the MVP scope:
Story ID
Description
US-001
Word count
US-004
Background work
US-005
Tatar speech translation
Removed Story
Story ID
Description
US-007
Natural language for filters
Reason: Standard filter options were considered sufficient after customer validation.


⸻


[Week 2 Analysis](analysis.md)
This report summarises:
Lessons learned from requirements engineering
Prototype development findings
Customer validation outcomes
Identified risks and assumptions
Planned actions for MVP v1


⸻


[AI / LLM Usage](llm-report.md)
This report documents all AI-assisted activities used during Week 2.


⸻


Link Verification
Lychee Configuration
Add link when available.
Latest Successful Run
Add workflow link when available.
Excluded Links
Link
Reason
Figma Prototype
External service
Customer-provided resources
External access restrictions
All excluded links should be manually verified before submission.


⸻


Screenshots
Protected Default Branch
![Protected Branch](images/protected-branch.png)
Reviewed Pull Request
![Reviewed PR](images/pr-review.png)
Prototype
![Prototype](images/prototype.png)
MVP v0
![MVP v0](images/mvp-v0.png)
⸻


Week 2 Outcome
By the end of Week 2, the team completed requirements analysis, customer validation, user-story development, prioritisation, and prototype design. The next milestone is implementation of the MVP foundation, beginning with audio upload, transcription pipeline evaluation, and corpus management infrastructure.
