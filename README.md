# PCS website

**Room to think. Space to connect.**

The public website and guides for **PCS — Personal Continuity System**, a Windows AI companion for conversation, learning, reading and everyday plans, with continuity the user can inspect and revise.

**[Visit the website][website]** · [Download PCS 0.9.13][windows] · [Getting started][getting-started] · [Application repository][app] · [Support PCS][support]

> This repository contains the **website**, not the Windows application. Application releases, matching source packages and application bug reports belong in **[PCS-PersonalContinuitySystem/PCS][app]**. Opening this website does not start PCS or connect to a user's vault.

## Release information

The homepage and Getting started guide target **[PCS 0.9.13 — pre-release][release]**. The main additions covered are more patient OpenAI turn-taking, a calm and self-assured default companion direction, and reusable public web sources in Materials.

| Application download | Purpose |
| --- | --- |
| **[PCS-0.9.13-Windows-x64.zip][windows]** | Complete Windows application package. |
| [PCS-0.9.13-Source.zip][source] | Matching development source, tests and documentation. Not a ready-to-run Windows package. |
| [PCS-0.9.13-SHA256SUMS.txt][checksums] | Checksums for the two named application ZIPs. |

Use these named release assets, not GitHub's automatic **Source code (zip)** archive. Cloning **this** repository downloads the website, not PCS.

PCS is free, with no PCS subscription or locked features. Cloud routes use the user's own API configuration and may incur provider charges. The supported Local route needs compatible hardware and separate model/runtime downloads. The website itself does not require an API key.

### Important application upgrade boundary

**Saving the first web source makes that vault require PCS 0.9.13 or newer, even after the source is deleted.** Opening an older vault without saving a web source does not add that requirement. Keep a pre-feature backup for rollback.

Saved web snapshots and their bookmarks are encrypted vault records and are included in vault backups. **Original local Materials files are separate, unencrypted files and need their own backup copy.** Read the [Getting started update instructions][updating] and the application's bundled `docs/RESTORE_VAULT.md` before transferring data. This website update does not change the application, vault or release ZIPs.

## Repository layout

| Path | Purpose |
| --- | --- |
| [`index.html`](index.html) | Homepage, feature previews, route comparison, download links, release metadata and FAQ. |
| [`getting-started.html`](getting-started.html) | Setup, route selection, safe shutdown, update and restore guidance. |
| [`memory-control.html`](memory-control.html) | Saved continuity, inspection, corrections and related controls. |
| [`data-and-privacy.html`](data-and-privacy.html) | Local storage, sharing and data boundaries. |
| [`continuity-map.html`](continuity-map.html) | Map guide and interpretation limits. |
| `assets/` | Existing styles, brand resources and progressive-enhancement JavaScript. |
| [`website-refresh.css`](website-refresh.css) | Shared layout, accessibility and image-preview overrides. |
| `screenshots/` and [`SCREENSHOTS.md`](SCREENSHOTS.md) | Interface captures and their actual capture-version information. |
| `brand/` | Existing brand artwork. |
| [`sitemap.xml`](sitemap.xml) and `.nojekyll` | Page discovery and static-site publishing support. |

**Editing `README.md` does not update the public homepage.** Edit `index.html` for homepage changes.

This 0.9.13 update changes `index.html`, `getting-started.html` and this README. The other guides retain their existing version labels and are not being represented as newly reviewed 0.9.13 documentation. The application's bundled Help and release notes are the source for exact current controls.

## Apply the website update

Replace **`index.html`**, **`README.md`** and **`getting-started.html`** at the root of **PCS-site**. Keep the existing `assets/`, `screenshots/`, `brand/`, `website-refresh.css`, `.nojekyll`, sitemap and other pages.

The replacement-file ZIP is **not a complete website backup**. Extract its three files before uploading; do not upload only the ZIP or place its contents inside an additional folder. Do not replace the separate application repository's README with this one.

The pages reuse existing resource paths, so no new image assets, CSS files or JavaScript files are needed for this update.

## Preview locally

Use a full checkout or download of this repository, then apply the replacement files. Open `index.html` directly, or serve the repository root with Python:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

On Windows, `py -m http.server 8000 --bind 127.0.0.1` is an alternative when the Python launcher is installed. Visit `http://127.0.0.1:8000/` and stop the preview server with **Ctrl+C** when finished.

Python is optional for website preview. It is not a dependency of the published site, and this command does not start the PCS application. Opening only a replacement HTML file outside the repository will not find its styles or pictures.

