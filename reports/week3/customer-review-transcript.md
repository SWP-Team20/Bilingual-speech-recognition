# Customer review transcript

## Segments

[00:00:00.000 - 00:00:08.880] side as well i will share the link here from counter talk too okay um firstly i wanted to ask

[00:00:10.500 - 00:00:19.840] do you have a chance to get a sample audio files or uh-huh right so i requested the sample audio

[00:00:19.840 - 00:00:30.400] files from our um the kazan federal university um professors they are getting it ready uh and

[00:00:30.400 - 00:00:35.600] it's the the family that are getting it ready they promise that they will send it to me this week so

[00:00:36.320 - 00:00:43.860] um today and tomorrow is still this week so we are waiting right so um i reminded them several

[00:00:43.860 - 00:00:52.500] times so let's wait a little more and then i will um keep asking them again okay moving next

[00:00:52.500 - 00:01:03.650] Next, on our last meeting, we discussed the MVP-1 scope and it was to implement transcription,

[00:01:03.650 - 00:01:08.410] audio upload and a page with audio streams.

[00:01:08.410 - 00:01:20.370] From our first print, we implemented all of this and I think, yeah, Roman can show how

[00:01:20.370 - 00:01:21.370] it works.

[00:01:21.370 - 00:01:27.380] I have a video to show you.

[00:01:29.400 - 00:01:30.040] Oh, cool.

[00:01:31.220 - 00:01:32.000] Let's see.

[00:01:38.050 - 00:01:39.410] So now can you see my screen?

[00:01:42.620 - 00:01:45.160] Yeah, but not really.

[00:01:45.360 - 00:01:45.940] Let me see.

[00:01:47.560 - 00:01:47.920] Oh, yeah.

[00:01:48.820 - 00:01:52.930] Well, I see it says you are demonstrating the screen.

[00:01:52.930 - 00:01:57.770] What about if I open the video?

[00:01:57.990 - 00:01:58.370] Can you see?

[00:01:59.540 - 00:02:00.040] Oh, yes.

[00:02:00.140 - 00:02:01.140] Yes, I can see it now.

[00:02:01.140 - 00:02:07.900] So, as you see, we have a sample audio because we don't have one yet.

[00:02:08.700 - 00:02:11.940] I recorded a little audio.

[00:02:13.800 - 00:02:26.790] Firstly, as MVP scope, we need to show you that in the sample.

[00:02:26.790 - 00:02:30.250] And we need to identify Tatar speech.

[00:02:30.250 - 00:02:45.180] so we have a button here and we have audio player right inside so I will now start the video

[00:02:45.180 - 00:02:53.890] it's a test of audio for MVP 1. Now there will be a pause and it should be automatically

[00:02:53.890 - 00:02:59.870] you can't be able to cut the pause for a

[00:02:59.870 - 00:03:03.000] tatar words for checking transcripts

[00:03:03.000 - 00:03:09.730] Malay Matur Bala Kiz

[00:03:09.730 - 00:03:12.280] End of test

[00:03:12.280 - 00:03:20.520] So now you see we are uploading this audio to the site

[00:03:20.520 - 00:03:26.250] Now it is what I see

[00:03:26.250 - 00:03:27.250] And?

[00:03:27.250 - 00:03:30.250] It is test of audio for MVP1

[00:03:30.250 - 00:03:33.480] Now it will be a pause and it should be automatically

[00:03:33.480 - 00:03:41.040] So, as you can see, long silence was stripped out.

[00:03:41.040 - 00:03:44.040] That transcription.

[00:03:44.040 - 00:03:49.210] I don't know if you can see it, because it is really small, but...

[00:03:49.210 - 00:03:54.210] Yeah, we have Russian words as black and Tatar as green.

[00:03:54.210 - 00:04:00.210] Right now it is really, really, like, first version, first try,

[00:04:00.210 - 00:04:13.640] try because to correctly identify the Tatar words we need training data. So we need your sample audio.

[00:04:14.440 - 00:04:21.880] Right, right, right. For now, Tatar words are recognized only if they are

[00:04:21.880 - 00:04:33.960] consisted of Russian letters. So you know we have words with Tatar letters like

[00:04:33.960 - 00:04:46.320] E, U, only Russian letters now work. So Balai, Matur, Bala, Kiz,

[00:04:46.320 - 00:04:48.750] The end of the test.

