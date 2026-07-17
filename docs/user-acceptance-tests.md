# User Acceptance Tests

## UAT-001 [Retired]

- **User goal:** get a transcription from audio with Russian and Tatar speech for research analysis.
- **Preconditions:** the user has an account. A test `.m4a` or `.mp3` file containing Russian and Tatar speech is available on the user's device. The application is deployed and accessible.
- **Steps:**
  1. Open the application and log in.
  2. Click the upload button and select the audio file.
  3. Wait for processing to finish.
  4. Open and review the generated transcription.
- **Expected outcome:** the system outputs readable text where Tatar speech is highlighted.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-002 [Retired]

- **User goal:** delete an incorrectly uploaded audio file to free storage.
- **Preconditions:** the user has manager or admin access. At least one audio file has been uploaded. The application is deployed and accessible.
- **Steps:**
  1. Open the application and log in with manager or admin credentials.
  2. Choose an audio recording.
  3. Click the delete button next to the file.
  4. Confirm deletion in the warning dialog.
- **Expected outcome:** the file disappears from the UI list and can be restored during the soft-delete window.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-003 [Retired]

- **User goal:** change the account password.
- **Preconditions:** the user has an account. The application is deployed and accessible.
- **Steps:**
  1. Open the application and log in.
  2. Navigate to the account security page.
  3. Enter the current password.
  4. Enter a new password.
  5. Confirm the new password.
  6. Click **Change password**.
  7. Log out and verify that the old password fails and the new password works.
- **Expected outcome:** the password is changed and the old password cannot be used.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-004 [Retired]

- **User goal:** find a specific uploaded audio file by name.
- **Preconditions:** the user has an account. At least one audio file has been uploaded. The application is deployed and accessible.
- **Steps:**
  1. Open the application and log in.
  2. Click the search bar.
  3. Enter the desired audio title.
  4. Click **See transcription**.
- **Expected outcome:** the UI list shows matching audio files and allows opening the transcription.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-005 [Retired]

- **User goal:** create an account for another person.
- **Preconditions:** the user has admin access. The application is deployed and accessible.
- **Steps:**
  1. Open the application and log in with admin credentials.
  2. Navigate to the admin panel.
  3. Enter a username.
  4. Choose the access level.
  5. Enter the password.
  6. Click **Create**.
- **Expected outcome:** a new account is created and can be used to log in.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-006 [Retired]

- **User goal:** undo an accidental word deletion while editing a transcription.
- **Preconditions:** the user has manager or admin access. At least one processed audio file with a transcription is available.
- **Steps:**
  1. Open the application and log in with manager or admin credentials.
  2. Open the transcription for an audio recording.
  3. Click a word and delete it through the word editor.
  4. Click **Cancel** on the inline undo strip above the transcription.
- **Expected outcome:** the deleted word reappears at its original position.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-007 [Retired]

- **User goal:** recover an accidentally deleted audio recording during the grace period.
- **Preconditions:** the user has manager or admin access. At least one audio file is visible in the list.
- **Steps:**
  1. Open the application and log in with manager or admin credentials.
  2. Select an audio recording and click delete.
  3. Confirm deletion in the warning dialog.
  4. Within 60 seconds, click **Cancel** on the toast notification.
- **Expected outcome:** the recording disappears immediately after deletion, then reappears after restore; after 60 seconds without restore the recording is permanently removed.
- **Customer comments or observed issues:** the requested timer extension was implemented.
- **Resulting PBIs or issues:** [#302](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/302).

## UAT-008 [Retired]

- **User goal:** recover an accidentally deleted user account from the admin panel during the grace period.
- **Preconditions:** the user has admin access. At least one non-admin test user exists.
- **Steps:**
  1. Open the application and log in with admin credentials.
  2. Navigate to the admin panel.
  3. Click **Delete** next to a test user and confirm.
  4. Within 60 seconds, click **Cancel** on the toast notification.
- **Expected outcome:** the user disappears immediately after deletion, then reappears after restore; the deleted user cannot log in while soft-deleted; after 60 seconds without restore the account is permanently removed.
- **Customer comments or observed issues:** the requested timer extension was implemented.
- **Resulting PBIs or issues:** [#302](https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/302).

## UAT-009 [Retired]

- **User goal:** change language or speaker labels for several words at once.
- **Preconditions:** the user has manager or admin access. A transcription with multiple words is available.
- **Steps:**
  1. Open the application and log in with manager or admin credentials.
  2. Open a transcription and click **Select multiple words**.
  3. Select two or more words.
  4. In the bulk toolbar, choose a new language or speaker and click **Apply**.
- **Expected outcome:** all selected words update to the chosen language or speaker.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-010 [Retired]

- **User goal:** view word statistics scoped to a single audio recording.
- **Preconditions:** the user has an account. At least two processed audio files with transcriptions exist.
- **Steps:**
  1. Open the application and log in.
  2. Navigate to the Statistics tab.
  3. Open the filters panel and select one audio recording.
  4. Apply filters and review frequent words, speaker, language, or date sections.
- **Expected outcome:** statistics reflect only the selected recording; clearing the audio filter restores corpus-wide results.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-011 [Retired]

- **User goal:** correct the displayed title or recording date of an audio file without re-uploading it.
- **Preconditions:** the user has manager or admin access. At least one audio file with a transcription is available.
- **Steps:**
  1. Open the application and log in with manager or admin credentials.
  2. Open the transcription panel for an audio recording.
  3. Click the title/date line at the top of the transcription.
  4. Change the filename or recording date in the modal and save.
- **Expected outcome:** the updated title and date appear in the transcription header and audio list without reloading the page.
- **Customer comments or observed issues:** works as planned.
- **Resulting PBIs or issues:** none.

## UAT-012 [Active]

- **User goal:** view detailed speaker statistics and see in which audio each word was spoken.
- **Preconditions:** the user has manager or admin access. At least one audio file with a transcription is available.
- **Steps:**
  1. Open the application and log in with manager or admin credentials.
  2. Open the statistics panel and find per-speaker statistics.
  3. Click **Detailed Statistics**.
  4. Choose a speaker and click a word.
- **Expected outcome:** the user is redirected to the audio page with the selected word highlighted.
- **Customer comments or observed issues:** pending.
- **Resulting PBIs or issues:** pending.
