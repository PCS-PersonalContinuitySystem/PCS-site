# Updating the PCS website

The active website is the static HTML and assets at the root of this repository. It is hosted by GitHub Pages at:

https://pcs-personalcontinuitysystem.github.io/PCS-site/

## Review and publish a repository change

1. Review the proposed branch or pull request, including the homepage preview and changed copy.
2. Preview the root as a static website. Check links, screenshots, small-screen navigation and the Map demo.
3. Merge the approved changes into `main`, using the repository’s existing GitHub Pages setup.
4. Wait for GitHub Pages to finish its deployment before checking the public URL.

A branch or pull request does not change the live site by itself. Do not change the Pages source or hosting settings for this copy update.

## Local preview

From the repository root, run:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/`. Stop the server with Ctrl+C. No build or package installation is required.

The homepage uses `assets/site.css`, `assets/plain-english.css` and `assets/site.js`. The Map demo also needs `assets/map.css`, `assets/map-data.js` and `assets/map.js`. Preserve the `screenshots` and other referenced asset paths.

## Future updates

- Update the Windows, Source ZIP and checksum links together when the application release changes.
- Keep screenshot version labels and their provenance. A copy change does not turn an older screenshot into a new application capture.
- Preserve existing public section IDs so incoming links continue to work.
- Keep the homepage focused on what PCS does, why someone would use it and what setup requires. Put detailed release changes in release notes or the relevant guide.
- Regenerate the social card from `assets/social-preview-plain.svg` when its wording changes.
- Refresh `PUBLICATION-MANIFEST.json` and record only checks actually performed in `WEBSITE-CHECKS.json`.

The historical ZIP/TAR files in this repository are not substitutes for the current files on `main`. This website update does not modify PCS application builds, downloads or user data.