[00:05:21.720 - 00:05:26.720] it would appear in audio tracks list and you can listen to it.

[00:05:26.720 - 00:05:28.720] Also, long silences will be stripped out.

[00:05:28.720 - 00:05:31.720] As you can see, this is all implemented.

[00:05:31.720 - 00:05:36.820] The second user story is transcription.

[00:05:36.820 - 00:05:42.990] It is mostly implemented, but we will work on it in the next week

[00:05:42.990 - 00:05:45.990] because not all Tatar words are recognized.

[00:05:45.990 - 00:05:50.220] and the audio streams page

[00:05:50.220 - 00:05:56.820] is mostly focused on design.

[00:05:57.660 - 00:06:01.100] So if you have some suggestions,

[00:06:01.580 - 00:06:03.180] you can say it right now.

[00:06:03.740 - 00:06:04.660] We will consider them.

[00:06:06.490 - 00:06:09.090] Yeah, so on my side,

[00:06:09.210 - 00:06:11.850] the design-wise, it looks fine.

[00:06:11.850 - 00:06:14.350] It's minimalistic design, right?

[00:06:14.350 - 00:06:18.900] at this point is just enough, right?

[00:06:18.900 - 00:06:21.500] I was wondering about the transcription, right?

[00:06:21.500 - 00:06:27.860] The transcribed text is just a text, just words in a row, right?

[00:06:27.860 - 00:06:29.660] Not separated into sentences.

[00:06:30.940 - 00:06:38.060] Yeah, we have like two versions of the text.

[00:06:38.060 - 00:06:40.760] The first one is raw audio.

[00:06:40.760 - 00:06:43.260] So it is processed into words.

[00:06:43.260 - 00:06:53.260] these words are needed like a plain text to be counted in statistics like as you require so

[00:06:54.540 - 00:07:02.060] you can search for these words but if you wish the transcription to be a sentences we have

[00:07:02.860 - 00:07:11.080] another version it can appear in transcription if you want uh-huh it could be in sentences right

[00:07:11.080 - 00:07:17.880] but this is the next step right and it might be more difficult will it be if it appears in

[00:07:17.880 - 00:07:26.350] sentences will it be kind of an obstacle for statistical search no i think not because we are

[00:07:26.350 - 00:07:36.510] already dividing uh this like you know uh if we have commas for example they are with the words

[00:07:36.510 - 00:07:45.000] so we have a word and comma without space so yeah i think right now we are already dividing

[00:07:45.560 - 00:07:54.810] uh comma ends of the words so it should not be an obstacle to statistics right right right okay so

[00:07:54.810 - 00:08:01.290] this i will need to check with the linguists from cafe you right um because it depends right what

[00:08:01.290 - 00:08:09.540] what kind of uh uh text they want to see in the end will this um uh just a flow of words be enough

[00:08:10.100 - 00:08:18.500] or will they want it to be like proper uh proper sentences right so um it depends on them right

[00:08:18.500 - 00:08:25.220] the linguistic needs um at this point so far so good i guess well considering the fact that we

[00:08:25.220 - 00:08:31.460] still don't have the raw material itself but uh on that uh piece of text that you recorded it seems

[00:08:31.460 - 00:08:43.170] to work fine right um and then this division into tracks remember the speakers right at this point

[00:08:43.170 - 00:08:49.890] for this trial piece you have one speaker right there one male voice right now we are not dividing

[00:08:49.890 - 00:08:58.840] into speakers so you you can have multiple speakers but they in transcription it will be a plain text

[00:08:59.480 - 00:09:08.410] so dividing into speakers is planned onto the next versions uh basically i think to divide into

[00:09:08.410 - 00:09:18.290] speakers we need to make transcriptions in sentences as you said yeah so also i think we

[00:09:18.290 - 00:09:27.260] first need a sample audio to divide into speakers because some words can be pronounced differently

[00:09:27.260 - 00:09:40.410] and right now the asr we're using uh it needs to be trained it needs to be trained right right

[00:09:40.410 - 00:09:49.450] right and to train we need the real the material i see okay right so um then on my side um i will

[00:09:49.450 - 00:09:55.930] try to speed up this process of getting the the raw file right and the audio file we need to work

[00:09:55.930 - 00:10:04.330] with but um now at this stage the what what shall we call it a prototype or how do you call this um

