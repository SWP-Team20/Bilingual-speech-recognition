
# User acceptance tests

## UAT-001 [Active]

- **User goal** : Get transcription from audio with russian and tatar speech to use as text data for research analysis
- **Preconditions** : The user has an account. A test audio file (.m4a or .mp3) containing both Russian and Tatar speech is downloaded on the users device. The application is deployed and accessible
- **Step-by-step instructions** :
  1. Open the application and enter login and password
  2. Click on upload button and select the audio file
  3. Wait for the processing to finish
  4. Open and review the generated transcription
- **Expected outcome** : The system outputs a clear text transcription where the Tatar speech colored in green
- **Customer comments or observed issues after execution** : Don't have yet
- **Resulting PBIs or issues after execution** : Don't have yet

## UAT-002 [Active]

- **User goal** : Delete an incorrectly uploaded audio file to free up system storage
- **Preconditions** : The user has an account with admin or manager access. At least one audio file uploaded to thesystem. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and log in with admin or manager credentials
  2. Choose audio
  3. Click on the red delete button with cross icon next to the file
  4. Confirm the deletion in the warning dialog
- **Expected outcome** : File erased from the storage and its corresponding element disappears from the UI list
- **Customer comments or observed issues after execution** : Don't have yet
- **Resulting PBIs or issues after execution** : Don't have yet

## UAT-003 [Active]

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
- **Customer comments or observed issues after execution** : Don't have yte
- **Resulting PBIs or issues after execution** : Don't have yet
