# Architecture Documentation

This directory contains the maintained architecture documentation for the Bilingual Speech Recognition project.

The documentation describes the current delivered architecture of the product: a React/Vite frontend, a FastAPI backend, PostgreSQL metadata storage, local file storage for audio/transcript artifacts, and an ASR processing pipeline.

## Dynamic View
The dynamic view illustrates how the system's components interact at runtime to fulfill use cases. We use a [Sequence Diagram](dynamic-view/dynamic.md) to map out the exact flow of data and control.  

### Scenario: Bilingual Audio Processing and Transcription
This sequence diagram represents the primary workflow of our application: a user uploading an audio file containing bilingual speech, and the system processing it to return a transcribed text

### Why this scenario is important
This scenario represents the core proposition of our MVP v2. It demonstrates the complete lifecycle of a user request, highlighting how audio data is ingested, where the machine learning computation occurs, and how the final transcription is returned to the client

### Architecture Decisions, Integration Boundaries, and Quality Requirements
- **Modularity and Integration Boundaries:** The diagram highlights the separation of concerns. The API Gateway handles state, while the Audio Preprocessor is isolated service. This makes the integration boundaries clear via standard API calls
- **Maintainability:** By decoupling the audio processing logic from the transcription logic, we can update or swap the model without affecting the preprocessing steps or the client-facing API
