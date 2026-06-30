# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Audio filtration by date in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/196
- Added ability to fetch audio storage information https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/197

## [0.2.0] - 28.06.2026

### Added
- Authentification page before accessing the website in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139
- Three roles of the account: user (can observe content on the page), manager and admin (can upload and delete the audios) in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139
- Ability to delete audio in a track list in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139
- Profile button with options: security and log out in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139
- Security page with ability to check the username and role, change the password, and delete the account in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139
- Speaker diarization (who is speaking) with sentence and speaker segmentation in the transcript in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139

### Changed
- Audio Streams page was renamed to Dashboard page and completely redesigned, including new font sizes and layout in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139
- All interface was localized to Russian instead of English in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139
- Now transcription contain bilingual Russian/Tatar recognition pipeline with audio language detection per segment and per-word ru/tt tagging in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139

### Fixed
- Transcription now displays raw text with punctuation and casing in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/139
- Audio can be deleted if it is still in database but now on the server storage in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/150

## [0.1.0] - 21.06.2026

### Added

- Audio Streams page with list of audios and upload functionality in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/42
- Uploaded audio transcription feature in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/49
- Color coding Russian and Tatar words in transcription in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/52

[unreleased]: https://github.com/SWP-Team20/Bilingual-speech-recognition/compare/v0.2.0...main
[0.2.0]: https://github.com/SWP-Team20/Bilingual-speech-recognition/releases/tag/v0.2.0
[0.1.0]: https://github.com/SWP-Team20/Bilingual-speech-recognition/releases/tag/v0.1.0