## Publish with GitHub Pages

The checked-in pages are ready-to-serve HTML and assets. No npm install, React build, desktop application or API key is needed to publish them.

For branch-based publishing, use **Settings → Pages → Deploy from a branch → main → / (root)**. Keep an existing working Pages workflow instead when the repository uses a custom deployment. See [GitHub's publishing-source instructions][pages-docs].

Commit the related files together, wait for the Pages deployment to finish, and inspect the [public website][website]. Keep `index.html` at the root and preserve `.nojekyll`. Do not change the publishing source merely to update a download link.

The existing `artifact.tar` and legacy generated JavaScript bundles are not used by these replacement pages. Do not restore an older archive over current files or reintroduce an old rendering bundle without reviewing its contents.

## Keep releases aligned

For the next application release, publish and verify the named application assets first. Then update all of the following together:

1. **Links:** Windows ZIP, matching Source ZIP, checksums and release notes in `index.html`, `getting-started.html` and this README. Check other guides for old release links too.
2. **Current-version text:** download buttons, version badges, stage/footer labels and release descriptions. Review any changed features and compatibility warnings; do not merely replace the version number.
3. **Structured metadata:** the `SoftwareApplication` JSON-LD in `index.html`, including `softwareVersion` and `downloadUrl`. Review social descriptions and canonical URLs separately.
4. **Images:** change a screenshot's path, full-image link, dimensions, alt text and caption together only when the capture itself changes. Never relabel an old picture as the new release.

Versioned application URLs are deliberately static. Downloads remain usable without JavaScript and do not depend on a visitor-side GitHub API call.

### Keep capture claims accurate

The homepage reuses actual interface captures from **0.9.8, 0.9.9 and 0.9.10**, with synthetic example records. Captions and social-image alt text retain those versions. These are not 0.9.13 screenshots, private user records, or proof of live model accuracy.

The new web-source feature captures **one accessible HTTPS HTML, TXT or Markdown page**, within the documented limits—not a whole website, interactive quiz, remote PDF or guaranteed answer key. Keep this qualification when editing the feature description. Do not claim that semantic turn detection removes every interruption or provider cooldown.

## Accessibility and maintenance

The homepage keeps its existing layout, section anchors, artwork and resource paths. It loads `assets/site-controls-0910-r2.js` for mobile navigation and image previews; that filename is a resource identifier, **not the current application version**. The script does not replace the page's HTML or download links. Existing legacy rendering bundles are not referenced by this homepage.

Native FAQ and hardware disclosures, ordinary navigation and direct full-image links remain available without JavaScript. Preserve the skip link, heading hierarchy, image descriptions, visible keyboard focus and mobile navigation controls.

Before publishing, check desktop and narrow-screen layouts, keyboard navigation, menu open/close, FAQ disclosures and image previews. Confirm that each visible download and source/checksum link opens the intended release. Retest after Pages deploys; checking repository paths alone is not a live-site browser test.

Never commit API keys, vaults, private conversations, personal documents, passphrases or token-bearing launch addresses. Keep product claims aligned with the [released application][release]: local vault storage does not mean cloud requests stay offline, and readable exports are not encrypted.

## Feedback and support

Use **[PCS-site Issues][site-issues]** for broken website links, layout problems and documentation corrections. Use **[PCS Issues][app-issues]** for application bugs, with the version, route and steps to reproduce, after removing private information.

**PCS is free and does not require payment.** Optional [one-time Ko-fi contributions][support] support development. There is no PCS subscription and no feature paywall. AI-provider charges are separate.

[website]: https://pcs-personalcontinuitysystem.github.io/PCS-site/
[getting-started]: https://pcs-personalcontinuitysystem.github.io/PCS-site/getting-started.html
[updating]: https://pcs-personalcontinuitysystem.github.io/PCS-site/getting-started.html#updating
[app]: https://github.com/PCS-PersonalContinuitySystem/PCS
[release]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases/tag/v0.9.13
[windows]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.13/PCS-0.9.13-Windows-x64.zip
[source]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.13/PCS-0.9.13-Source.zip
[checksums]: https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.13/PCS-0.9.13-SHA256SUMS.txt
[site-issues]: https://github.com/PCS-PersonalContinuitySystem/PCS-site/issues
[app-issues]: https://github.com/PCS-PersonalContinuitySystem/PCS/issues
[support]: https://ko-fi.com/pcssupport
[pages-docs]: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
