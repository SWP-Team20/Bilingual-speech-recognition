
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
- **Customer comments or observed issues after execution** : Approved by customer
- **Resulting PBIs or issues after execution** : None

## UAT-004 [Active]

- **User goal** : Find a specific uploaded audio file via search to view its transcription without manual scrolling
- **Preconditions** : The user has an account. At least one audio file has been uploaded to the system. The application is deployed and accessible.
- **Step-by-step instructions** :
  1. Open the application and enter login and password
  2. Click on Search bar
  3. Enter the name of desired and uploaded fie
  4. Click the "See transcription" button
- **Expected outcome** : The system filters the UI list to display only the matching audio files
- **Customer comments or observed issues after execution** : Don't have yet
- **Resulting PBIs or issues after execution** : Don't have yet

## UAT-005 [Active]

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
- **Customer comments or observed issues after execution** : Don't have yet
- **Resulting PBIs or issues after execution** : Don't have yet
