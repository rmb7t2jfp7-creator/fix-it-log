# Fix-It Log

[Try it in your browser](https://rmb7t2jfp7-creator.github.io/fix-it-log/) · [Test results](https://github.com/rmb7t2jfp7-creator/fix-it-log/actions)

A small, private repair journal for the things worth keeping. Record the problem, track repair attempts and spending, and remember what worked.

## Run it

Download the repository and open `index.html` in a modern browser. All scripts, styles, and data stay local; no install, account, API key, tracking, or external assets are required. For a stable local origin, optionally run `python3 -m http.server 8000` in this folder and visit `http://localhost:8000`. Keep using the same browser and address to access the same journal. Static hosting also works.

## What is built

- Add, edit, delete, search, and filter items with open, in-progress, repaired, or retired status.
- Record, edit, and delete dated repair attempts, notes, and costs.
- Show item counts, items marked repaired, and total logged spending across the whole journal.
- Store the journal in browser local storage, with visible storage/import failures.
- Export and import validated, versioned JSON backups. Import replaces the journal only after confirmation; invalid imports leave it unchanged. Unreadable stored data can be exported for recovery.
- Explore a clearly fictional demo in memory, separate from your saved journal.

Change the currency label before recording costs. A label change does **not** perform currency conversion; use one currency consistently. Notes can be up to 1,000 characters; line breaks are stored as spaces. Limits: 500 items, 100 attempts per item, costs from 0 to 1,000,000 with at most two decimals, and 2 MB imports. Dates must be valid calendar dates; attempts cannot predate the first logged date. Photos are intentionally not supported, keeping backups small and reliable.

## A simple workflow

1. Add one item and describe its problem.
2. Record a repair attempt, its date, and out-of-pocket cost (zero is valid).
3. Change the status when you have a result. “Repaired” is your own assessment.
4. Export a backup regularly, especially before clearing browser data.

## Honest limits and privacy

This is a repair record, not a repair guide or safety assessment. It measures entered spending, not money saved, products displaced, lifespan extension, waste prevented, or avoided emissions. No environmental impact or adoption has been measured for this project.

Browser storage can be cleared, disabled, or full. It is tied to the browser profile and site/origin; opening a downloaded file and using a local server can create separate stores. The app does not synchronize devices or concurrent tabs; use one tab at a time to avoid overwriting changes. Exports contain your notes; treat them as private. There are no photos, remote uploads, telemetry, or network requests beyond loading the app's static files. Avoid recording secrets. A corrupt saved journal is protected from routine overwriting until you explicitly clear or import. New changes are rejected if the formatted backup would exceed 2 MB.

## Development and verification

No runtime or development packages are required. With Node.js 18 or newer, run `npm test` or `node --test core.test.js`. Pure data validation and arithmetic live in `core.js`, shared by the browser and tests. The tests cover dates, money, exact cents, malformed imports, duplicated records, schema limits, and untrusted strings. Rendering uses text nodes, not imported HTML. Tests are not evidence of field use or independent review.

Initial implementation and documentation were developed with AI assistance. This repository does not claim prior human review, real users, community adoption, or verified environmental results. Planned possibilities, not implemented features: optional images and richer repair categories. Contributions that improve accessibility, validation, or usability are welcome through issues or pull requests; do not include personal journals in them.

## License

MIT — see `LICENSE`.
