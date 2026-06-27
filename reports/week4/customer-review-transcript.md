# Sprint Review Transcript

- **Model:** Whisper large-v3-turbo (faster-whisper)
- **Note:** Lightly edited for readability — filler/false starts trimmed, obvious speech-recognition errors fixed, embedded Russian/Tatar phrases translated (Tatar test words kept). Meaning preserved. Two sides: **Team** = student dev team (presenter + Alexander), **Client** = non-technical supervisor/customer.

---

**[00:00–00:10] Team:** Let me switch that on… okay, here we are, the recording has started.

**[00:10–00:40] Team:** First of all, we have completed Sprint 2. This week we made quite a lot of changes and added new features. Our scope for the week was to improve the transcription, as you requested last week.

**[00:42–01:30] Team:** We also added authentication / security for the interface, because you said there must be users who can upload and delete, and users who cannot. So we divided the system into three user roles:
- **User** — can only observe audios; cannot upload or delete.
- **Manager** — can upload, delete, and edit the obtained transcription; full control of the interface.
- **Administrator** — an additional role for your technical department.

**[01:34–02:30] Team:** The administrator has an admin panel and can create users and change users' passwords. We made it so that no one can access the site without your explicit permission: an administrator in your system creates users and gives out the credentials of the account they made (for example, for a family), and they can then change the password themselves, etc.

**[02:30–03:08] Team:** As part of improving transcription, we added speaker diarization. Right now it works mostly correctly — you get "speaker one", "speaker two" in the transcription.

**[03:08–03:55] Team:** We also completely redesigned the page, so it looks more like a high-end product. For now, we'd like to run a User Acceptance Test (UAT) with you: we give you access to the website, and we have a few made-up scenarios. You go through them, and for each test there's an expected outcome — we check whether you can reach those results by following the steps. First, are you currently connected to an Innopolis network?

**[03:55–04:33] Client:** No, but let me try — the university VPN. I'm trying to connect; I used to be able to.

**[Team:]** Our product is deployed on a university virtual machine, so it's only available to university guests, students, and staff.

**[04:33–05:07] (connection/audio troubleshooting)** — "Can you hear me?" / "Yes, yes." / "We sent you the link in the KTOLOG chat — can you please try to access it and, if you can, share your screen."

**[05:07–06:13] Client:** It says loading… it can't access it. Let me share my screen anyway… I don't think it's loading.

**[06:19–07:03] Team:** We can demonstrate from our screen instead — that's better, since your VPN can't reach the website. Alexander will run the User Acceptance Test, going through each of the three scenarios; you just watch.

**[07:03–07:50] Team (Scenario 1 — get a transcript from Russian/Tatar audio):** First we authorize — we'll log in as a manager. As you can see, we're now on the main page and can see the audios. As a manager we can also upload. The catch is that audio takes about twice its own length to process, so I suggest we move on to the next scenario while it processes.

**[07:50–08:27] Team (Scenario 2 — delete an audio):** For this we pre-uploaded an audio. Logged in as administrator/manager, we pick the audio to delete, click the delete button, confirm, and it disappears.

