# Upload the PCS 0.9.114 website update

Prepared for `PCS-PersonalContinuitySystem/PCS-site`, from public commit `cd2eb15726f79f482325e2f1e856a26fb3ae0fa3`. This task has not published the website.

## Apply the Update ZIP

1. Keep the current Git commit or a backup of your website.
2. Extract `PCS-Website-0.9.114-Update.zip` locally.
3. Upload the **extracted files and folders to the existing repository root**, keeping `assets/` and `screenshots/` intact. Replace matching files. Do not upload the ZIP itself or add an enclosing folder.
4. Preserve `.nojekyll`, any `CNAME`, `.github` configuration and unrelated files. No deletion of old screenshots, archives or historical assets is required.
5. Review the changed paths before committing. If the repository has changed since the baseline above, compare overlapping files before replacing newer work.
6. After GitHub Pages finishes deploying, reload the site and check the downloads, navigation, new screenshots, diagrams and Map interactions.

`CHANGED-FILES.json` lists changed/new paths and hashes. The Full-Site ZIP contains the active pages, assets and documentation for a clean preview. It is not a substitute for unrelated repository/deployment files.

## Check after upload

- Current Windows, Source and checksum links target **v0.9.114**.
- Current app pictures say **PCS 0.9.114**, fictional demonstration data and no live AI response.
- Memory has four stages, including Links & lessons; its guide explains exact revisions and sharing.
- Both SVG diagrams open; desktop and narrow-screen layouts remain readable.
- Map Connections opens and collapses counted bundles; selecting a connection opens its evidence.
- Discover a connection, temporary landmarks, Start story, all eight Keep & continue passages, Explore freely and Resume story work.
- Refreshing the page resets demonstration changes. The website does not create a real PCS vault or save visitor memory.

## Local preview

Extract `PCS-Website-0.9.114-Full-Site.zip` into a fresh folder. With Python installed, run `python -m http.server 8000 --bind 127.0.0.1` there, then open `http://127.0.0.1:8000/`. Stop with Ctrl+C.

`SHA256SUMS.txt` verifies the website ZIPs. The delivery report and audit receipts bind checks to the packaged bytes. The evidence is local website preparation, not successful public deployment or general acceptance of the PCS application, providers or hardware.
