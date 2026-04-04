# Google Apps Script Form Endpoint

This template is the backend companion for the volunteer and endorsement forms in `index.html`.

## Recommended setup

1. Create one Google Spreadsheet for volunteer submissions.
2. Create one Google Spreadsheet for endorsement submissions.
3. In each spreadsheet, create a sheet named `Submissions`.
4. Copy `endpoint-template.gs` into two separate Apps Script projects.
5. Update `CONFIG.workflowType`, `CONFIG.allowedTypes`, `CONFIG.requiredFields`, and `CONFIG.notifyEmail` for each deployment.
6. Deploy each project as a web app with access set to `Anyone`.
7. Paste the volunteer and endorsement web app URLs into the `siteConfig` object in `index.html`.

## Suggested sheet headers

Use this header row in both spreadsheets:

`submitted_at,type,name,email,volunteer_areas,endorsement_mode,secondary_label,secondary_value,message,review_status,source_page,locale,honeypot_status`

Volunteer rows will leave endorsement-specific columns blank.
Endorsement rows should default to `review_status = pending`.

## Frontend payload contract

Volunteer submissions send:

`type`, `name`, `email`, `volunteer_areas`, `message`, `source_page`, `locale`, `honeypot`, `submitted_at`

Endorsement submissions send:

`type`, `endorsement_mode`, `name`, `secondary_label`, `secondary_value`, `email`, `message`, `review_status`, `source_page`, `locale`, `honeypot`, `submitted_at`

## Notes

- The frontend sends `text/plain` with a JSON string body to avoid unnecessary CORS preflight behavior.
- Honeypot submissions are rejected and not written to the sheet.
- Keep endorsement spreadsheets private and use them as a review queue only.