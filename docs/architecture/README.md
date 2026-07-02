# Architecture Documentation

This directory contains the maintained architecture documentation for the Bilingual Speech Recognition project.

The documentation describes the current delivered architecture of the product: a React/Vite frontend, a FastAPI backend, PostgreSQL metadata storage, local file storage for audio/transcript artifacts, and an ASR processing pipeline.

## Static View

The static view illustrates the main structural components of the system and how they are connected. We use a [Component Diagram](static-view/static.md) to show the internal components, external actors, storage systems, and main communication paths.

### Scenario: System Component Structure

This component diagram represents the main architecture of the application: users interact with the frontend, the frontend communicates with the backend API, and the backend coordinates authentication, audio management, transcription processing, database access, and file storage.

### Why this scenario is important

This scenario is important because it shows how the main parts of the system are organized. It helps explain which responsibilities belong to the frontend, backend, database, local storage, and ASR processing pipeline. This makes the architecture easier to understand, maintain, and discuss when product changes are needed.

### Architecture Decisions, Integration Boundaries, and Quality Requirements

- **Coupling and Cohesion:** The diagram shows that the frontend, backend, database, file storage, and ASR pipeline have separate responsibilities. The frontend is focused on user interaction, while the backend handles API logic, authentication, persistence, and processing coordination.
- **Maintainability:** The current design is maintainable because the main system concerns are separated into clear components. However, the backend still coordinates several responsibilities, including API handling, database access, local file storage, and ASR processing, so future changes to processing or storage may require backend updates.
- **Quality Requirements:** This structure supports confidentiality because protected audio access goes through backend authorization. It also supports maintainability because the component boundaries make the system easier to review, test, and evolve.

## Dynamic View
The dynamic view illustrates how the system's components interact at runtime to fulfill use cases. We use a [Sequence Diagram](dynamic-view/dynamic.md) to map out the exact flow of data and control.  

### Scenario: Bilingual Audio Processing and Transcription
This sequence diagram represents the primary workflow of our application: a user uploading an audio file containing bilingual speech, and the system processing it to return a transcribed text

### Why this scenario is important
This scenario represents the core proposition of our MVP v2. It demonstrates the complete lifecycle of a user request, highlighting how audio data is ingested, where the machine learning computation occurs, and how the final transcription is returned to the client

### Architecture Decisions, Integration Boundaries, and Quality Requirements
- **Modularity and Integration Boundaries:** The diagram highlights the separation of concerns. The API Gateway handles state, while the Audio Preprocessor is isolated service. This makes the integration boundaries clear via standard API calls
- **Maintainability:** By decoupling the audio processing logic from the transcription logic, we can update or swap the model without affecting the preprocessing steps or the client-facing API
