# Google Sheets setup

The app asks for consent beside the profile form. After consent, it sends profile data when the user selects **บันทึกข้อมูล** and sends the four test results when the user selects **ดูสรุปผล**. Both stages use the same record ID, so results update the profile row instead of creating a second row. The sheet also records when consent was given. Deploy this script as a web app bound to the target spreadsheet.

1. Open the target [Google Sheet](https://docs.google.com/spreadsheets/d/10v-weiEiAkpQte9R1AoNs-YgYaf_FupvWMuRh3qRsb0/edit).
2. Select **Extensions → Apps Script** and replace the editor contents with `Code.gs`.
3. Save, then select **Deploy → Manage deployments**. Edit the existing web app deployment, select **New version**, and deploy it before publishing the updated website. This script remains compatible with the currently published app during the transition. If you create a new deployment instead, copy its new URL into `config.js`.
4. Set **Execute as** to your account and **Who has access** to **Anyone**, then authorize it.
5. Confirm `config.js` contains the deployed web app URL ending in `/exec`.
6. Publish the updated app on GitHub Pages.

The script writes a header row when the selected tab is empty. Profile saves create or update one row; result saves find that row by its record ID and update its test columns. It does not read or return sheet contents. Browsers cannot read the response from this public Apps Script endpoint, so after sending, the app reports that the save request was sent but cannot confirm the write.

## Privacy and access

Keep the spreadsheet private and share it only with authorized people. The web app deployment must accept unauthenticated submissions so visitors can submit results; anyone who obtains the deployment URL may attempt to add rows. Do not put credentials or access tokens in `config.js`. The app requests consent before sending contact details and test results.
