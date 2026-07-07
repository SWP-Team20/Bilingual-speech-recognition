# Meeting Summary — Product Demo to Customer (2026-07-06)

Demo meeting: the team (Speaker 1 — Roman, Speaker 3 — Alexander, driving the product demo) shows the customer/supervisor (Speaker 2) the current state of the app for transcribing and analyzing bilingual (Russian/Tatar) child speech. Duration ~38 minutes.

## Demonstrated features

- **Audio upload and search**: files can be found by name (including renamed), by date, by topic; content search (e.g. finding audio that mentions a specific name) becomes available once transcription is ready.
- **User roles**: admin creates users and assigns roles (manager/admin); login and password are auto-generated but editable; password reset goes through the administrator.
- **Access rights**: managers and admins can upload and run audio; admins can listen to audio and view the transcription. Access can be revoked.
- **File metadata management**: a button next to each audio file lets you change its name and recording date (date can be left blank — defaults to upload date rather than recording date).
- **Storage info**: displays how much storage space files take up.
- **Filters**: by processing status (queued / processing / done / error — with the ability to find and delete/resubmit problem files), by language (Russian only / Tatar only / mixed / neither), by speaker (drop-down list of speakers already known to the system), by recording date.
- **Manual transcription correction**: you can click a word and change its language or text (edits are highlighted in green).
  - Known bug: selecting 2–3 words at once counts as a single word — being worked on, fix planned for next week.
  - Known bug: the transcription is missing spaces for the end user — also to be fixed.

## Discussion on training the ASR model

- The customer asks whether ready-made transcriptions already exist for the audio files provided by KFU (files provided earlier are large and noisy/low quality).
- The team explains: to fine-tune/train the model, raw audio alone isn't enough — accurate text transcriptions are needed (especially important given noise, mic quality, background sounds like TV).
- Training-data requirements discussed: duration and character of the audio should resemble real project recordings; ideally the model should learn to ignore background noise (TV/radio) and, over time, recognize specific speakers' voices (mother/father/child).
- The customer confirms she won't do manual transcription herself, but will check with the KFU team whether they already have transcripts; in the future, a separate task may involve manually transcribing hours of recordings to train the model.
- Agreed to learn more after tomorrow's meeting with KFU.

## Statistics roadmap (next sprint)

Priority order of attributes to visualize: **words → language → speakers → dates**.

- **Words**: a word cloud/grid of the most frequent words, filterable by speaker and by language (Russian/Tatar), with the ability to tag/mark specific words.
- **Language**: comparison of word counts in Tatar vs. Russian (two bars), filterable per recording and, eventually, by date — to see how the language ratio changes day to day (the customer flagged this as especially important for the bilingualism angle). Later: comparing two selected dates.
- **Speakers**: who was the main speaker in a recording (mom/dad/oldest child/other — including TV, radio, guests), aggregated stats per day. The customer stressed this is core to the project's goal — tracking how the child's amount of speech changes with age; managers should be able to manually correct a misidentified speaker.
- **Dates**: how many words/audio files were uploaded on a given date — including spotting missed recordings.

## Other backlog items

- Continuing the UI redesign (green theme, icons, animations); light/dark theme toggle planned within the week.
- Viewing a Tatar word → translation to Russian: not currently in focus, will require an LLM/translator in the future.
- Idea to manually adjust ASR segment boundaries — deemed complex to implement (would require pipeline changes), not taken up this sprint.

## Outcomes and next steps

- The customer is generally happy with the progress and current functionality; no explicit new requests at this point — she plans to give feedback after tomorrow's meeting with the KFU team (possible small additional tasks).
- Next sync — tomorrow.

---
*Summary compiled from the ASR transcript (see transcript.md), manually structured and condensed.*
