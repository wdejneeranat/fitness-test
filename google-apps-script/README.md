# Google Sheets setup

The web app sends profile and test data only after the user checks the consent box and submits the results. Deploy this script as a web app bound to the target spreadsheet.

1. Open the target [Google Sheet](https://docs.google.com/spreadsheets/d/10v-weiEiAkpQte9R1AoNs-YgYaf_FupvWMuRh3qRsb0/edit).
2. Select **Extensions → Apps Script** and replace the editor contents with `Code.gs`.
3. Save, then select **Deploy → New deployment → Web app**.
4. Set **Execute as** to your account and **Who has access** to **Anyone**, then deploy and authorize it.
5. Copy the web app URL ending in `/exec`. In `config.js`, set `googleSheetsUrl` to that URL.
6. Publish the updated `config.js` together with the app on GitHub Pages.

The script writes a header row when the selected tab is empty, then appends one row for each valid submission. It does not read or return sheet contents. Browsers cannot read the response from this public Apps Script endpoint, so after sending, the app asks users to check the sheet rather than claiming the write succeeded.

## Privacy and access

Keep the spreadsheet private and share it only with authorized people. The web app deployment must accept unauthenticated submissions so visitors can submit results; anyone who obtains the deployment URL may attempt to add rows. Do not put credentials or access tokens in `config.js`. The app requests consent before sending contact details and test results.
