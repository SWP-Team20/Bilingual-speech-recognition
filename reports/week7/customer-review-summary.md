# Meeting Summary — Final Meeting (Week 7, Project Handover)

**Source:** `final meeting.mp4` . **Duration:** ~23:50 . **Language:** English  
**Participants:** **Team** (Roman, Alexander, Mark — Samir absent) and **Client** (non-technical supervisor/customer).  
**Purpose:** Final sprint demo and formal handover of the product — present the last features, walk through the ASR training guide, and get the Client's confirmation that the transition is complete.

---

## 1. Final features delivered

- **Words by speaker** — the tab discussed in the previous meeting is now implemented. In Statistics → Speaker statistics → **Details**, you get a list of speakers with the words they spoke, filterable by language, date, and audio file. Clicking a word highlights where it was spoken (highlight clears on hover).
- **Statistics export to Excel / CSV** — *not requested by the Client*, added on the team's initiative. You choose how many words to export; the Excel output has word, language, count, and percentage columns, chartable in Excel. Exporting "all statistics" splits the output into separate sheets: frequent words, languages, dates, speakers. **Client's reaction: "that's a must."**
- **UI/UX refinements** — added a logo and redesigned the authentication page for recognizability. Removing the large "Bilingual Speech Recognition" title freed space to extend the **search bar**: on the audio streams page results filter inline; from the statistics tab, a drop-down redirects you to the audio streams page.
- **Deletion timer extended 30 s → 60 s**, as agreed in the Week 6 meeting.

## 2. ASR training guide — walkthrough

The team delivered the **ASR training guide** in the documentation directory (Plan B agreed in Week 6, since transcripts never arrived) and walked the Client through it live.

### Pipeline, as documented
Recording uploaded → normalized to mono → voice detection → **diarization** (splits sentences/words per speaker, using voice frequency, e.g. high vs. low voice) → sentences split into per-word chunks → each chunk classified **Russian or Tatar** → transcription by one of **two models** → each word tagged (drives the color-coding in statistics/transcription) → hallucination cleanup → timecodes assigned → JSON output.

### Key training facts established
- **Only the Tatar model needs training.** The Russian model is already strong; training it has no purpose.
- **Manual transcription corrections in the UI do NOT train the model** — they only change the displayed file. This was stated twice and explicitly confirmed to the Client.
- **Fine-tuning requires audio + transcription pairs** — audio alone is not enough.
- **Hardware:** training needs a GPU, ideally **16 GB**, for reasonable speed.
- **Method:** the team followed the **Hugging Face** Whisper fine-tuning guide, using the *large* model. Register, link the model, upload the audio/transcription pairs, fine-tune iteratively, then export the model and put it back into the product.
- **Quality measurement** — the guide covers how to measure transcription accuracy (correct vs. wrong words, hallucinations), plus a recommended fine-tuning path and a Q&A section.

### Client's confidentiality question (important)
**Client asked:** when fine-tuning, does data have to be uploaded to the Hugging Face website, or is it local?  
**Team answered: fully local** — all data is processed on the Client's own computer, nothing goes to external servers; the site is only an interface/library layer. The Client flagged confidentiality as "really a thing" and was satisfied.

### Tatar word list (`backend/source/data`)
- A dataset of unambiguous Tatar words that lets the model identify Tatar **faster**; it does **not** limit which Tatar words can be recognized — other words simply take the longer Russian-vs-Tatar decision path.
- **Format rule:** one word per line; sections exist for frequent words with and without spaces.
- **Critical rule:** never add **ambiguous** words that exist in both languages. Example given: **"бар"** — adding it would force it to always be recognized as Tatar.

### Committed follow-up
The team promised to **expand the ASR training guide with a section on this local/Hugging Face workflow within a couple of hours after the meeting**, so it is fully self-explanatory.

## 3. Handover mechanics

- **Customer Handover** is the entry-point document — the first thing to read after receiving the link. It covers access, what the project is, and how to interact with it. The ASR training guide is linked from it.
- **Repository:** the Client receives a link, downloads via the green button (ZIP) or from **Releases** — today's is **release 1.0**, with source code ZIP.
- **Deployment guide** is included, for deploying locally when Innopolis-network access isn't available.
- **Path for KFU:** rather than connecting to the Innopolis network each time, KFU downloads the repo and deploys on their own servers, presumably inside their own closed network so only KFU members can reach it.
- **Deadline:** the Innopolis deployment shuts down around **August**, so the Client must redeploy before then.

### Client's explicit request
A **short step-by-step guideline to forward to KFU**, covering: how to access the repository, which files to download, how to deploy on the server, **and the deadline written into that file** — because KFU's people are partly linguists, not only IT.

**Team committed to:** sending this via **Telegram, today or tomorrow**, along with the link, the step-by-step deploy/access guide, which files to look at, and a refresher on the product's features.

## 4. Outstanding item — Client's own access

The Client **still has not been able to use the app**, lacking working university VPN access despite having the instructions. They plan to resolve it with the IT department the next day. Note the sequencing issue raised in the meeting: the Client wanted access *before* the handover, but the handover happened **today** regardless.

## 5. Transition status — confirmed

The team asked the formal question: is the transition finalized, or are there upcoming requests, changes, or blockers?

**Client's answer: no blockers, no major unresolved questions.**

- **Minimum goal — interface ready for linguists: accomplished.** The Client praised the interface and the logo/small improvements.
- **Maximum goal — speech recognition for children's babble: formally set aside as an extra**, since the files from KFU needed to train the model never arrived. Left for the **bigger / upcoming parts of the project**.
- **Client's verdict: "our project seems to be a success."**

## 6. Closing

The Client thanked the team for their efficiency and organization, asked that regards be passed to Samir (absent), and noted the team completed the project over a summer semester while other universities were on holiday. This was the final meeting.

---
*Summary compiled from the ASR transcript (see `customer-review-transcript.md`), manually structured and condensed.*
