# Get Butter: website prototype

Static prototype for Get Butter, hospitality recruitment (Cotswolds-born, UK-wide). Plain HTML, CSS and JavaScript with no build step, hosted free on GitHub Pages.

## Pages
- `index.html`: launch page with "I'm hiring" (venues) and "I want work" (talent) sign-up forms
- `thanks.html`: confirmation after any form
- `privacy.html`: UK GDPR privacy policy (placeholders, have it reviewed)
- `jobs.html`: jobs board preview with search and filters (sample data)
- `job.html?id=…`: job detail with an apply form and CV upload

## Connecting the CRM
Every form goes through `submitLead(type, data)` in `assets/leads.js`. It currently logs to the browser console. Replace its body with the CRM call (API, webhook or Zapier) and the whole site is connected. Types: `venue`, `talent`, `application`.

Jobs come from `assets/jobs-data.js` (sample only). Later they'll come from the CRM's job feed.

## Placeholders to replace
- `[hello@yourdomain.co.uk]`, Instagram links
- Privacy policy: company name, number, date, retention period
- Sample job pay, venues and descriptions

## Hosting on GitHub Pages
Settings → Pages → Deploy from branch → `main` / root.
