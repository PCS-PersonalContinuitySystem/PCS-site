# PCS website

The public product website for **PCS — Personal Continuity System**.

This repository contains the ready-to-host static website. `index.html` includes the page, styles, scripts, artwork, and example screenshots. It needs no server-side runtime, API keys, or database. `.nojekyll` tells GitHub Pages to serve the static files directly.

## Publishing

In repository **Settings → Pages**, select **Deploy from a branch**, then **main** and **/ (root)**. Saving a new version of `index.html` to `main` publishes an update.

## Updating the design

The editable React/TypeScript website project is retained separately. In that project, run:

```sh
pnpm install --frozen-lockfile
pnpm export:preview
```

Copy the generated `review/PCS-website-preview.html` into this repository as `index.html`, review the page, and commit the update.

The website shows PCS 0.9.0 with labeled example data. The fictional illustration is labeled separately. Application download and contact links will appear only after their destinations are configured in the editable project and the page is regenerated.

This repository hosts the website; it does not distribute the PCS Windows application.
