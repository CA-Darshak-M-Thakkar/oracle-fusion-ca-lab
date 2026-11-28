# Vercel access gate (batch codes)

- `gate/` - public pages only: sign-in, one-time registration form, tutor admin page. No lab screens.
- `api/` - Vercel functions. `api/lab.js` serves the lab bundle (`private/lab`, built by `npm run build:vercel`) only to a signed-in admin or approved student. The bundle is never in the public output.
- `access/OracleLabAccess.gs` - Apps Script bound to the private "Oracle Lab Access" sheet (Students, Codes, Login Log). Called only by the Vercel server with a shared secret.
- `npm run test:gate` - end-to-end tests (Google keys and the Apps Script runtime are mocked; everything else is real).

Vercel env vars: GOOGLE_CLIENT_ID, ADMIN_EMAILS, SESSION_SECRET, APPS_SCRIPT_URL, APPS_SCRIPT_SECRET, SHEET_URL.
Batch codes and student data live only in the Google Sheet, never in this repo.
The GitHub Pages build (`npm run build`) is unchanged.