[00:10:05.510 - 00:10:12.940] what we have now um yeah it seems to be just um just just just enough to answer the needs

[00:10:13.660 - 00:10:20.860] of this stage of the project i guess also one questions uh maybe you will direct it to kathu

[00:10:20.860 - 00:10:34.170] so how what is the level of precision we need to do to detect a tatar speech for mvp

[00:10:34.170 - 00:10:45.190] of detecting tatar speech right okay yeah let me ask this from them but um i think the main issue

[00:10:45.190 - 00:10:51.270] there well it has to be of course precise enough if it's a exact words i mean if it's a full words

[00:10:51.270 - 00:10:57.190] full sentences uh then well i guess we do need the precision because it's bilingual

[00:10:59.030 - 00:11:09.590] speech contest context right um plus there will be this uh these situations when um the speech

[00:11:09.590 - 00:11:14.310] is not formed yet it's not adult speech right and i think that will be the difficulty right as

[00:11:14.310 - 00:11:19.310] posed by this project and by the task, right?

[00:11:19.790 - 00:11:23.760] So in the sample audio that you recorded,

[00:11:24.340 - 00:11:26.960] it's perfectly pronounced words, right?

[00:11:27.100 - 00:11:30.700] In perfect, by a perfect voice.

[00:11:31.240 - 00:11:34.920] But there, I suspect that in the real raw audio,

[00:11:35.520 - 00:11:39.340] there might be less audible sounds,

[00:11:39.340 - 00:11:41.680] less audible words, right?

[00:11:41.680 - 00:11:46.340] not as close to the microphone as we want them to be pronounced.

[00:11:47.020 - 00:11:49.200] It will not be only words or sentences.

[00:11:49.460 - 00:11:53.340] It will be just this babble, kids babble, ah, ooh, oh, right?

[00:11:53.660 - 00:11:59.340] These kind of, or maybe something similar to words that kids try to pronounce, right?

[00:11:59.440 - 00:12:02.580] But it's not real perfect pronunciation yet.

[00:12:02.580 - 00:12:06.880] So, yeah, at this point, it seems to work perfectly great.

[00:12:06.880 - 00:12:14.220] once we have that raw data, this level of precision, right?

[00:12:14.980 - 00:12:18.740] Even a person cannot always guess what that word was, right?

[00:12:19.280 - 00:12:21.020] In a song, for example, right?

[00:12:21.060 - 00:12:23.220] Or on the radio when you listen to something

[00:12:23.220 - 00:12:26.160] and there is some noise on the background.

[00:12:26.440 - 00:12:29.640] So this is a good question.

[00:12:29.640 - 00:12:35.520] Do we have, if we incorporate AI maybe there

[00:12:35.520 - 00:12:41.200] or this whatever that is the software you're using right however we use it will this software guess

[00:12:41.200 - 00:12:50.000] and predict the words that are being pronounced right now we have uh this asr automatic speech

[00:12:50.000 - 00:13:01.400] recognition uh and uh it is automatically detects uh speech in russian so uh even other words uh

[00:13:01.400 - 00:13:10.080] they are expected to be like some Russian words, maybe Maidap Russian word.

[00:13:10.080 - 00:13:21.030] So because of that right now there are no words with Tatar letters in transcription.

[00:13:21.030 - 00:13:29.820] So we will try another ASR to implement Tatar speech.

[00:13:29.820 - 00:13:39.630] it will improve the level of precision, but of course all of that after the sample audio,

[00:13:39.850 - 00:13:44.840] so we don't know what type of data we have.

[00:13:44.840 - 00:13:53.010] Right, right, right. But that might be a good thing, right? The type of ASR that turns words

[00:13:53.010 - 00:13:59.970] which it doesn't recognize as Russian words, and it turns them just into transcribed words

[00:13:59.970 - 00:14:08.450] in russian right maybe it will be efficient um working with the child speech as well right so

[00:14:08.450 - 00:14:14.690] it doesn't try to make them into some similar russian words but instead it just describes them

[00:14:14.690 - 00:14:24.510] as is also uh you know uh we will have as you requested the feature to manually change the

[00:14:24.510 - 00:14:36.200] words in transcription so i have an idea like would it be all right if uh we we have asr uh

[00:14:36.200 - 00:14:45.040] like tagging the unknown words and like requesting to change it mainly we can we can do that probably

