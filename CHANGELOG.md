# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New admin panel for users with role admin (user maintenance and control) in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/202
- Storage size of each audio shown next to it, and total storage usage shown next to the "Аудиозаписи" heading in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Custom audio player with a waveform supporting play/pause, click and drag-to-scrub seeking, and keyboard controls in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Toast notifications, confirmation/input modals, loading skeletons, and empty states across the dashboard and admin panel in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Active tab is now remembered across page reloads in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Responsive layout that stacks the panels on narrow screens in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Audio filtration by specific words, languages, speaker, dates, or load status in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/208
- Audio tags, such as title and date, now are visible in audio list and can be assigned to audio before upload in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/208
- Download button on each audio row (managers/admins): choose Original or Processed audio in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/212

### Changed
- Accent color changed from brown to green, and the profile/upload icons are now black in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Transcription toggle redesigned into an animated line-and-triangle icon (rotates when active) in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Audio files now load lazily (only on first play) and audio status polling was consolidated into a single request instead of one per item in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Native browser alert/confirm/prompt dialogs replaced with in-app toasts and modals in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- General UI polish (shadows, rounded corners, hover and focus states) backed by centralized theme tokens in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206

### Fixed
- Security page background now matches the rest of the application in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206

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
