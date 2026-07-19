# Final Meeting -- Cleaned Transcript (EN)

**Source:** `final meeting.mp4` . **Duration:** ~23:50 . **Language:** English  
**Model:** Whisper large-v3-turbo (faster-whisper, int8/CPU, VAD filter) . auto language detection (`en`, p=0.99)  
**Note:** Lightly edited for readability -- filler/false starts trimmed, obvious speech-recognition errors fixed ("expert" → "export", "in a police/Polish network" → "Innopolis network", "get who/kefa" → "KFU", "ASR training game" → "ASR training guide"), and unclear UI terms normalized where the meaning was clear. Meaning preserved. Speaker attribution is inferred from context (no diarization). Two sides: **Team** = student dev team / presenters (Raman, Alexander, Mark; Samir absent), **Client** = non-technical supervisor/customer.

---

**[00:00-00:21] Team/Client:**  
**Team:** It is already recording. Okay, wonderful. So, for today we would like to show you the final outcome of our work.  
**Client:** Wonderful. I guess it is the final week of the project, isn't it?  
**Team:** Yes. Perfect.

**[00:21-00:47] Team:** Let us show you the goal of this week's work. Since the last meeting, we have been polishing the product and fixing some bugs. We have implemented the tab with words by each speaker, as we discussed earlier.

**[00:47-01:18] Team/Client:**  
**Team:** We also made a few small design changes, and we added the ability to export statistics as an Excel spreadsheet or a CSV file. It was not suggested by you -- we just thought it might be useful.  
**Client:** That would be great, absolutely. I think it is a must.

**[01:18-01:46] Team/Client:**  
**Team:** And we refined the UX/UI, which we will show you right now. Let Alexander present the user acceptance tests and show some features of the product.  
**Alexander:** All right, can you see my screen?  
**Client:** Yes, I can see the screen.

**[01:46-02:22] Alexander:** We have one more user acceptance test, which is about detailed speaker statistics. I have logged in as an admin. Let's go to the statistics tab, scroll down and find speaker statistics -- there is a "Details" button. When you click it, we see a list of speakers and the words they have spoken. We can filter this by language, by date, and by audio file.

**[02:25-03:10] Alexander/Client:**  
**Alexander:** Also, if you click on a word, it will show where this word was spoken.  
**Client:** Oh, wonderful, that's cool.  
**Alexander:** Let me show it again. It is supposed to stay highlighted, and it gets unhighlighted when you hover the mouse over the word or over the audio.  
**Client:** Wonderful.  
**Team:** Any suggestions or comments?  
**Client:** No, so far so good. Seems like a very useful feature.

**[03:10-03:43] Team/Client:**  
**Team:** I would like to show some other features on my screen right now. Can you see it? We added a logo and redesigned the authentication page, so the product would be more recognizable.  
**Client:** Yes.  
**Team:** We have added this logo here.

**[03:43-04:23] Team:** That enabled us to extend the search bar, because before there was a big title -- "Bilingual Speech Recognition" -- that covered most of the top area. So here we added a search feature. Let us type "audio," for example. If you are on the audio streams page, they are just filtered right on your screen. But if we are searching from, for example, the statistics tab, there is a drop-down list; you click on the audio and it will redirect you to the audio streams page.

**[04:23-05:16] Team:** Moreover, here is the statistics export. Let us export the statistics, for example -- we can choose how many words we would like to export. When you choose "Export," we can pick, for example, Excel. I open this file and we can see the table: word, language, the number of these words, and the percentage. You can, for example, represent these statistics with a chart in Excel. You can also not choose an exact type but export all statistics, and it will be divided into different sheets.

**[05:16-05:38] Team/Client:**  
**Team:** Down here: frequent words, languages, dates, and speakers.  
**Client:** Right, looks great as well.  
**Team:** We also extended the timer from 30 seconds to 60 seconds, as you requested.

**[05:38-06:13] Team:** And that is it for the product. We have also implemented the ASR training process for you, so you can fine-tune the model. Right now I am showing you the documentation directory. There are a lot of files, and every file has a purpose. The file responsible for training is the ASR training guide.

**[06:13-06:49] Team:** We would like to show you this file quickly, just to see whether you understand what to do -- or whether your IT people, if they read it, would understand how to train it. Basically, the introduction is a summary of the whole file: it introduces who will use the model, who will train the model, and so on.

