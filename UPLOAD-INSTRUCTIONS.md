# Upload the PCS 0.9.121 website update

Prepared October 23, 2026 against `PCS-PersonalContinuitySystem/PCS-site` main commit `fcdf99c814a7bcfd771cbda7cf4ac359502120e7`. No commit, push or deployment was performed.

1. Extract `PCS-Website-0.9.121-Update.zip`.
2. Copy its **contents** into the root of your existing website checkout, replacing matching files. Keep the `assets/` and `screenshots/` paths. Do not create an enclosing website directory in the repository.
3. Review the diff and preview the website. Confirm the new Windows links use the release tag `v0.9.121` (no dot after `v`). The earlier Linux and Mac downloads deliberately retain their older versions.
4. Commit and push when ready. Preserve unrelated files, workflows, domain settings, `.nojekyll` and historical assets. No deletions are required.

This package includes the fresh 0.9.121 homepage Map screenshot and supersedes the earlier website packages and includes its website, picture and interactive Map updates. Use this package on its own. The Update ZIP contains only new or changed website files relative to the repository baseline. The Full-Site ZIP is a complete preview of the active website and its referenced assets; it is not an instruction to replace or delete the rest of your repository. If main has changed since the baseline above, merge those edits before committing.

For local review, extract the Full-Site ZIP into an empty folder, serve that folder with `python -m http.server 8000 --bind 127.0.0.1`, and open `http://127.0.0.1:8000/`. Stop the server with Ctrl+C. The static files also open directly, but a local server most closely matches GitHub Pages.

Review the homepage's Claude and ChatGPT options, the updated Map screenshot and enlargement, current setup and privacy guides, and the Map demo's Constellations, Focus, comparison routes, navigation trail, story and free exploration. Demo notes and progress last for the current visit only.

Screenshots show actual app interfaces with fictional data. The homepage Map image is a fresh 0.9.121 capture; guide Map images retain their 0.9.120 labels, and other screenshots retain their original capture versions. The website demo does not access a vault, send a model request or save into PCS. Website checks are not live app, provider, device or deployment acceptance.
