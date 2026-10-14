# Upload the PCS 0.9.87 website update

The website update is prepared against PCS-site main commit `30356b97fd809b3f2a4ad2f0709fe78a9b004c97`. The matching public application release is `v0.9.87`; its published Windows and Source asset digests and checksum file were checked against the qualified packages on October 14, 2026.

1. Extract **PCS-Website-0.9.87-Update.zip**. It contains only changed and new website files.
2. Upload those extracted files and folders to the root of `PCS-PersonalContinuitySystem/PCS-site`, replacing matching paths. Keep the `assets/` and `screenshots/` paths intact. Do not place the update inside another folder.
3. Preserve existing deployment workflows, `.nojekyll`, custom-domain settings and unrelated files. Older unused images and archives do not need to be deleted.
4. Review the changes against the site's current branch before committing, especially if that branch changed after the baseline above. Use the repository's existing Pages publishing process.
5. After deployment, check all six pages, the desktop and narrow-screen navigation, screenshot previews, setup tabs and Map controls. Confirm the Windows, Source and checksum links open the **v0.9.87** assets.

**PCS-Website-0.9.87-Full-Site.zip** is also provided for a clean local preview. It contains all active site files and no nested release archives or obsolete assets. Extract it and run `python -m http.server 8000 --bind 127.0.0.1`, then open `http://127.0.0.1:8000/`. Stop with Ctrl+C. The full-site ZIP can also be overlaid at the publishing root; it is not an instruction to erase other repository files.

GitHub Pages does not extract ZIP files. Upload their contents. Both ZIPs use root-relative package paths with no enclosing folder. `PUBLICATION-MANIFEST.json` binds the active full-site files. The delivery report lists the exact additions and modifications and the website validation scope. Include `screenshots/pcs-map-0987.png` when uploading the changed pages; it is the new Map picture. Retained 0.9.78 images keep their original version labels.

The site remains configured for https://pcs-personalcontinuitysystem.github.io/PCS-site/. Its canonical URLs, social metadata and sitemap retain that address. It uses no application backend or build step. This delivery prepares files; committing/uploading them to the Pages branch performs publication.
