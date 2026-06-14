# Week 2 Analysis

## Learning Points

### User Stories
Defining user stories helped the team translate the needs of researchers into clear system requirements. We learned that transcription, speaker identification, and corpus exploration are the core functionalities of the system. Breaking requirements into US-001 to US-010 made it easier to separate essential features from optional enhancements.

### Prioritization
Using MoSCoW prioritization clarified the MVP boundaries. Must-have features include audio upload, transcription, corpus management, and transcript correction. Should-have features such as statistics and speaker filtering are important for research usability, while background recording and Tatar translation are deferred due to complexity.

### Prototyping
The Lo-Fi Figma prototype helped visualize the main user flows:
- Audio upload
- Transcript viewing
- Speaker-based filtering
- Statistics dashboard

It revealed that simplicity and clarity are more important than feature density.

### Customer Validation
Customer feedback confirmed that the main goal is reducing manual transcription effort and enabling searchable multilingual corpora. Speaker separation and editable transcripts are critical. Advanced features such as translation and background recording are secondary.

### System Understanding
The team learned that existing ASR and diarisation tools must be integrated instead of building models from scratch. The system is primarily a pipeline and data management tool rather than a machine learning research project.

---

## Validated Assumptions

| Assumption | Result | Evidence |
|------------|--------|----------|
| Researchers need transcription of audio recordings | Confirmed | Customer meeting + project brief |
| Speaker separation is required | Confirmed | Customer feedback |
| Corpus must be editable | Confirmed | User stories US-010 |
| Existing ASR tools should be used | Confirmed | Technical constraints |
| Statistics are useful for analysis | Confirmed | US-006 |
| Natural language filtering is required | Rejected | US-007 removed |
| Tatar translation is essential for MVP | Partially confirmed | Useful but not required for MVP |
| Background recording is required for MVP | Rejected | Deprioritized in MoSCoW |

---

## Needs Clarification

- Which ASR model will be used (Whisper, wav2vec2, etc.)
- Speaker diarisation accuracy requirements
- Data storage limits for long-term corpus
- Whether offline processing is required
- Authentication and user roles
- How multilingual tagging (Russian/Tatar) should be stored in database
- Expected dataset size over 1.5-year study

---

## Planned Response

| Learning | Action for MVP v1 | Related Stories |
|----------|------------------|----------------|
| Transcription is core | Implement ASR pipeline first | US-003 |
| Corpus management is critical | Design database + UI early | US-008 |
| Speaker separation is important | Integrate diarisation tools | US-002 |
| Editing transcripts is required | Add correction interface | US-010 |
| Statistics are needed | Design analytics module | US-006 |
| Advanced features are secondary | Delay translation & background recording | US-004, US-005 |