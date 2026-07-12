# Customer Meeting Week 6 - Transcript

**Source:** `Customer Meeting Week 6.mp4` . **Duration:** ~30:20 . **Language:** English  
**Model:** Whisper large-v3-turbo (faster-whisper) . auto language detection  
**Note:** Two sides: **Team** = student dev team / presenters, **Client** = non-technical supervisor/customer.

---

**[00:00-00:30] Team:** The meeting is already being recorded. I will share the recording with you after the meeting is over. We cannot hear you yet.

**[00:30-01:07] Team:** Let us start. First, we would like to present the User Acceptance Test. Alexander will share the screen, since you still cannot access the app directly, right?

**[01:07-01:39] Team:** We have several new user acceptance tests. The first one is undoing an accidental word deletion while using transcription. We have refined transcription patching: if you delete a word, you can revert the action and the deleted word returns.

**[01:39-02:15] Team:** The next test is recovering an accidentally deleted audio recording. For example, if you delete the wrong audio track, you have 30 seconds to revert the action and restore the audio. You can also recover an accidentally deleted user account from the admin panel within a short grace period. If you delete the wrong user, you can revert it within 30 seconds.

**[02:15-02:43] Team:** You can also change the language label or speaker label for several words at once. For example, if you need to change the language label for a whole sentence, you can select several words and then change the language or speaker label.

**[02:43-03:23] Team:** We also added a statistics tab. In the filters, you can pick specific audio tracks. For example, if I want to see statistics only for this audio file, I apply the filter and now we only see the words spoken in this specific audio.

**[03:23-03:59] Team:** The last UAT item is changing the currently displayed title or recording date without re-uploading the file. We can now change the audio file name and the upload/recording date. That is all for the UAT scenarios. Any comments or suggestions?

**[03:59-04:22] Client:** Everything looks great. I was wondering about the timeout for undoing or reverting a deleted account or deleted audio. Why is it 30 seconds? Why not a minute or an hour?

**[04:22-04:45] Team:** Basically, 30 seconds is a standard pattern used in many apps. If you need more, we can increase it.

**[04:45-05:52] Client/Team:**  
**Client:** Maybe a minute would be better. It could be accidentally deleted, and then a person goes back to find the file they need and it is not there. Extending it a little bit would be safer.  
**Team:** For words in transcription, there is no timer. We have an undo stack, so you have 20 actions to undo. For audio, I added a 30-second timer because audio takes a lot of storage, and the reason to delete audio is usually to release storage. That is why it is a timer: after that, you cannot undo the action. The same applies to users. Do you want us to extend both audio and user deletion recovery to one minute?  
**Client:** Yes, now I see the point. Let's still make it a minute, just in case. I think that would be safer.

**[05:52-06:35] Team:** We also added transcription downloads, as you requested in the KFU meeting. There is now a download button, and you can download both TXT and JSON.  
**Client:** Perfect. Can you download and show how the JSON looks?  
**Team:** The JSON has the audio split by words, and the words are grouped into sentences, so you can analyze it.  
**Client:** Wonderful. That looks great.

**[06:35-07:35] Team:** In JSON, the words are connected to sentences, the sentences are assigned to a speaker, and each sentence has a language. For TXT, we use a simpler readable format: speaker, sentence, speaker, sentence. We also restricted access to transcription downloads for regular users. A regular user can download TXT, because they can already see it on the site, but they cannot download JSON because it contains the audio ID and the original name of the audio track, which must remain confidential.  
**Client:** Right, that is too much information.

**[07:35-08:18] Team:** Let us look at the statistics panel. First, we have frequent word statistics. There is a preview window, and you can open it full-screen. There are filters, and you can show up to 500 words at the top. As discussed, you can filter by language, speaker, date, or a specific audio track.

**[08:18-08:55] Team:** For the visual presentation, we chose bar charts. You can display either the number of spoken words or percentages. The same template is used for the next statistics section: you can choose numbers or percentages and apply filters. For languages, right now the options are Russian and Tatar.