**[06:49-07:26] Team:** Here we have a diagram of how the ASR works. Let us go through it. First, we have a recording. It is uploaded to the ASR model, it is normalized to a mono file, and it starts detecting voice. First it diarizes -- it splits sentences and words between different speakers. It recognizes the frequency of the voice, for example whether it is a high voice or a low voice, like a man or a woman, and diarizes the word accordingly.

**[07:26-08:03] Team:** For each word, it divides sentences into chunks, and for each chunk it tries to understand whether the word is Russian or Tatar. For this recognition, two models are used: one for transcribing Russian words and one for transcribing Tatar words. The Russian model is pretty much trained and really strong, so there is no point in training it.

**[08:03-08:39] Team:** The focus of training should be on the Tatar ASR. We are using a Whisper model -- it is called Whisper, you can look it up, and there are a lot of training and fine-tuning guides on the internet about it. After a word is transcribed, each word gets its own tag, so it can be displayed in the statistics or in the transcription in a different color.

**[08:39-09:22] Team/Client:**  
**Team:** And after that it cleans up some hallucinations, assigns time codes, and produces a JSON file. So that is the whole pipeline. Right now you have two ways to correct the transcription. You can correct it this way: you uploaded the file, you know this word is not right, and you change it to another word. But this correction does not affect the model -- it only affects the file that is displayed.  
**Client:** Right, so it doesn't train the model?

**[09:22-10:08] Team:** No, it doesn't fine-tune it at all. To fine-tune it, you need to have a pair of audio with speech and transcription data. You have this pair, and then you deploy the model on your GPU, on your computer. Training requires a GPU -- ideally it must have 16 gigabytes. So it must be a really good GPU to train the model, if you want to train it fast.

**[10:10-10:56] Team/Client:**  
**Team:** We didn't link the source, but I can show you right now. If we search for "ASR fine-tuning Whisper," we get the Hugging Face site, and here you can access a whole guide on how to train the model. We just followed this guide.  
**Client:** Yes, yes.  
**Team:** As you can see, we used the large model.  
**Client:** Right, right -- the most capable one.

**[10:56-11:41] Team:** So there is a whole process on how to train the model and how to set it up on your computer. Basically you register on this site, you link your model here, and you just upload these pairs of audio and transcription. The site takes this data through the model and fine-tunes it. So you just need to upload this file and it will be fine-tuned more and more.

**[11:41-12:00] Team:** After some tuning, if you want this current version to be on the product, you confirm that the training for now is done, you export this model, and you put it back into the product.

**[12:00-12:32] Client/Team:**  
**Client:** Can I ask a question, please? When I fine-tune this model, do I have to upload my data to their website, or do I do it locally on my computer?  
**Team:** It is done locally. All your data is processed on your computer -- it does not go to different servers.  
**Client:** Yes, confidentiality is really a thing.  
**Team:** Exactly, it is all done locally.  
**Client:** Wonderful, great.

**[12:32-13:08] Client/Team:**  
**Client:** So this is just an interface to interact with your data.  
**Team:** Exactly. We will add a section to the ASR training guide covering this, a couple of hours after the meeting, so it will be described in full detail and everyone can understand this file.

**[13:08-13:53] Team:** What else do we have here? We have how to measure the quality of transcription -- we have some tests, which show the accuracy of the transcription: how many words were identified correctly or wrongly, and whether there are hallucinations. There is a recommended path for fine-tuning the model, as we just discussed, and some questions and answers. As we discussed, these corrections do not train the model. What else -- is Russian recognition already good enough?

**[13:53-14:44] Team:** Yes, we only need to train Tatar. Also, you can train the model not only by going to this site and uploading pairs of audio and transcription -- you can also go to the backend source and to `data`. There we have a data set of Tatar words. As you can see, there are not many words, but these words help the model identify that yes, this is Tatar language, if it hears this word. But there are really not many of them.

**[14:44-15:15] Client/Team:**  
**Client:** Does it mean that it will not identify other Tatar words, or is it just these words?  
**Team:** No, it is just that if it hears these words exactly, it identifies faster that this is the Tatar language. For other words it must follow the long path of deciding whether this is a Russian or a Tatar word.

**[15:15-15:42] Team:** For this list, the only rule is that you upload one word per line. Here you can see different sections -- frequent words with a space and without. Basically, the most important rule is not to upload words that are ambiguous, that can be identified both as Russian and as Tatar.

**[15:42-16:10] Team:** Because if you upload, for example, the word "бар," it is a word in both Russian and Tatar. It will always be recognized as Tatar if you put it here. So only unambiguous Tatar words should be put here. Yes, that is basically it for the ASR training guide.

