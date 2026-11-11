# Google Sheets, Drive, and email setup

The app shares profile drafts between `dry-slope.html` and `assessment.html` in the same browser and on the same origin. Accepted Dry Slope agreements and assessment profiles/results are saved to the configured Google Sheet using the same record ID. The agreement form includes the current terms from the original Google Form and records the agreement version and timestamp.

Dry Slope acceptance creates a PDF copy of the agreement, saves it in the [Dry Slope Drive folder](https://drive.google.com/drive/u/2/folders/1jyCtZ4mWK3pf6fpLv1tfwkXvICksb3Xm), and emails the participant with that PDF attached. The fitness assessment report is generated as a PDF with the radar chart, overall action guidance, and per-test breakdown shown in the attached report reference. It is saved in the [Fitness Test Drive folder](https://drive.google.com/drive/u/2/folders/1J0dOJnkD6HwMsSIVOfFL9LwecUYPkoep), and that same saved PDF is attached to the email sent to the participant.

## Deploy the Apps Script

1. Open the target [Google Sheet](https://docs.google.com/spreadsheets/d/1_km-l77IVk5IuCMVsFxIfa-56opsh8elOtNkEVFTrhw/edit?gid=0#gid=0).
2. Select **Extensions → Apps Script** and replace the editor contents with `Code.gs`.
3. Save. In the function selector next to **Run**, select `authorizeAssessmentPermissions` (not `doPost`) and click **Run**. Choose the Google account that has access to the target Drive folder and sends the emails. Review and allow Google Sheets, Google Drive, PDF generation, and email permissions.
4. Select **Deploy → Manage deployments**. Edit the existing web app deployment, select **New version**, and deploy it before publishing the updated website. If you create a new deployment instead, copy its new URL into `config.js`.
5. Set **Execute as** to the account that authorized the permissions and **Who has access** to **Anyone**.
6. Confirm `config.js` contains the deployed web app URL ending in `/exec`.
7. Publish the updated app.

The script uses the existing Drive folders `1jyCtZ4mWK3pf6fpLv1tfwkXvICksb3Xm` for Dry Slope agreements and `1J0dOJnkD6HwMsSIVOfFL9LwecUYPkoep` for Fitness Test reports; it does not create other folders. The account executing the web app must have permission to add files to both folders. The sheet writes headers when empty and adds new agreement columns when needed. Profile/agreement saves update one row; accepted agreements create a PDF in the Dry Slope folder and email it as an attachment. Result saves locate that row by record ID, update test values, create the fitness report PDF in its folder, and email that saved file as an attachment.

The browser uses `no-cors` for the public Apps Script endpoint, so it cannot confirm the sheet write, Drive save, or email delivery. Verify those in Google Sheets, the target Drive folder, and the recipient's mailbox after deployment.

## Privacy and data sharing

Profile drafts are stored in browser `localStorage` so the two functions can prefill one another. This only shares data between pages using the same browser profile and website origin; it does not synchronize across devices or browsers. Keep the spreadsheet and Drive folder private and share them only with authorized people. Anyone who obtains the public web app URL may attempt to submit data and trigger emails from the deploying Google account. Do not put credentials or access tokens in `config.js`.