**[08:55-09:38] Client/Team:**  
**Client:** Can you go to the audio tracks and patch a word in the transcription as another language, not Russian and not Tatar? Pick a word and set it as "Other." Then go back to statistics. Now we can see another language. I do not know if we need an option to explicitly add another language so it does not show only as "another language," but instead as a specific language name.

**[09:38-10:20] Team/Client:**  
**Team:** I think we should focus on Russian and Tatar. The unclear words children pronounce may fall into that "Other" category. The recognition model may classify them as some language, and researchers can explicitly mark them as "Other" because we do not yet know whether they are Russian words, Tatar words, or something else.  
**Client:** Right, just "Other."

**[10:20-11:01] Team:** The "Other" words also appear in frequent words. You can see them here with a different color. The date statistics are straightforward: they show how many words are associated with specific dates, and you can filter by audio track.

**[11:01-12:34] Team:** Now let us look at statistics by speaker. We should also show how to change a speaker label. Go to an audio track, select multiple words, and assign them to another speaker if the recognition model matched them incorrectly. If you press on the speaker label, you have two options: change the label only for this dialogue or sentence, or change it in the whole transcription. We just changed "speaker" to "speaker one," and now it appears in the statistics as "speaker one."

**[12:34-13:30] Client:** In the ideal scenario, the voice recognition model should keep recognizing that voice -- a male voice, female voice, or child's voice -- as the same person, whatever we call them, for example "speaker one." Ideally, it keeps recognizing the voice and assigning that name to it.

**[13:30-14:18] Team/Client:**  
**Team:** Right now, when you upload a long audio, the model identifies speaker 1, speaker 2, speaker 3, and maybe speaker 1 again because it is a conversation. If you change the label of speaker 1 in the first sentence to, for example, "mom," it will change all instances of speaker 1 to "mom" within that audio transcription. I am not sure how it will work across many audios if the same voice appears in a new audio. We would need to test and train the model.  
**Client:** We do not have the text transcription for the audio yet, right?  
**Team:** Not yet. It will only be possible after obtaining that.

**[14:18-14:51] Team:** We have only one more week to develop the product. After that, we will transition it to you. Let us now check the Customer Handover document and verify it with you. You can tell us whether you need more information or documentation. Can you see the file?

**[14:51-15:31] Team:** Right now, we have developed all core features. We will add the feature to see specific words by speaker, as we discussed in the last meeting -- for example, to see the baby's words across several times. That is not a core feature; it is an additional feature. The core features are developed, and we conducted tests and validated them.

**[15:31-16:45] Team:** The product is deployed on the current site, but it is only available to people who have access to the Innopolis network. To give you the app with code so you can deploy it on your own servers and access it from your network, we will open the repository publicly. We will give you the link. In the repository, you will have all the code, a description, and the full guide on how to deploy, set up, and maintain the product. You can clone the repository or download it as a ZIP.

**[16:45-17:30] Team:** The system supports bilingual Russian/Tatar speech recognition, statistical tracking, and the admin panel. The repository contains the code and deployment artifacts. We also plan to train the ASR model if we have time, but that depends entirely on how early we receive the text transcriptions. We only have one week left.

**[17:30-18:03] Team:** If we cannot train the model, Plan B is to write a document explaining how to train it so you can keep refining it later. I think this is important whether or not we get the transcription now, because the model can be improved more and more as better transcription data becomes available.

**[18:03-18:56] Team:** For deployment, you download the repository and run a specific file called `init_db`, which initializes the database. It creates a default admin in the system, so you can log in with those credentials. The credentials are login `admin` and password `admin admin admin`. Then the admin can change the password, give access to your IT person, create users, assign roles, and maintain the system.

**[18:56-20:09] Team:** For configuration and secrets handling, we have an environment file. This file is different for every system and computer. For example, on your system it will contain the KFU IP address, and it will be created automatically, so you do not need to configure it manually. Just remember that this file exists, and if something goes wrong, your IT person can check it. Everything is documented there.

