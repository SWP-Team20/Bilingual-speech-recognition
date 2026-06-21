
Customer review summary

--------------------------------------------------------------------------------
WHAT THE MEETING WAS
--------------------------------------------------------------------------------
A sprint-review / demo call between a development team (Roman + a teammate) and a
client/supervisor who liaises with linguists at Kazan Federal University (KFU). The
project is a web app for uploading audio and transcribing bilingual (Russian/Tatar)
speech, ultimately aimed at studying children's speech.

--------------------------------------------------------------------------------
MVP-1 — DEMONSTRATED & ACCEPTED
--------------------------------------------------------------------------------
The three planned MVP-1 user stories were demoed on a recorded sample audio:
  1. Audio upload — works; uploaded track appears in the audio-tracks list and is playable.
  2. Audio-streams page — implemented, currently design-focused / minimalistic.
  3. Transcription — mostly implemented:
       - Long silences are automatically stripped out.
       - Russian words shown in black, Tatar words highlighted in green.
       - Two text versions exist: raw "words in a row" (for statistics/search) and an
         optional sentence version.
The client explicitly confirmed MVP-1 matches what was planned and expected. No changes
requested beyond what was discussed.

--------------------------------------------------------------------------------
KEY LIMITATION & ROOT CAUSE
--------------------------------------------------------------------------------
- Tatar recognition is very preliminary: only Tatar words spelled with Russian letters are
  recognized; words with Tatar-specific letters (Ә, Ү, etc.) are not yet handled.
- The current ASR detects Russian and forces unknown words into Russian-like spellings.
- The real blocker: NO real training/sample data yet. The KFU professors/family are
  preparing sample audio and promised to send it "this week"; the client will keep chasing
  it (the contacts are busy with exams).

--------------------------------------------------------------------------------
OPEN QUESTIONS / DECISIONS PENDING
--------------------------------------------------------------------------------
- Output format: plain word-flow vs. full sentences — client must check with KFU linguists
  what they actually need. (Team says sentences won't break statistical search, since
  punctuation is already split off words.)
- Required precision level for detecting Tatar speech in the MVP — client to ask KFU.
- Concern raised: real-world audio will be children's babble — quiet, unclear,
  not-yet-formed speech, far harder than the clean recorded sample.

--------------------------------------------------------------------------------
AGREED IDEAS / NEXT STEPS
--------------------------------------------------------------------------------
- Try a different ASR better suited to Tatar / non-Russian sounds, AFTER sample data arrives.
- Speaker diarization (splitting by speaker) is deferred to a later version; it depends on
  sentence-level transcription + sample data.
- New idea (well received): have the ASR auto-tag unknown words/sounds and optionally
  provide IPA (International Phonetic Alphabet) transcription for them — tagged and
  searchable — to flag them for linguists. Manual editing of transcriptions is also planned.

BACKLOG (future work, by priority):
  High:  filter by speaker; statistics tool; editable transcription; login + auth;
         delete audio streams.
  Later: word count; filter by date; filter by language.
  If time allows: background processing; additional speech translation; light/dark theme.

--------------------------------------------------------------------------------
ACTION ITEMS
--------------------------------------------------------------------------------
- CLIENT: chase KFU for the raw/sample audio files; check with linguists on desired output
  format (words vs. sentences) and required Tatar-detection precision.
- TEAM: continue transcription work next week; evaluate an alternative Tatar-capable ASR
  once sample data arrives; proceed with backlog items above.

Overall tone: positive. Client is satisfied with progress and the minimalistic design;
main dependency holding things back is the missing real audio data.