**[16:11-16:48] Team/Client:**  
**Team:** We have already linked this file to the Customer Handover. The Customer Handover file is the file you should look at first, after we send you the link to our product. There is a whole instruction there on how to access it, what the project is, and how to interact with it.  
**Client:** Absolutely right, I see.

**[16:48-17:27] Team/Client:**  
**Team:** Right now we need your feedback on the training guide and the Customer Handover, and on whether the product is ready for transition -- or maybe you have tried to use it this week?  
**Client:** I still haven't, because I still don't have proper access to the university VPN. But I will try to sort this out -- I plan to do it with the IT department tomorrow, once they are at work. So hopefully I will have access. I probably need to do that right before the handover; I'd better do it before the handover.

**[17:27-17:46] Team/Client:**  
**Team:** But we need to hand the project over to you today.  
**Client:** Oh, it's today? Right, please send me the link. I will do my best to connect to that university VPN. I got all the instructions and guidelines, but it still wouldn't work.  
**Team:** We will also send you the link to the project repository. I will show it to you right now, along with a brief guide.

**[17:46-18:22] Team/Client:**  
**Team:** So we will send you the link, and you will go to this page.  
**Client:** What will I see?  
**Team:** Exactly this page. You see this green button -- you can download a ZIP. Or you can go to Releases: today it will be release 1.0, so a big version, and there you also have the source code ZIP.

**[18:22-18:58] Team:** After you download it -- right now my connection speed is not great, but you will have the source code. I can show you right now: you would have "Bilingual Speech Recognition," and here you have a guide on how to deploy it on your computer, if you are not able to connect to the deployment in the Innopolis network. So here is the whole guide on how to do it.

**[18:58-19:42] Team:** That is basically what you need. For KFU, for now, they need not to connect to the Innopolis network every time -- instead, they access this repository, download the files as I described, and deploy them on their servers, so they can access it on their own network. Maybe their network is also closed like the Innopolis network, so only KFU members could access the site -- that is what we presume.

**[19:42-20:18] Team/Client:**  
**Team:** So the whole guide is covered. That is all that is needed for the transition, because the deployed product at Innopolis will be closed, as I said, around August. So we will send you the link, and you will deploy it on your own site.  
**Client:** Right, so there is a deadline by which I have to deploy it?  
**Team:** Yes.  
**Client:** Okay, wonderful, sounds great.

**[20:18-20:53] Client:** I guess I will need a short guideline that I will be able to send to KFU -- as you said, how they access the repository, because there are IT people there, but they are also just linguists. Which files to download, and then, as you said, deploy on the server. Just maybe a short step-by-step instruction. And also the deadline, if you could put it there in that file as well.

**[20:53-21:13] Team/Client:**  
**Team:** Okay, so we will send you this information in a Telegram message, I guess today or tomorrow.  
**Client:** So the deadline is tomorrow. Wonderful, great. Sounds good, looks great, looks wonderful.

**[21:13-21:39] Team/Client:**  
**Team:** So, just formal questions about the transition status: is it finalized, or maybe you have some upcoming requests or changes, or something blocking you from the transition?  
**Client:** No, I don't think we have any blockers. I don't think we have any major questions left unresolved.

**[21:39-22:17] Client:** The interface looks great. I love the small improvements you made, also to the logo -- that looks very nice. I think we have accomplished the task of creating this interface that is ready for the linguists to work on. As for that huge task of speech recognition -- the kids' babble -- we already set that task aside as an extra one. Also, we haven't gotten the files from KFU which would allow us to train the model, so we will leave it for the bigger project, for the upcoming parts of the project, to work on. But our project seems to be a success.

**[22:17-22:38] Client:** Great job, you guys, for the great work -- how efficient you were, how organized you are. It's my pleasure to work with you.

**[22:38-23:04] Team/Client:**  
**Team:** So let's wrap this up. We will summarize all the points and send you the link, a step-by-step guide on how to deploy and how to access, which files to look at, and maybe some hints on the product features, in case you forget.  
**Client:** Yes, that is useful.  
**Team:** So this was our last meeting. It was nice working with you.

**[23:04-23:37] Client/Team:**  
**Client:** Same here. Thank you, Raman, Alex, Mark. And Samir is not here today, is he?  
**Team:** No, he's not here.  
**Client:** Well, anyway, say hi to him please. Wonderful job -- you are heroes for completing this summer project. While the majority of university students are away on holidays, and other universities are on holidays, you managed this third semester. Wonderful, thank you so much.

**[23:37-23:46] Team/Client:** Goodbye. Good luck, enjoy the holidays. Thank you. Goodbye.
