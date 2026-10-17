# Upload the PCS 0.9.102 website update

This packet is prepared for `PCS-PersonalContinuitySystem/PCS-site`, using repository commit `5118cfe528a6afec5980241a1efd3a7302226a7b` as its baseline. It has not been published by this task.

## Use the Update ZIP

1. Keep a copy of the current website or retain its Git commit before updating.
2. Extract `PCS-Website-0.9.102-Update.zip` locally.
3. Upload the **extracted contents to the existing repository root**, preserving the `assets/` and `screenshots/` subfolders. Replace the matching files. Do not upload the ZIP itself or put its contents inside a new enclosing folder.
4. Preserve `.nojekyll`, any `CNAME`, `.github` deployment configuration and unrelated files. This update requires no deletion of historical assets, archives or screenshots.
5. Review the changed paths before committing. If the repository has changed since the baseline above, compare overlapping files rather than replacing newer work blindly.
6. After GitHub Pages finishes, reload the site and check the download, guide links, screenshot previews and Map story. A fresh page load may be needed for cached content.

The Update ZIP contains only changed and new files. `CHANGED-FILES.json` identifies the paths and their baseline/current hashes. The Full-Site ZIP contains the active static pages, supporting assets and site documentation for a clean local preview; it is not a replacement for unrelated repository or deployment files.

## What to check after upload

- Download links lead to published **v0.9.102** Windows, Source and SHA256SUMS assets.
- The new app pictures are labeled **PCS 0.9.102 · fictional demonstration data**. No live AI conversation is claimed for them.
- The two SVG diagrams open and remain readable. The Local diagram distinguishes image delivery from screen capture.
- On desktop and a narrow screen, navigation, image dialogs, FAQ disclosures and memory/provider tabs remain usable.
- The existing Map story still uses Start story and Keep & continue, with all eight passages, free exploration and the ending. Its 60-theme fictional website demo is separate from the app screenshots.

## Local preview

Extract `PCS-Website-0.9.102-Full-Site.zip` into a new folder. With Python installed, run `python -m http.server 8000 --bind 127.0.0.1` there and open `http://127.0.0.1:8000/`. Stop the server with Ctrl+C.

`SHA256SUMS.txt` in the delivery folder checks the two website ZIPs. `DELIVERY-REPORT.json` and `INDEPENDENT-AUDIT.json` record the prepared packet's checks and exact identities. These are local preparation receipts; they do not establish a successful public deployment or live PCS model/device behavior.
