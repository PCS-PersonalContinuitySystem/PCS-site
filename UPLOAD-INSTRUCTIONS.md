# Upload the PCS 0.9.33 website — revision 3

This ZIP is a complete ready-to-serve static site. It is not an application installer and it does not contain personal PCS data.

1. Extract `PCS-Website-0.9.33-r3-Upload.zip`.
2. Open `PCS-PersonalContinuitySystem/PCS-site` on GitHub and use **Add file → Upload files** at the repository root.
3. Upload the extracted files and folders, replacing same-named files. `index.html` must sit at the root beside the four guide pages, `README.md`, `.nojekyll`, `assets/`, `brand/` and `screenshots/`. Keep folder structure intact. Ensure the hidden `.nojekyll` file is included.
4. Commit the upload to the branch your existing Pages setup publishes. Preserve the existing workflow and custom-domain settings. This package does not require replacing them.
5. Wait for GitHub Pages to finish its deployment. Open the site, refresh, and check the plain feature descriptions, the interactive Map and its everyday topics, thoughts and projects, theme selection and zoom/reset, the two matching preview images, the four guides and the mobile menu. Download links should say **0.9.33** and point to the named Windows/source/checksum release assets.

Do not upload only the ZIP: GitHub Pages will not extract it. Do not nest the extracted site under a new folder. The ZIP has no extra enclosing directory, and all required runtime assets are included. Older unused repository assets can remain; this refresh does not need a cleanup commit.

The site is intended for the existing project URL:
https://pcs-personalcontinuitysystem.github.io/PCS-site/

For another domain or path, update canonical, Open Graph, JSON-LD and sitemap URLs. All internal navigation and local assets use relative links.

No npm or build tool is needed. HTML is the editable source. See README.md for maintenance and SCREENSHOTS.md for image provenance. The upload bundle was prepared locally; publishing occurs when you commit/upload it to your Pages source.
