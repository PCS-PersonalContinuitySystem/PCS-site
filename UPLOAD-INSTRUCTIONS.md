# Upload the PCS 0.9.180 website update

Prepared November 18, 2026 against main commit 7e7eeff802c24ff9490cc70ba1b51cffa5d0782c, before the v0.9.180 release was published.

1. Publish the PCS 0.9.180 release on GitHub under the tag `v0.9.180` first. Until it exists, every current download, Source, checksum and release-note link on the site returns 404.
2. Back up or commit your existing PCS-site checkout.
3. Extract PCS-Website-0.9.180-Update.zip and merge its contents into the repository root, preserving assets/ and overwriting matching files. Upload extracted files, not the ZIP.
4. Review the diff. If main changed after the baseline above, merge those changes before publishing.
5. Preview the six pages. Check Windows, Source, checksum and release-note links, the download selector, setup tabs, screenshot viewer, mobile menu and Map demo. On the memory guide, check the new memory diagram on a wide screen and its text version on a phone.
6. Commit to the branch GitHub Pages serves (currently main, repository root), then check its Pages deployment and live links.

PCS-Website-0.9.180-Full-Site.zip contains all static files for local preview or restoration. It excludes .git and obsolete root distribution artifacts PCS-Website-0.9.33-r3-Upload.zip and artifact.tar; no repository deletion is required.

The package updates links and version labels, the memory guide (how memories are made and checked, the experimental memory settings, the Claude memory model), the Local AI, setup and privacy guides, three new 0180 diagrams and the maintenance records. Older diagram files are kept for existing links. Screenshot versions, fictional demo records and archived Linux/macOS links keep their actual older versions. No screenshot was changed.

PUBLICATION-MANIFEST.json and SHA256SUMS.txt identify files. WEBSITE-CHECKS.json records checks actually performed for this package and their limits. Creating files does not publish them; website checks do not qualify the app or a fresh install.

## Map demo update, revision 2 (after the 0.9.180 update)

PCS-Website-0.9.180-Map-Demo-Update.zip (revision 2) runs the real PCS 0.9.180 Map interface on invented records. It holds 42 files: `continuity-map.html`, the records listed below, `assets/map-demo-0180.css` and the folder `assets/map-0180/` with `app/` (16 files), `data/` (12 files) and five files of its own. The older demo files (`assets/map.js`, `map.css`, `map-data.js`) stay in place, unused.

### Upload through the GitHub web page

GitHub's "Add files via upload" takes at most 100 files per upload and keeps folders only when you drag a folder itself. This package needs one upload:

1. Extract the ZIP on your computer. You get `continuity-map.html`, seven Markdown/JSON/TXT record files and an `assets` folder.
2. Open the repository's top level (`github.com/PCS-PersonalContinuitySystem/PCS-site`, branch `main`), then choose **Add file → Upload files**. The path shown above the drop area must be the repository name only, with no folder after it.
3. Select everything you extracted, including the `assets` folder, and drag it all into the drop area at once. Do not open `assets` and drag the files inside it: the `app` and `data` folders must arrive as folders. GitHub then lists paths such as `assets/map-0180/data/manifest.json`.
4. Before committing, check that the list shows 42 files and that files from `data` appear as `assets/map-0180/data/…`, not `assets/map-0180/…`. Commit to `main`.

If you upload `data` on its own instead, open `assets/map-0180/` in the repository first, choose **Upload files**, and drag the `data` folder itself; the path box must show `PCS-site / assets / map-0180 /` before you drop.

### Check the live site (about 30 seconds, after the Pages deployment finishes)

Each of these must show content, not a 404 page:

1. https://pcs-personalcontinuitysystem.github.io/PCS-site/assets/map-0180/data/manifest.json (JSON text)
2. https://pcs-personalcontinuitysystem.github.io/PCS-site/assets/map-0180/data/table-core.json (JSON text)
3. https://pcs-personalcontinuitysystem.github.io/PCS-site/assets/map-0180/map-demo-frame-r2.html (the Map on its own)
4. https://pcs-personalcontinuitysystem.github.io/PCS-site/continuity-map.html (the Map should show stars and labels within a few seconds)

If the Map says "The demo could not load its records…", one of the first three addresses is missing; upload that folder again as described above.

### Tidy up after the first (revision 1) upload

Revision 1 kept its data in 125 files. Where they landed directly in `assets/map-0180/` instead of `assets/map-0180/data/`, they can be deleted: every `set-*.json` file, `table-core.json`, `table-rest.json` and `manifest.json` sitting directly in `assets/map-0180/`. Revision 1's `demo-shim.js`, `demo-frame.css` and `map-demo-frame.html` in that folder are no longer used either. Do not delete anything inside `assets/map-0180/app/` or `assets/map-0180/data/`. Leaving the old files is harmless; they are only untidy. The exact revision 1 file names are listed in the delivery's STATUS.md.