**[08:27–09:30] Team (Scenario 3 — change account password):** This is for the case where someone obtained your credentials. We log into the account, go to the security page, and change the password. We enter the current password and a new one (let's make it "manager 1"), confirm the new password — "Password has successfully been updated." It works; now no one can log in with the old password.

**[09:30–10:09] Team (back to Scenario 1):** Returning to the first scenario: we uploaded the audio, waited for processing to finish, click "Show transcription," and a window pops up. Russian words are shown in black and Tatar words are marked in green. You can play the audio to verify the transcription is correct.

**[10:09–10:53] (screen/audio-sharing troubleshooting)** — same audio as before; switching whose screen is shared so the audio can be heard.

**[11:05–11:27] (test audio playback):** "This is test audio for MVP1. Now there will be a pause and it should be removed automatically. The pause is over. These words are for testing the transcripts: *Malay, Matur, Bala, Kiz*. End of the test."

**[11:47–12:11] Team:** As with your own computer, it takes a moment. Before we go on — do you have any feedback, suggestions, or concerns about these three scenarios that could help us build a more valuable product?

**[12:11–13:24] Client:** It looks good. Let me recap. Scenario 1 was getting a transcription. The next was changing the password — useful not only for leaks/broken passwords, but also because team members come and go on a long-running project, and this is very data-security-sensitive (children's speech and private family data), so passwords need updating periodically. Good that you came up with that scenario. The third was deleting audio — add, transcribe, delete when not needed. It all looks good. Since it's a lot of data being stored, I wonder if it's possible to see how much space it takes — to track how much data we're storing on the server.

**[Team:]** We can probably do that, okay.

**[13:24–14:27] Client:** This would be useful — it's huge amounts of data. At this point it works well.

**[Team:]** I'm glad you're making suggestions, because non-technical clients can't always see features that could exist until we really play with the product; we can't always foresee what's needed.

**[Client:]** At this point it looks good.

**[14:27–15:08] Client/Team (about the real data):** We still don't have the original audio — it's something on the KFU side; it's taking longer than expected, but we can continue development. In development we hit a problem: everything in our system was processed sequentially, not in parallel, so when we plugged in a new model it took much longer than before. We moved it to parallel processing — you can now upload several audios and they're processed in parallel.

**[15:08–16:10] Team:** For now, transcribing takes at least about twice the audio duration. The lower bound is the audio duration itself, because audio can't be processed faster than it plays. To improve speed — to train the model and make it faster — we need a lot of data from this research, not only to speed up transcription but also to identify speakers correctly. Right now we split speakers as "speaker one, speaker two, speaker three," but in the final project we want it to be "mom, dad, child," or someone else.

**[16:38–17:24] Team/Client:** It may take more time, or our pipeline might not work with that.

**[Client:]** I see — it depends on the quality and how heavy the audio files are. So it's crucial to have the files that will actually be used. I'll try to speed it up and get them from the other side as well.

**[17:24–18:11] Team:** One more point: if the server has a GPU, processing will be faster than now.

**[Client:]** I see — so the type/quality of the server matters. They probably already have a server or are negotiating one, since it's a big multi-year project. Good to put on a side note: processing could be quicker with a GPU server.

**[18:11–19:28] Team (HTTPS/SSL):** To authenticate securely we added an SSL certificate — we moved from HTTP to HTTPS. When you get the final project, on your server you'll need to obtain an SSL certificate from an organization. For now, as a demo/test, I made my own (self-signed) certificate, so the browser shows "this website is not secure / has a self-assigned certificate." I want to reassure you that this is not an issue — it's just a testing requirement and will be adjusted in your research deployment.

**[Client:]** I see — that's an important note.

**[19:28–20:33] Team (role demo):** Let me show other features and confirm the roles work. Logging in as a plain user (username "user"): the upload and delete buttons are not available, but you can still open an audio and see its transcription. You can go to your profile, check your role and username, change your password, and also delete the account — it shows a confirmation pop-up so you can't misclick. After confirming, "Your account was successfully deleted," and you can no longer log in with the old credentials.

**[20:33–21:28] Team (admin panel — planned):** Right now we can only create users manually through code. We'll add an admin panel in the navigation tabs showing a list of users, with the ability to change passwords, delete a user, or update a role (user → manager, manager → admin). We'll do that in the next sprint (next week).

**[21:28–22:26] Team/Client (statistics — planned):** The week after, we'll probably work on statistics. That step is currently disabled because it's still in development.

**[Client:]** By statistics you mean… words, languages?

**[Team:]** Yes — as discussed in the previous meeting.

**[22:26–23:15] Team (search, filters, tags — planned):** We'll also add a search bar (located here) and filters for audios, as requested — date, language, and speaker. Next week we'll add tags for audios: you'll be able to change the audio's name and its upload date. There will be a confirmation window for the name and date, because an audio might have been recorded some days before it was uploaded, so it's necessary to be able to change the date.

**[Client:]** Absolutely, yes, that should be possible.

**[23:15–24:02] Team (design feedback):** As the front-end designer, I'd change the brown color to something more user-friendly — maybe blue. If you have any preference, feel free to say so.

**[Client:]** Green would be good — it's a partly Tatar project, so green fits. Brown feels too official.

**[Team:]** Agreed.

**[24:02–24:56] Team (next sprint scope):** So that's it for the current sprint. Let's confirm the scope for next week:
- Admin panel to create/maintain users.
- Tags for audio uploads.
- Possibly: patching/editing the transcription so you can correct mistakes.
- Start work on filters (may not be finished — perhaps the sprint after).

**[24:56–27:22] Team (quality requirements & tests):** A few words on quality requirements — we compiled three, each with a test:
1. **Audio confidentiality** — audios are confidential, so we need proper authentication; no unauthorized user should access the site.
2. **Transcription accuracy/correctness** — researchers shouldn't have to rewrite an entirely wrong transcription, so we keep an eye on this.
3. **Maintainability** — we also check pull-request quality so we can restore history if something goes wrong, and in case ownership is handed to other developers.
To test these, we created automated tests in GitHub Actions: a Python script checks accessibility as an unauthorized user, the quality of transcriptions, and the pull requests themselves.

**[Client:]** Great, I see.

**[27:24–29:09] Wrap-up:**

**[Client:]** Nice, looks good. That's all for now.

**[Team:]** Any suggestions or comments? Did we do anything wrong?

**[Client:]** No, so far so good. I really like how it looks — the visual part and the functions. Let's hope we manage to get the real files, so we can work with raw material that may sound different and deal with noise. For now, let's aim at this kind of clean recording and develop the features on that basis, and hopefully get the files in time. If not, we'll pass this on and there'll be updated versions later. All right — looks good, sounds good.

**[Team:]** If you're satisfied, let's call it a day and finish the meeting. It was nice talking with you.

**[Client:]** Same here. Thank you everyone, great work — thank you for keeping track, being punctual, and proceeding with the project. I really like that you manage to explain the technical stuff in non-technical language. Very cool. Thank you, guys. Goodbye.

**[Team:]** Goodbye.
