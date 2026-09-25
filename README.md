# PCS website

The public product website and guides for **PCS — Personal Continuity System**, a Windows AI companion with memory you can inspect and revise.

**[Visit the website][website]** · [Main PCS repository][app] · [Application releases][releases] · [Support PCS][support]

This repository contains the **website**, not the Windows application. Application downloads, matching source packages, release notes, and application bug reports belong in [PCS-PersonalContinuitySystem/PCS][app].

## Current website content

The current website refresh targets **PCS 0.9.10 — pre-release**. It introduces conversation, revisable memory, **Map and Library**, the **Documents / Notebooks / Reference notes** Materials workspace, and the local Calendar.

The first Conversation feature panel now shows an actual PCS interface capture instead of the fictional Talk / Keep / Plan illustration. Materials, Calendar, and Map previews have also been updated. Some captures still come from earlier application versions; a website update does not make every picture a new-version capture. Example records are synthetic, not private user data or a demonstration of live-model accuracy.

PCS is free. Cloud routes use the user's own API configuration and may incur provider charges. The supported Local route requires compatible hardware and separate model/runtime downloads. The website itself does not run the desktop application or require an AI API key.

## Site files

| File or folder | Purpose |
| --- | --- |
| `index.html` | Homepage, feature previews, route comparison, downloads, and FAQ. |
| `getting-started.html` | Setup guide. |
| `memory-control.html` | Saved continuity, inspection, corrections, and related controls. |
| `data-and-privacy.html` | Local storage, sharing, and data boundaries. |
| `continuity-map.html` | Map guide and interpretation limits. |
| `assets/` and `website-refresh.css` | Referenced site resources and the current layout overrides. |
| `screenshots/`, `SCREENSHOTS.md` and `brand/` | App captures, their actual capture versions, and brand artwork. |
| `sitemap.xml` and `.nojekyll` | Sitemap and static-site publishing support. |

`README.md` documents this repository. Editing it does not update the public homepage; homepage changes belong in `index.html` and its referenced resources.

## Publishing

Keep the existing GitHub Pages configuration: **Deploy from a branch → main → / (root)**.

1. Upload the website files and folders to the repository root, with **`index.html` at the root**. Do not upload only the ZIP or nest the site inside an extra enclosing folder.
2. Commit related HTML, styles, and image changes together. Preserve `.nojekyll` and any assets still referenced by a page.
3. Wait for the Pages deployment to complete, then check the [public website][website] on desktop and a narrow screen. Test downloads, guide navigation, FAQ disclosures, and every **Open image** link.

The checked-in site is ready-to-serve HTML and assets; publishing this export does not require installing the PCS application or running an npm build. Deployment archives such as `artifact.tar` are not needed to serve the pages.

## Download links

The application release is **[v0.9.10][release]**, with these exact assets:

- **[PCS-0.9.10-Windows-x64.zip][windows]** — the complete Windows application.
- [PCS-0.9.10-Source.zip][source] — matching editable source.
- [PCS-0.9.10-SHA256SUMS.txt][checksums] — download checksums.

For a future update, publish and verify the application release assets first. Then update the download buttons, source/checksum links, release-note links, visible version labels, and `SoftwareApplication` metadata across the website and this README. Do not point visitors to an unpublished release or treat a download URL change as proof that the rest of the page is current.

## Maintenance notes

**The refreshed homepage uses static HTML.** It no longer loads the earlier React rendering module. This package omits the unused earlier React bundles. `assets/site-controls-0910-r2.js` only enhances mobile navigation and image previews; it does not replace page content. Without JavaScript, navigation, direct full-image links, FAQ and hardware disclosures remain available. Preserve styles that the pages still reference.

When replacing a screenshot, update its image source, **Open image** destination, dimensions, alt text, and caption together. Use actual app captures, label synthetic examples, and retain accurate capture-version information. Do not expose private conversations, API keys, vault passphrases, or token-bearing launch URLs. Check search/social metadata as well as visible page text.

Keep the website's descriptions aligned with the released application. Local vault storage does not mean cloud conversations stay offline, and encrypted vault backups do not include original Materials files. Detailed application backup and restore instructions are included in the application download at `docs/RESTORE_VAULT.md`.

## Feedback and support

Report website problems in [this repository's Issues][site-issues]. Report application problems in [PCS Issues][app-issues], including the version and steps to reproduce, without posting private data.

[Ko-fi contributions][support] are optional, one-time support. PCS does not require a subscription or lock features behind payment; AI-provider charges are separate.

[website]: https://pcs-personalcontinuitysystem.github.io/PCS-site/
[app]: https://github.com/PCS-PersonalContinuitySystem/PCS
[releases]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases
[release]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases/tag/v0.9.10
[windows]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.10/PCS-0.9.10-Windows-x64.zip
[source]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.10/PCS-0.9.10-Source.zip
[checksums]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.10/PCS-0.9.10-SHA256SUMS.txt
[site-issues]: https://github.com/PCS-PersonalContinuitySystem/PCS-site/issues
[app-issues]: https://github.com/PCS-PersonalContinuitySystem/PCS/issues
[support]: https://ko-fi.com/pcssupport

## Website correction revision 2

This website-only correction aligns 0.9.10 release metadata and links, fixes full-image destinations and dimensions, restores Local hardware details, includes the current README, and updates pause/restore guidance. The supplied images are existing actual-UI captures from 0.9.8, 0.9.9 and 0.9.10, explicitly labeled; no version number was painted over inside an image. It does not change the PCS application ZIP.