[00:14:45.040 - 00:14:52.880] yeah i think that could be a good thing right so tagging the unknown words or unknown sounds

[00:14:52.880 - 00:15:00.400] yeah in case of a kid in case of a child speech speech it could be just sound so tagging them

[00:15:01.280 - 00:15:08.880] right providing this ipa international phonetic alphabet transcription there for those sounds or

[00:15:08.880 - 00:15:16.690] words yeah words um it we we might only guess what those are and tagging them kind of attracting

[00:15:16.690 - 00:15:23.610] linguists attention right researchers attention uh-huh i think that would be useful it was

[00:15:23.610 - 00:15:34.240] probably it we have no questions yeah thank you so much this looks great sounds great uh also we need

[00:15:34.240 - 00:15:46.620] to firstly get uh your explicit proof if mvp1 that we done is uh corresponding to what we planned and

[00:15:46.620 - 00:15:56.350] what you expected um yeah yeah at this point everything seems to go as planned and uh what

[00:15:56.350 - 00:16:06.170] was expected yeah seems to have been done if any more change i needed you can say it right now

[00:16:07.600 - 00:16:14.480] no no changes here except for what we have discussed i will uh do my best to get that

[00:16:14.480 - 00:16:21.200] raw file as soon as possible right i will request it once again um yeah i think they have their

[00:16:21.200 - 00:16:27.680] session coming up or whatever so exams and things like that so they're busy but um i i will try to

[00:16:27.680 - 00:16:35.520] provide it as soon as possible otherwise uh no just as much as we discussed please okay i also

[00:16:35.520 - 00:16:46.610] we need to show you our backlog. So for this sprint, I think we already shared, we had three

[00:16:46.610 - 00:16:54.890] user stories, transcription, audio upload and audio things page. But for our future work, we have

[00:16:54.890 - 00:17:10.960] at the most priority, add filter by speakers, add tool for statistics, make the

[00:17:10.960 - 00:17:23.680] transcription editable for correcting mistakes, and create a login page with

[00:17:23.680 - 00:17:31.260] with authentication and add functional to delete audio scenes.

[00:17:37.150 - 00:17:41.530] It's what I think we will implement the next,

[00:17:41.530 - 00:17:42.970] something from this list,

[00:17:42.970 - 00:17:49.030] but also we have once, yeah, words count, filter by date,

[00:17:50.490 - 00:17:52.670] and filter by language.

[00:17:52.670 - 00:17:56.670] It also will be done, but I think after, okay.

[00:17:58.820 - 00:18:05.940] right very good and as ramon mentioned i wonder if that fits into uh what you now said as well the um

[00:18:06.500 - 00:18:15.860] tags right tags for um kind of uh not really audible pieces right or ipa transcription tagged

[00:18:16.660 - 00:18:23.440] and searchable right that this i think is a very good feature to have and also have some

[00:18:23.440 - 00:18:30.960] some issues that we will implement if you not take too long time.

[00:18:30.960 - 00:18:39.450] We have some extra time, I think.

[00:18:39.450 - 00:18:40.450] Yeah.

[00:18:40.450 - 00:18:44.320] To make this work in background,

[00:18:44.320 - 00:18:49.260] to add other speech translation,

[00:18:49.260 - 00:18:54.320] and light and dark scenes for the page.

[00:18:54.320 - 00:18:57.810] Aha, right. Some design stuff, right?

[00:18:57.810 - 00:19:07.890] yeah yeah that would be good right if we have time right yeah so is it looks fine

[00:19:07.890 - 00:19:18.680] yeah it looks fine at this point totally fine i guess we are progressing and um yeah i really

[00:19:18.680 - 00:19:25.540] like what you showed me um simple design understandable um yeah features main features

[00:19:25.540 - 00:19:33.300] we could listen we could see the um transcription right uh tatar words are highlighted right in uh

[00:19:33.300 - 00:19:38.900] green so we could see that they're different they stand out probably the same will be happening to

[00:19:38.900 - 00:19:47.220] kids speech right that it doesn't recognize as russian um yeah and provided the transcription

[00:19:47.220 - 00:19:59.120] that could be there ipa style uh this seems to be just fine just it okay if uh no one have

[00:19:59.840 - 00:20:08.240] more questions i think that's it for our meeting today any questions

[00:20:11.220 - 00:20:16.880] all right then yeah no question either yeah thank you guys thank you so much great
