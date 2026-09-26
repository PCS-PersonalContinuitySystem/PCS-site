# Apply the real-screenshot website update

This package updates **PCS-PersonalContinuitySystem/PCS-site**, not the PCS application repository or the installed application.

## Upload at the repository root

Extract the ZIP and upload its contents without an extra enclosing folder. Replace these files:

- `index.html`
- `getting-started.html`
- `memory-control.html`
- `data-and-privacy.html`
- `continuity-map.html`
- `README.md`
- `SCREENSHOTS.md`
- `UPLOAD-INSTRUCTIONS.md`

Add `website-screenshots-0913.css`, `SCREENSHOT-MANIFEST.json`, and the **12 PNGs inside `screenshots/`**, retaining that folder name. `WEBSITE-CHECKS.json` records the static checks and may also be committed. Upload the related changes together so pages do not point to missing images.

**Keep the existing `assets/`, `brand/`, `website-refresh.css`, `.nojekyll`, sitemap and other still-referenced files.** This is a replacement-file package, not a standalone checkout or complete website backup. Uploading only the ZIP will not update GitHub Pages. Do not restore an older `artifact.tar` over it.

## What changes

Continuity Map becomes feature 01 with a full-width real screenshot. Conversation, revisable memory, Materials and Calendar follow it. New screenshots replace the old images in the homepage, setup guide, memory guide, privacy guide and map guide. Full-image links, social-image metadata and captions point to the corresponding new pictures. The lengthy screenshot disclaimer is removed in favor of `PCS 0.9.13 · Sample data` captions.

Application download, Source ZIP, checksum and release-note links remain pinned to **v0.9.13**. The application and release archives are not modified. The update does not incorporate any of the generated concept designs into the app.

## Check after publishing

Keep the repository's working GitHub Pages publishing configuration. After deployment, hard-refresh the public website and check:

1. The map appears first in the feature list and opens at full size.
2. Images load on all five pages, including the timeline and saved-source examples.
3. Mobile navigation, FAQ disclosures, image-preview Close/Escape behavior and download links still work.

The new images use versioned filenames to avoid an old screenshot being reused from cache. Preview the package within a full checkout so its existing styles and brand resources are available. No npm build or application installation is required to publish the static website.

No GitHub files were changed by the preparation of this ZIP.
