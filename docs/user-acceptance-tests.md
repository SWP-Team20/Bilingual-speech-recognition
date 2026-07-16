
# User acceptance tests

## UAT-001 [Retired]

- **User goal** : Get transcription from audio with russian and tatar speech to use as text data for research analysis
- **Preconditions** : The user has an account. A test audio file (.m4a or .mp3) containing both Russian and Tatar speech is downloaded on the users device. The application is deployed and accessible
- **Step-by-step instructions** :
  1. Open the application and enter login and password
  2. Click on upload button and select the audio file
  3. Wait for the processing to finish
  4. Open and review the generated transcription
- **Expected outcome** : The system outputs a clear text transcription where the Tatar speech colored in green
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : None

## UAT-002 [Retired]

- **User goal** : Delete an incorrectly uploaded audio file to free up system storage
- **Preconditions** : The user has an account with admin or manager access. At least one audio file has been uploaded to the system. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with admin or manager credentials
  2. Choose audio
  3. Click on the red delete button with cross icon next to the file
  4. Confirm the deletion in the warning dialog
- **Expected outcome** : File erased from the storage and its corresponding element disappears from the UI list
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : None

## UAT-003 [Retired]

- **User goal** : Change account password to secure the profile
- **Preconditions** : The user has an account. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and enter login and password
  2. Navigate to the account security page
  3. Enter current password in the designated field
  4. Write a new password
  5. Confirm new password in the verification field
  6. Click "Change password" button
  7. Log out and attempt to log back in using the old password, then using the new password
- **Expected outcome** : The password has changed, and the old password cannot be used to log in to the account
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : None

## UAT-004 [Retired]

- **User goal** : Find a specific uploaded audio file via search to view its transcription without manual scrolling
- **Preconditions** : The user has an account. At least one audio file has been uploaded to the system. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and enter login and password
  2. Click on Search bar
  3. Enter the name of desired and uploaded fie
  4. Click the "See transcription" button
- **Expected outcome** : The system filters the UI list to display only the matching audio files
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : None

## UAT-005 [Retired]

- **User goal** : Create an account for another person so that they can access the application
- **Preconditions** : The user has an account with admin rights. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with admin credentials
  2. Navigate to "Admin-panel" page
  3. Enter a username for the new account in the designated field
  3. Choose access level for the new user from the dropdown menu
  5. Enter the password for the new user
  6. Click the "Create" button
- **Expected outcome** : A new account has been created, and the user can access it using the login and password provided by the administrator
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : None

## UAT-006 [Retired]

- **User goal** : Undo an accidental word deletion while editing a transcription without retyping the whole sentence
- **Preconditions** : The user has an account with manager or admin access. At least one processed audio file with a transcription is available. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with manager or admin credentials
  2. Open the transcription for an audio recording
  3. Click a word and delete it using the word editor
  4. Click «Cancel» on the inline undo strip that appears above the transcription
- **Expected outcome** : The deleted word reappears in the transcription at its original position; no timed toast is shown for this action
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : None

## UAT-007 [Retired]

- **User goal** : Recover an accidentally deleted audio recording within a short grace period
- **Preconditions** : The user has an account with manager or admin access. At least one audio file is visible in the list. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with manager or admin credentials
  2. Select an audio recording and click the delete button
  3. Confirm deletion in the warning dialog
  4. Within 30 seconds, click «Cancel» on the toast notification
- **Expected outcome** : The recording disappears from the list immediately after deletion, then reappears after undo; after 30 seconds without undo the recording is permanently removed
- **Customer comments or observed issues after execution** : Need to extend the timer to 60 seconds
- **Resulting PBIs or issues after execution** : https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/302

## UAT-008 [Retired]

- **User goal** : Recover an accidentally deleted user account from the admin panel within a short grace period
- **Preconditions** : The user has an account with admin access. At least one non-admin test user exists. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with admin credentials
  2. Navigate to the admin panel
  3. Click «Delete» next to a test user and confirm in the dialog
  4. Within 30 seconds, click «Cancel» on the toast notification
- **Expected outcome** : The user disappears from the list immediately after deletion, then reappears after undo; the deleted user cannot log in while soft-deleted; after 30 seconds without undo the account is permanently removed
- **Customer comments or observed issues after execution** : Need to extend the timer to 60 seconds
- **Resulting PBIs or issues after execution** : https://github.com/SWP-Team20/Bilingual-speech-recognition/issues/302

## UAT-009 [Retired]

- **User goal** : Change the language or speaker label for several words at once instead of editing each word individually
- **Preconditions** : The user has an account with manager or admin access. A transcription with multiple words is available. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with manager or admin credentials
  2. Open a transcription and click «Select multiple words»
  3. Select two or more words (Shift/Ctrl+click)
  4. In the bulk toolbar, choose a new language or speaker and click «Apply»
- **Expected outcome** : All selected words update to the chosen language or speaker; the bulk toolbar shows the selection count and closes when dismissed
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : None

## UAT-010 [Retired]

- **User goal** : View word statistics scoped to a single audio recording rather than the whole corpus
- **Preconditions** : The user has an account. At least two processed audio files with transcriptions exist. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in
  2. Navigate to the Statistics tab
  3. Open the filters panel and select one audio recording
  4. Apply filters and review frequent words, speaker, language, or date sections
- **Expected outcome** : Statistics reflect only the selected recording; clearing the audio filter restores corpus-wide results
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : none

## UAT-011 [Retired]

- **User goal** : Correct the displayed title or recording date of an audio file without re-uploading it
- **Preconditions** : The user has an account with manager or admin access. At least one audio file with a transcription is available. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with manager or admin credentials
  2. Open the transcription panel for an audio recording
  3. Click the title / date line at the top of the transcription
  4. Change the filename or recording date in the modal and save
- **Expected outcome** : The updated title and date appear in the transcription header and in the audio list without reloading the page
- **Customer comments or observed issues after execution** : Works as planned
- **Resulting PBIs or issues after execution** : None

## UAT-012 [Active]

- **User goal** : View detailed statistics of speakers with ability to see in which audio each word was spoken
- **Preconditions** : The user has an account with manager or admin access. At least one audio file with a transcription is available. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with manager or admin credentials
  2. Open the statistics panel and find per-speaker statistics
  3. Click the "Detailed Statistics" button
  4. Choose a speaker and click on a word
- **Expected outcome** : The user should be redirected to an audio page with audio and word chosen highlighted
- **Customer comments or observed issues after execution** : Don't have yet
- **Resulting PBIs or issues after execution** : Don't have yet

