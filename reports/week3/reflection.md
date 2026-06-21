# Reflection

## Learning points
The team has learned:
* to create and refine product backlog items,
* to identify and fix occured bugs in development,
* to plan and estimate tasks in Planning Poker,
* to deploy the project on Ubuntu VM,
* to present the MVP to the customer,
* to create a release on GitHub,
* to maintain changelog.


## Validated assumptions
* Uploading audio and playing it works perfectly.
* Words matched as Russian or Tatar both has different color in transcription.


## Friction and gaps
* More trained and precise ASR is needed for Tatar speech recognition;
* VM IP must be hardcoded, as frontend sends wrong request to the backend through ```localhost```.


## Planned response
Two corresponding PBI items appeared to fix friction and gaps:
* [Proper Tatar ASR (dedicated model) for ru/tt code-switching](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/54),
* [Create virtual environment](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/80).

Moreover, new features are planned to be added next sprint, such as:
* [US-010: Correct mistakes](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/13),
* [US-011: Speakers in transcription](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/15),
* [US-012: Filter by date](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/16),
* [US-016: Audio deletion](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/20).
