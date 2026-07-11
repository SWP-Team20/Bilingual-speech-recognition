
# Customer Handover 

## 1. Handover scope

**Current Status:** Ready for independent use

Currently, full deployment or independent operation on the customer side is blocked because the customer is not able to connect to the Innopolis network or deploy the product independently. Therefore, recent User Acceptance Tests (UAT) and trial validations have been conducted via shared-screen sessions.

## 2. Current Product Status and Handover Scope
All core features that were required by the customer are implemented. The system currently supports bilingual Russian-Tatar speech recognition, complete with comprehensive statistical tracking (per-speaker, per-language, per-date), and an admin panel for user maintenance.

- **Transferred / Delegated:** 
  - Source code access via the `SWP-Team20/Bilingual-speech-recognition` repository
  - Functional deployment artifacts
- **Retained by Team:** 
  - Active hosting and database management on the Innopolis internal server
  - ASR model training, which is currently conducted by the team outside of the GitHub scope

## 3. Accessing and Using the Product
- **Current Deployment URL:** `https://10.93.26.206:5173`
- **Usage Instructions:** Users can log in using their credentials. The authentication token is valid for 24 hours with a silent refresh mechanism, ensuring sessions do not expire mid-work
- **Data Export:** Processed transcriptions can be directly downloaded in `.txt` and `.json` formats

## 4. Configuration and Secrets Handling
To deploy the system on the customer's own hardware,  environment variables must be configured in the `.env` file.


## 5. Installation and Deployment
The product is fully containerized. Once the customer prepares an independent environment, the basic deployment steps are:

1. Clone the repository
2. Configure the `.env` file
3. Build and launch the containers
4. For detailed infrastructure setup, please refer to the [Deployment Instructions](/docs/deployment.md)

## 6. Operational Notes and Troubleshooting
- **Data Management:** The system features a soft-deletion mechanism for audio files, users, and transcription words. This includes a 30-second undo window for audio and user deletion to prevent accidental data loss.
- **Transcription Editing:** Managers and admins can change speaker labels, manually correct spelling. Words are strictly divided by spaces to prevent plain-text formatting issues.

## 7. Known Limitations and Risks
- **Network Restrictions:** As the current deployment relies on internal Innopolis infrastructure, external customer access remains a limitation.
- **ASR Performance:** While the core functionality is complete, the Automatic Speech Recognition (ASR) model is still undergoing refinements to achieve peak performance

## 8. Remaining Actions and Support
The codebase is prepared for final handover, but the following actions remain:
- Final refinement of features, hotfixing of remaining minor bugs, and general UI polish
- Assisting the customer in establishing their own accessible deployment environment to unblock independent use

## 9. Documentation Entry Points
For deeper operational insight, refer to the following maintained documents:
- [README.md](/README.md) - Access instructions and project overview
- [Deployment Instructions](/docs/deployment.md) - Detailed guide for infrastructure setup
- [User Stories](/docs/user-stories.md) - Expected product behavior and feature tracking
- [Architecture](/docs/architecture/README.md) - System overview and architecture decision records (ADRs)
