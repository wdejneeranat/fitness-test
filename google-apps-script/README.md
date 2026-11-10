# Google Sheets setup

The app asks for consent to save contact details and test results to Google Sheets, save a PDF assessment to Google Drive, and email the assessment to the participant. It sends profile data when the user selects **บันทึกข้อมูล**. When the participant selects **สร้าง PDF เก็บใน Drive และส่งอีเมล**, the script generates a PDF, stores it in the deploying account's Drive folder `verve_event` (creating the folder if needed), and emails the same PDF to the saved participant address. The email is sent from the Google account that deployed the Apps Script, not from a Hotmail address. Both stages use the same record ID, so results update the profile row instead of creating a second row. The sheet also records when consent was given. Deploy this script as a web app bound to the target spreadsheet.

1. Open the target [Google Sheet](https://docs.google.com/spreadsheets/d/10v-weiEiAkpQte9R1AoNs-YgYaf_FupvWMuRh3qRsb0/edit).
2. Select **Extensions → Apps Script** and replace the editor contents with `Code.gs`.
3. Save. In the function selector next to **Run**, select `authorizeAssessmentPermissions` (not `doPost`) and click **Run**. Choose the Google account that should own the `verve_event` folder and send the emails, then review and allow Google Sheets, Google Drive, PDF generation, and email permissions. This creates `verve_event` in that account's Drive if it does not exist.
4. Select **Deploy → Manage deployments**. Edit the existing web app deployment, select **New version**, and deploy it before publishing the updated website. If you create a new deployment instead, copy its new URL into `config.js`.
5. Set **Execute as** to the account that authorized the permissions and **Who has access** to **Anyone**.
6. Confirm `config.js` contains the deployed web app URL ending in `/exec`.
7. Publish the updated app on GitHub Pages.

The script writes a header row when the selected tab is empty. Profile saves create or update one row; result saves find that row by its record ID, update its test columns, generate a PDF report, save it in the deploying account's `verve_event` Drive folder, and email the saved PDF as an attachment. File names include the participant name and record ID. New deployments add the Vertical Jump and Action Rule columns; old Board Jump columns are retained for existing data. The script does not return spreadsheet data to the browser. Browsers cannot read the response from this public Apps Script endpoint, so the app reports that the request was sent but cannot confirm the sheet write, Drive save, or email delivery.

## Privacy and access

Keep the spreadsheet and `verve_event` Drive folder private and share them only with authorized people. The web app deployment must accept unauthenticated submissions so visitors can submit results; anyone who obtains the deployment URL may attempt to add rows, create PDFs, and trigger emails from the deploying Google account. Do not put credentials or access tokens in `config.js`. The app requests consent before sending contact details, test results, saving the PDF, and sending the assessment email. Never put an email password in the app or Apps Script source.
