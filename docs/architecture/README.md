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

## Deployment View

The deployment view illustrates how the system is deployed and how runtime infrastructure elements communicate. We use a [Deployment Diagram](deployment-view/deployment.md) to show the browser, frontend server, backend server, PostgreSQL database, local file storage, and machine-learning runtime dependencies.

### Scenario: Local MVP Deployment

This deployment diagram represents the current deployment model of the application: the user accesses the React/Vite frontend through a browser, the frontend communicates with the FastAPI backend, the backend connects to PostgreSQL for metadata, and audio/transcript artifacts are stored in local file storage.

### Why this scenario is important

This scenario is important because it shows the runtime environment required for the current delivered product. It explains which parts of the system must be running, where data is stored, and which deployment boundaries exist between the frontend, backend, database, and local processing environment.

### Architecture Decisions, Integration Boundaries, and Quality Requirements

- **Deployment Boundaries:** The diagram highlights the separation between the browser, frontend server, backend server, database container, local file storage, and ML/runtime dependencies. This makes it clear where communication happens and which parts belong to the local deployment environment.
- **Maintainability:** The deployment model is simple and suitable for the current MVP because each runtime element has a clear purpose. The frontend serves the user interface, the backend exposes API endpoints, PostgreSQL stores metadata, and local storage keeps audio and transcript artifacts.
- **Quality Requirements:** This deployment supports MVP development and testing, but it constrains scalability and availability because the system currently depends on local file storage, a local database setup, and backend-side processing. These constraints should be revisited before production-scale deployment.
