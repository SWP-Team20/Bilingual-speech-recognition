# Customer Review Summary

- **Date of recording:** 2026-06-27
- **Duration:** ~29 min
- **Language:** English
- **Participants:** Student dev team and a non-technical client
- **Project:** Bilingual Speech Recognition

## Purpose

Sprint 2 review + demo, plus a User Acceptance Test (UAT) of three scenarios. The client couldn't reach the site (deployed on a university VPN-only virtual machine), so the team demoed from their own screen.

## What was delivered this sprint

- **Role-based access control (3 roles):**
  - *User* — view/observe audios only (no upload/delete).
  - *Manager* — upload, delete, and edit transcriptions; full interface control.
  - *Administrator* — admin panel; create users and change their passwords (intended for the client's technical department).
- **Improved transcription** + **speaker diarization** ("speaker one/two/…", mostly correct).
- **Transcription view:** Russian words in black, Tatar words highlighted in green; audio playback to verify.
- **Account self-service:** change password, delete account (with confirmation pop-up to prevent misclicks).
- **Security:** moved HTTP → HTTPS with an SSL certificate (currently self-signed for testing — browser "not secure" warning is expected and will be replaced with a real cert on the client's production server).
- **Performance:** switched from sequential to **parallel** processing; multiple audios can now be processed at once.
- **Complete UI redesign.**
- **Quality assurance:** 3 quality requirements (confidentiality, transcription accuracy, maintainability), each with automated tests in **GitHub Actions** (unauthorized-access checks, transcription quality, PR quality).

## UAT scenarios demonstrated

1. Get a transcript from Russian/Tatar audio (log in as manager → upload → show transcription).
2. Delete an audio (pick → delete → confirm).
3. Change account password (security page → current + new password → confirm).

All passed during the demo.

## Key discussion points

- **Processing speed:** currently ≥ ~2× the audio's duration; lower bound is the audio length itself. Will improve with more training data and especially a **GPU server** (noted as a recommendation for the client's production environment).
- **Real data still missing:** original audio files are delayed on the **KFU** side. Development continues on clean/test recordings for now; the team flagged that real recordings may be noisier/heavier and could stress the pipeline.
- **Speaker labels:** want to evolve from "speaker 1/2/3" to semantic labels like "mom / dad / child."
- **Design:** client prefers **green** over the current brown (fits the partly-Tatar theme); brown felt "too official."

## Client feedback / requests

- Add a way to **see/track storage usage** (how much data is stored on the server) — data volume will be large.
- Endorsed the password-change feature (useful as team members rotate on/off a long-running, security-sensitive project).
- Overall: very satisfied with visuals and functionality; appreciated the non-technical explanations.

## Next sprint scope (agreed)

- **Admin panel** to create/maintain users (change password, delete user, update role).
- **Tags for audio uploads** — editable audio name and upload date (with a confirmation dialog; upload date may differ from recording date).
- **Transcription editing/patching** — let users correct transcription mistakes (tentative).
- **Search bar + filters** (date, language, speaker) — started, may carry into the following sprint.
- Later: **statistics** (words, languages — currently disabled/in development).

## Action items

| Owner | Item |
|---|---|
| Client | Chase/obtain the real Russian–Tatar audio files (delayed on KFU side); push for a GPU-capable production server. |
| Team | Build admin panel; add audio tags (editable name/date); add transcription editing; begin search & filters; plan statistics feature; keep storage-usage visibility in mind as a new feature. |
| Both | Continue on clean test recordings; revisit once real (noisier) data arrives. |
