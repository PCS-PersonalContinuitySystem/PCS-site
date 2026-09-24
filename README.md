# PCS website

The static product website for **PCS — Personal Continuity System**. This repository
hosts the website, not the Windows application. The application downloads are release
assets in `PCS-PersonalContinuitySystem/PCS`.

## Current content

The 0.9.6 documentation update covers Map v2, memory revision writers, saved outcomes,
Local/cloud choices, audio/rate pauses, and the reorganized offline guides. Current
Map and writer pictures are labeled synthetic examples rendered in the actual UI.
Unchanged older screenshots retain their **0.9.0** captions. The fictional story
illustration is not the PCS interface or live AI output.

## Publishing and download consistency

Keep the existing Pages configuration: **Deploy from a branch → main → / (root)**.
Do not deploy a versioned download link before its release exists. For this update,
publish tag **v0.9.6** in the application repository with these exact assets first:

- `PCS-0.9.6-Windows-x64.zip`
- `PCS-0.9.6-Source.zip`
- `PCS-0.9.6-SHA256SUMS.txt`

Verify the uploaded files against the supplied checksums. Then commit all files from
the matching website update together, including its new assets and guide page.
Leave earlier releases, brand assets, `.nojekyll` and Pages settings intact.

## Maintenance

`index.html` contains the crawlable initial HTML. Its module in `assets/` renders
the corresponding React interface; changing only the HTML can be undone on hydration.
The download URL, version and copy must agree in both. The current FAQ uses native
HTML disclosures and is available without JavaScript. Setup, memory, privacy and
Map guides are ordinary static HTML pages. Styles, images and scripts are separate
files; this is no longer the old all-in-one HTML export.

Use the matching maintenance update and its checks rather than blindly replacing
this file with an older single-file React preview. Keep current source and build
evidence with the release-maintenance archive. Check desktop/mobile rendering,
image labels, links, hydration and script-disabled guides before publishing.

Support links remain `https://ko-fi.com/pcssupport`. Contact remains unconfigured.
No analytics service, API key, server-side runtime or AI request is needed by the site.
