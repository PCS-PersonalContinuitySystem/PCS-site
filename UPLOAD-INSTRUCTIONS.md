# Upload the PCS 0.9.154 website update

Prepared November 12, 2026 against `PCS-PersonalContinuitySystem/PCS-site` main commit `94d06f924b049b19d4d21ee7c43db2803cb9066a`. This package does not commit, push or publish anything.

**Revision 3 supersedes the earlier packages.** The PCS Perspective diagram and its readable phone layout now appear only in the memory guide. The homepage diagram section has been removed. Use this revision on its own; it includes the prior website updates and is cumulative from the same baseline. If you already applied revision 2, overwrite its files with this update.

1. Extract **PCS-Website-0.9.154-r3-Update.zip** into an ordinary folder.
2. Copy its **contents** into the root of your existing website checkout, replacing matching files. Keep the `assets/` and `screenshots/` paths. Do not add an enclosing directory to the repository.
3. Review the diff. If main has moved beyond the baseline above, merge those changes first. No deletions are required; preserve unrelated files, workflows, domain settings, `.nojekyll` and historical assets.
4. Preview the six pages and their mobile menu. Check the OpenRouter illustration and download selector, setup connection instructions, screenshot enlargement, Map story and filters. Current Windows, application source, checksums and release notes must all use **v0.9.154**. Linux and Mac experiments deliberately keep their older versions.
5. Commit and push when ready. Confirm your existing GitHub Pages deployment completes, then check the live pages. Local checks do not establish successful deployment.

The Update ZIP contains changed/new files relative to the baseline. **PCS-Website-0.9.154-r3-Full-Site.zip** provides a complete static preview, including existing image URLs, font and its license. It excludes `.git` and two obsolete root distribution artifacts (`PCS-Website-0.9.33-r3-Upload.zip` and `artifact.tar`); it does not instruct you to delete those from the repository. Use the Update ZIP for merging into an existing checkout.

For a standalone preview, extract the Full-Site ZIP into an empty folder and serve that folder with a static HTTP server. Open its localhost URL. This is a buildless site; no dependency installation is needed. In the PCS development workspace, start preview/verification jobs through its managed wrappers. Stop your preview server afterward.

`PUBLICATION-MANIFEST.json` records the complete preview's file hashes, excluding itself and `SHA256SUMS.txt` to avoid cycles. `SHA256SUMS.txt` includes the manifest. `WEBSITE-CHECKS.json` records the current revision's verification and limits. The outer package audit and ZIP checksums describe the delivery files.

Screenshots remain older genuine app captures with authored fictional records and their original version labels. No new 0.9.154 screenshot or live AI result is claimed. The interactive website demo does not read a vault, send a model request or save into PCS. Website verification does not qualify every model, device, installer or memory interpretation.
