# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Ability to download .xlsx and .csv with statistics (filters also affect the contents of those files) in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/329
- Now dropdown list with results appears while searching in statistics or admin panel tab in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/335
- Added Speakers tab with ability to see where each speaker spelled the word in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/339

### Changed
- Auth page redesigned to more flat style with app logo on it in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/331
- Logo now displayed instead of project name in dashboard page in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/331

### Fixed
- Now list of audios does not reuploads when search string is inputted in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/335

## [0.4.1] - 12.07.2026

### Added
- New words count statistics with ability to filter by speaker, date and language in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/273
- New speaker statistics with ability to filter by audio files, date, language in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/274
- New language statistics with ability to filter by audio files, date, speakers in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/275
- New per-day statistics with ability to filter by audio files, speakers, language in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/277
- Transcription download with .txt and .json options in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/282
- Ability to change speaker's label in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/285
- Badge for "Other" language added near "Russian and Tatar" in https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/291
- Soft deletion with undo for words in transcription, audios, and users in https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/291
- "Select multiple words" mode in transcription in https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/291
- Selected words in transcription can be reassigned to different speaker/language in https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/291
- Hint for editing a transcription in https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/291
- Ability to change audio name/date from transcription header in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/291

### Changed
- All alert messages have been changed to modal windows in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/276
- Speaker filter is now a dropdown list in https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/285
- Transcription header now present both title of audio and its recording date in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/291

### Fixed
- Words are now divided by spaces instead of being a plain text for role "user" in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/278
- Authentication token is now extended to 24 hours, user no longer gets logged out mid-work in https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/291
- Multi-word insert: space-separated input creates separate tokens (not one word) in https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/291
- Language selection dropdown menu while patching a word now matches overall design style in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/291
- No more flickering when opening modal windows in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/291
- All header, speaker's label, and text are now left-aligned in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/291

## [0.3.0] - 05.07.2026

### Added
- New admin panel for users with role admin (user maintenance and control) in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/202
- Storage size of each audio shown next to it, and total storage usage shown next to the "Audios" heading in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Custom audio player with a waveform supporting play/pause, click and drag-to-scrub seeking, and keyboard controls in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Toast notifications, confirmation/input modals, loading skeletons, and empty states across the dashboard and admin panel in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Active tab is now remembered across page reloads in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Responsive layout that stacks the panels on narrow screens in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Audio filtration by specific words, languages, speaker, dates, or load status in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/208
- Audio tags, such as title and date, now are visible in audio list and can be assigned to audio before upload in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/208
- Download button on each audio row (managers/admins): choose Original or Processed audio in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/212
- Search bar, where user can find audios by the title in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/213
- Manual correction of the transcription: click a word to fix its spelling or change its language tag, and add or delete words; word counts update in real time in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/240

### Changed
- Accent color changed from brown to green, and the profile/upload icons are now black in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Transcription toggle redesigned into an animated line-and-triangle icon (rotates when active) in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Audio files now load lazily (only on first play) and audio status polling was consolidated into a single request instead of one per item in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- Native browser alert/confirm/prompt dialogs replaced with in-app toasts and modals in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- General UI polish (shadows, rounded corners, hover and focus states) backed by centralized theme tokens in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206

### Fixed
- Security page background now matches the rest of the application in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/206
- UI is now flexible and representable on mobiles or narrow screens in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/213
- Cross-audio speaker matching no longer collapses two distinct voices of the same recording into one speaker; each global speaker is claimed by at most one voice per audio in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/214
- Saving a transcription with a newly created speaker no longer fails with a foreign-key error: words are now flushed before orphan-speaker cleanup, so the fresh speaker is not deleted mid-transaction in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/214

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

[unreleased]: https://github.com/SWP-Team20/Bilingual-speech-recognition/compare/v0.4.1...main
[0.4.1]: https://github.com/SWP-Team20/Bilingual-speech-recognition/releases/tag/v0.4.1
[0.3.0]: https://github.com/SWP-Team20/Bilingual-speech-recognition/releases/tag/v0.3.0
[0.2.0]: https://github.com/SWP-Team20/Bilingual-speech-recognition/releases/tag/v0.2.0
[0.1.0]: https://github.com/SWP-Team20/Bilingual-speech-recognition/releases/tag/v0.1.0
