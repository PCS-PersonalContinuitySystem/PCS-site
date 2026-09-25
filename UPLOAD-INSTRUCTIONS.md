# Upload the corrected PCS website

**Website-only update for PCS 0.9.10. This does not replace or change the Windows application.**

1. Extract **PCS-site-0.9.10-Corrected-Update.zip**.
2. Open the extracted **PCS-site** folder. Upload **its contents** to the root of **PCS-PersonalContinuitySystem/PCS-site** using **Add file → Upload files**. Replace matching files and keep the folder structure. Do not upload the ZIP itself, nest PCS-site inside the repository, or use the main PCS application repository.
3. Commit the HTML, styles, controls, screenshots and README together. Preserve the existing `.nojekyll` file and Pages settings (**main → / (root)**). Nothing in this package changes repository settings.
4. Wait for the Pages deployment to complete, then reload the live website. Check the homepage download button, image previews, guide links, FAQ and Local hardware disclosure. On a narrow window, test Menu and Escape.

`index.html`, `README.md`, `website-refresh.css`, `assets/` and `screenshots/` should be at the repository root after upload. The README in this folder is for the **website repository**, not the application repository.

## What this corrects

- Search metadata and application download/source/checksum/release links agree on **0.9.10**.
- Every full-image link matches the picture it displays, with correct dimensions, alt text and an honest capture-version caption.
- The fictional Talk / Keep / Plan panel remains removed.
- Local hardware information and mobile navigation are functional, with useful no-JavaScript fallbacks.
- Guide text distinguishes a pending never-sent OpenAI answer from a failed or cancelled request; update guidance includes built-in backup/restore and the separate Materials copy.
- The current website README and screenshot inventory are included.

## Optional cleanup of earlier upload leftovers

This package excludes `artifact.tar` and these unused old renderers:

```text
assets/site-13805acce83d.js
assets/site-5ac2421fa76b.js
assets/site-9fb1750e41e8.js
```

Uploading replacements does **not** delete old repository files. The files above may be removed after checking that no custom page references them. They are not loaded by any page in this package, so leaving them in the repository does not prevent these fixes from working. Do not remove the CSS, images, branding or `.nojekyll` that the site still uses.

The supplied image captures span PCS 0.9.8, 0.9.9 and 0.9.10 and are explicitly labeled. They were not relabeled as newly captured 0.9.10 screens; see `SCREENSHOTS.md`.

## Publishing references

- [Upload files to a GitHub repository](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

No commit, deployment or repository-file deletion has been performed by this update package.
