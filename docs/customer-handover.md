# Customer Handover

## 1. Handover Scope

**Current status:** ready for independent use after the customer has an accessible runtime environment.

Full independent operation on the customer side is still limited by customer-side access and deployment constraints. Recent User Acceptance Tests (UAT) and trial validations were therefore conducted through shared-screen sessions.

## 2. Current Product Status

All core features requested by the customer are implemented. The system supports bilingual Russian-Tatar speech recognition, transcript correction, speaker labels, corpus search, statistics by speaker/language/date/frequent words, CSV/XLSX statistics export, and an admin panel for user maintenance.

**Transferred / delegated:**

- Source code access through the `SWP-Team20/Bilingual-speech-recognition` repository.
- Functional deployment and setup documentation.

**Retained by the team:**

- Active hosting and database management on the Innopolis internal server.
- ASR model experimentation and training, which is conducted outside the GitHub application runtime.

## 3. Accessing and Using the Product

- **Current deployment URL:** `https://10.93.26.206:5173`
- **Login:** users authenticate with their credentials. The frontend can refresh sessions through `/api/v1/auth/refresh`.
- **Transcript export:** processed transcriptions can be downloaded as `.txt` and `.json`.
- **Statistics export:** frequent-word, language, date, speaker, and combined statistics can be downloaded as `.csv` or `.xlsx`.

## 4. Configuration and Secrets

To deploy the system on customer-owned hardware, environment variables must be configured in a local `.env` file. Secret values must not be committed to version control.

## 5. Installation and Deployment

Once the customer prepares an independent environment, the basic deployment steps are:

1. Clone the repository.
2. Configure the `.env` file.
3. Start PostgreSQL.
4. Initialize the database with `init_db.py`.
5. Start the FastAPI backend and React/Vite frontend.

For detailed infrastructure setup, see the [Deployment Instructions](/docs/deployment.md).

## 6. Operational Notes

- **Data management:** audio files and users use soft deletion with a 60-second restore window before permanent purge.
- **Transcription editing:** managers and admins can correct words, insert words, delete words with undo, bulk-edit language/speaker labels, and relabel speakers.
- **Search and filters:** corpus search supports word, language, speaker, date, status, and audio ID filters.

## 7. Known Limitations and Risks

- **Network restrictions:** the current deployment relies on internal Innopolis infrastructure, so external customer access remains a limitation.
- **ASR performance:** Tatar recognition has the largest improvement margin. The concrete levers for raising accuracy, from customer-side transcript corrections to model fine-tuning, are described in the [ASR Training Guide](/docs/asr_training_guide.md).

## 8. Remaining Actions and Support

- Final refinement of minor bugs and UI polish.
- Assistance with establishing a customer-owned accessible deployment environment.

## 9. Documentation Entry Points

- [README.md](/README.md) - project overview.
- [Deployment Instructions](/docs/deployment.md) - infrastructure setup.
- [User Stories](/docs/user-stories.md) - expected product behavior and feature tracking.
- [Architecture](/docs/architecture/README.md) - system overview and architecture decision records.
- [Storage and Search](/docs/storage_and_search.md) - how artifacts, metadata, and searchable words are stored.
- [ASR Training Guide](/docs/asr_training_guide.md) - how speech recognition works and how to improve its accuracy.