**[20:09-20:59] Team:** Installation is: clone the repository, check the environment file, build the app, and if anything else is needed, check the deployment instructions and troubleshooting documentation. For data management, the system creates, reads, updates, and deletes files. This week we built soft deletion with a timer. The timer will be extended from 30 seconds to 60 seconds to prevent accidental data loss. For transcription, because ASR is not perfect, we developed manual transcription editing.

**[20:59-22:06] Team/Client:**  
**Team:** The main limitation is that the currently deployed app relies on Innopolis infrastructure and servers, so you cannot access it directly right now. ASR is also not trained to the ideal level yet. Next week, we will refine features, find and fix bugs, polish the UI, and assist you with accessing or deploying the product. At the moment, you can only interact with KFU online, right?  
**Client:** Yes, only online at the moment.

**[22:06-22:57] Team/Client:**  
**Team:** To transition the product, we need to give it not only to you, but to KFU.  
**Client:** I think we can go through me, and I will pass it on to KFU.  
**Team:** Okay. We will send you the link, the files, the documents, and instructions. The documentation will include access instructions, setup guides, product behavior, and architecture.  
**Client:** Wonderful. Perfect.

**[22:57-23:29] Team/Client:**  
**Team:** Do we get your validation of this handover document?  
**Client:** Yes, absolutely. I like everything. It sounds nice and logical.  
**Team:** We will also work next week on commenting the code so you do not need to read thousands of lines, but can check the comments and understand what specific parts do.  
**Client:** Absolutely.

**[23:29-24:15] Team:** Roman, can you share the screen again? We also need to check the root/README. When you go through it, can you understand what the product is?

**[24:15-25:02] Client/Team:**  
**Client:** Yes, I can understand. It is a bilingual product. From this file, I can see how to run the app, where to read the setup and deployment guide, where to check releases and latest changes, and where to find the handover scope. The links look clear.  
**Team:** That is all we needed to clarify.

**[25:02-26:36] Team:** Based on what we said, can you confirm that the product will be ready for independent use after our Week 7 work next week?  
**Client:** Yes. The interface is great. We had the minimum goal of developing the tool that linguists could use. The speech recognition part was the maximum goal. Considering that we got the audio files late, they are not very clear, and we still do not have the transcript needed to train the model, we are setting aside that maximum goal for now. We are focusing on the tool for linguists, and with that in mind, everything looks ready to work. The guidelines are there, and I like what has been done.

**[26:36-27:13] Team/Client:**  
**Team:** What remains for us is to create a document explaining how to train a model.  
**Client:** That would be great. If by some miracle we get the files from KFU today, tomorrow, or Monday, I will send them to you. But no pressure: if you have time and manage to start training at the beginning of next week, great. If not, a guideline would be perfect and enough.

**[27:13-28:02] Team:** Alexander, can you check whether we covered everything or whether anything from your scope is still unsaid?  
**Alexander:** I think we covered everything we had to cover.  
**Team:** Okay, if that is all, we can finish the meeting for this sprint and meet again next week.

**[28:02-28:42] Client:** I wanted to ask: if I want to access and play with the app myself, will I be able to do that if I connect to the university VPN?  
**Team:** I think yes.  
**Client:** Then I need to configure the university VPN. I was in touch with the IT department, and they were trying to help me with remote desktop or AnyDesk. I will keep working on that so I can check how it works.

**[28:42-29:21] Team:** The current link and server were provided to us by the course team. It will probably be available until August. After that, it will likely shut down, so we will not be able to keep that deployment. We will give you the repository and source code so you can deploy it yourselves.

**[29:21-30:20] Client/Team:**  
**Client:** Wonderful. I think Samir shared the link earlier in the chat, but I will ask him to send it again in Telegram so I can try accessing it through the university VPN. That seems to be it. Thank you, guys. It looks great so far. Everything is nicely planned, and you ran the meeting smoothly. Very good job so far -- you sound like professionals.  
**Team:** Thank you. Goodbye. Enjoy the evening.