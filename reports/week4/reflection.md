# Reflection

## Learning points
The team has learned:
* to maintain secure authentification through HTTPS protocol,
* to create and maintain testing of the product,
* to deal with ASR and speaker diarization,
* to localize the project.


## Validated assumptions
* Authentication works good, all user roles have right permissions;
* Transcription improved, speaker diarization works;
* Interface was successfully translated to Russian;
* Audio processingworks in parallel.


## Friction and gaps
* Corpus manager design appears too formal;
* Size of audio (with transcription) in the storage shall be visible near that audio in the list;
* Customizable audio tags, such as title or date are necessary.


## Planned response
Two PBIs were created in correspondence to friction and gaps, and audio tags are already covered by [US-018](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/106):
* [Corpus Manager Redesign](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/161).
* [US-021: Audio storage size information](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/164)

Moreover, new features are planned to be added next sprint, such as:
* [US-010: Correct mistakes](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/13),
* [US-019: Admin page and functionality](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/132).
