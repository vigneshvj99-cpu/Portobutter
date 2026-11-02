# Get Butter: website prototype

Static prototype for Get Butter, hospitality recruitment (Cotswolds-born, UK-wide). Plain HTML, CSS and JavaScript with no build step, hosted free on GitHub Pages.

## Pages
- `index.html`: launch page with "I'm hiring" (venues) and "I want work" (talent) sign-up forms
- `thanks.html`: confirmation after any form
- `privacy.html`: UK GDPR privacy policy (placeholders, have it reviewed)

## Connecting the CRM
Every form goes through `submitLead(type, data)` in `assets/leads.js`. Set `FORMSPREE_ID` there to receive sign-ups by email. Later, replace it with the JobAdder connection. Jobs will be added as the JobAdder widget.

## Placeholders to replace
- Privacy policy: company name, number, date, retention period

## Hosting on GitHub Pages
Settings → Pages → Deploy from branch → `main` / root.
