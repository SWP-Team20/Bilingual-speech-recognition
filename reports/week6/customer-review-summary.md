# Customer Meeting Week 6 - Summary

## Summary

At the meeting, the team showed the results of user acceptance testing and went through the new features of the product for bilingual Russian/Tatar transcription: undo for deleting words, restoring deleted audios and accounts, mass changing language/speaker labels, statistics by words/languages/dates/speakers, downloading transcripts in TXT/JSON, and editing audio metadata. The customer confirmed that the interface and basic scenarios look ready for self-use after the improvements of Week 7.

We discussed that the timer for restoring deleted audio and deleted users should be increased from 30 to 60 seconds. We also confirmed the access restriction: a regular user can download TXT, but not JSON, as JSON contains internal identifiers and the original names of audio files.

The second part of the meeting focused on handover documentation and the transfer of the KFU product. The team explained the repository, deployment/setup guide, init_db, admin credentials, `.env`/secrets handling, troubleshooting, data management, and risks.The client has confirmed that the handover document is clear and sufficient, and the product can be considered ready as a tool for linguists, provided that the final polishing week is completed.

ASR model training remains the maximum goal and depends on whether the team receives text transcripts from KFU/the family. If the data is received at the beginning of the next week, the team will attempt to start training; if not, a document with instructions for training the model should be prepared.

## Key solutions

- Increase the undo/recovery window for deleting audio and users from 30 to 60 seconds.
- Keep ordinary users able to download the TXT transcript.
- Prevent ordinary users from downloading JSON because it contains sensitive technical data.
- Focus on making the tool ready for linguists as the main goal of the project.
- Only conduct ASR training if high-quality text transcripts are available on time; otherwise, prepare a training guideline.
- Share KFU materials through the client, including links, files, documentation, and instructions.

## Action items

- Team: change recovery timer for audio and users to 60 seconds.
- Team: finish UI, find and fix bugs for Week 7.
- Team: add/improve comments in code for support.
- Team: prepare document on how to train ASR model.
- Team: send client link to repository, handover-documents and instructions.
- Client: try to access current deployment through university VPN.
- Client/KFU: If possible, provide text transcripts for ASR training.

## Timeline

- 00:00:00 - 00:03:58: Demonstration of UAT features: undo word deletion, recovery of audio/users, batch label editing, statistics filters, and metadata editing.
- 00:03:58 - 00:05:52: Discussion of the recovery timer; decision to increase it to 1 minute.
- 00:05:52 - 00:07:35: demonstration of downloading TXT/JSON transcripts and access restrictions.
- 00:07:35 - 00:12:34: discussion of statistics: frequent words, language stats, dates, speakers, filters, and manual adjustment of labels.
- 00:12:34 - 00:14:18: discussion of speaker recognition and limitations of automatic voice matching between audio.
- 00:14:18 - 00:18:03: review Customer Handover: repository, deployment, setup, scope, ASR training dependency.
- 00:18:03 - 00:21:23: deployment details: initDB, admin credentials, environment file, installation, data management, soft deletion.
- 00:21:23 - 00:23:29: Week 7 scope: bug fixes, UI polish, access/deployment assistance, documentation, and code comments.
- 00:23:29 - 00:25:02: Review of README/root documentation and documentation navigation clarity.
- 00:25:02 - 00:27:13: Confirmation of product readiness and discussion of ASR training guideline.
- 00:27:13 - 00:30:20: end of the meeting, access via VPN, temporary deployment until August, and further transfer of source code.