# MVP v0 Report

## Overview

MVP v0 is the initial technical milestone of the system. Its goal is to define the architecture and prepare the foundation for implementing the speech processing pipeline.

---

## Current Status

As of Week 2, MVP v0 is in the design and planning stage. No production implementation has been completed yet.

---

## Planned System Components

### 1. Audio Processing Pipeline
- Audio upload handling
- Silence removal / preprocessing

### 2. Speech Recognition (ASR)
- Evaluation of open-source ASR models (e.g., Whisper)
- Transcription of Russian speech

### 3. Speaker Diarisation
- Separation of speakers (mother, father, child)
- Integration of existing diarisation tools

### 4. Language Identification
- Tagging Russian vs Tatar words (future extension)

### 5. Corpus Management System
- Storage of transcripts
- Search and filtering capabilities
- Editable transcript interface

---

## Implemented Work (Week 2)

- User story definition (US-001 to US-010)
- Customer requirements analysis
- MoSCoW prioritization
- Lo-Fi prototype in Figma
- Initial system architecture discussion

---

## Not Implemented Yet

- Backend implementation
- Frontend implementation
- Database schema
- Deployment pipeline
- Audio processing pipeline

---

## Next Steps

- Select ASR and diarisation frameworks
- Define database schema
- Start backend API implementation
- Build minimal audio upload system
- Create initial corpus database