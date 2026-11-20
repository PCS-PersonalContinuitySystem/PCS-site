# Upload the PCS 0.9.181 website update

Prepared November 19, 2026 against main commit 4fcc7935ee5cd252f8ca70fadd87e2906e0276b3, after the v0.9.181 release was published. Every 0.9.181 Windows, Source, checksum and release-note link was checked and resolves.

This update changes 13 files, all at the repository root. No folder changes and nothing needs deleting.

- Pages: `index.html`, `getting-started.html`, `local-ai.html`, `data-and-privacy.html`, `memory-control.html`, `continuity-map.html`
- Records: `README.md`, `PRODUCT.md`, `sitemap.xml`, `UPLOAD-INSTRUCTIONS.md`, `WEBSITE-CHECKS.json`, `PUBLICATION-MANIFEST.json`, `SHA256SUMS.txt`

## Upload through the GitHub web page

1. Open the repository's top level (`github.com/PCS-PersonalContinuitySystem/PCS-site`, branch `main`) and choose **Add file → Upload files**. The path above the drop area must show the repository name only, with no folder after it.
2. Drag all 13 files from the `PCS-Website-0.9.181-Update` folder into the drop area at once. Upload the files, not the ZIP.
3. Check that the list shows 13 files, then commit to `main`.

If `main` changed after the commit above, look at what changed before uploading so a newer edit is not overwritten.

## Check the live site (after the Pages deployment finishes)

1. https://pcs-personalcontinuitysystem.github.io/PCS-site/ : **Download for Windows** downloads `PCS-0.9.181-Windows-x64.zip`, and the download notes begin "PCS 0.9.181 for Windows x64".
2. https://pcs-personalcontinuitysystem.github.io/PCS-site/getting-started.html : the title says 0.9.181 and **Download PCS 0.9.181 for Windows** works.
3. https://pcs-personalcontinuitysystem.github.io/PCS-site/continuity-map.html : the Map demo still loads (it is unchanged and keeps its 0.9.180 label, because it runs 0.9.180's Map code).

## What changed

All six pages use the 0.9.181 links, structured metadata and bug-report version. The home page's download notes describe 0.9.181. The memory guide adds two sentences (only-what-changed memory updates on Claude, ChatGPT and OpenRouter; **Still in mind** in the In mind right now list), the Local AI guide adds one (background work stops when you speak or type), the setup guide adds a line for people coming from 0.9.180, and the privacy guide's reader-requirement range reaches 0.9.181. The Map demo, diagrams, screenshots and archived Linux/macOS links keep their actual versions.

`WEBSITE-CHECKS.json` keeps its 0.9.180 record and adds the checks made for this update under `update_0181`. `PUBLICATION-MANIFEST.json` and `SHA256SUMS.txt` are refreshed for the changed files. Creating these files does not publish them, and website checks do not qualify the app.

## Optional tidy-up left from the Map demo upload

Revision 1 of the Map demo left unused files directly in `assets/map-0180/`: every `set-*.json`, `table-core.json` and `table-rest.json` sitting directly in that folder, plus `demo-shim.js`, `demo-frame.css` and `map-demo-frame.html`. They are still there and can be deleted. Do not delete anything inside `assets/map-0180/app/` or `assets/map-0180/data/`. Leaving them is harmless.
