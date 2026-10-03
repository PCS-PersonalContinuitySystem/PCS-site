# PCS website

*Room to think. Space to connect.*

The public website for **Personal Continuity System**, a Windows app for AI conversation, editable memory, notebooks and local plans. The application source and releases are in the [PCS repository](https://github.com/PCS-PersonalContinuitySystem/PCS).

[Website](https://pcs-personalcontinuitysystem.github.io/PCS-site/) · [Download PCS](https://github.com/PCS-PersonalContinuitySystem/PCS/releases) · [Discord](https://discord.com/invite/2ssCQhNgAN)

## Pages

| File | Contents |
| --- | --- |
| [index.html](index.html) | Features, interactive Map, memory examples, downloads and common questions. |
| [continuity-map.html](continuity-map.html) | Map demonstration, supporting records, original passages and owner corrections. |
| [memory-control.html](memory-control.html) | Saving, memory formation, inspection, correction, recall and backups. |
| [local-ai.html](local-ai.html) | Local models, Custom GGUF profiles, NVIDIA requirements, CPU meaning search, voice and optional vision. |
| [getting-started.html](getting-started.html) | Four-step setup, provider-specific instructions, optional features and updating. |
| [data-and-privacy.html](data-and-privacy.html) | Vault storage, provider sharing, Materials, exports and session controls. |

## Map demonstration

The sample follows six weeks of Mara’s work, family and home projects. Its 24 themes connect through 36 authored records, including original passages, four owner corrections and six connection notes.

Select a theme or connection to read its evidence. The demo includes five layouts, source filters, search, comparison, hiding, exploration history, zoom and a list view. Counts come from explicit shared record tags; they are not confidence scores. PCS derives its own Map from saved wording and topic labels.

The records and application screenshots use fictional data. The website does not open a PCS vault, call an AI model or save changes. The interactive Map needs JavaScript; all 36 sample records are also available as ordinary HTML on its page.

## Preview locally

This is a static HTML, CSS and JavaScript site. Serving it requires no build step, npm packages or application backend.

With Python 3 installed, run this from the repository root:

```console
python -m http.server 8000 --bind 127.0.0.1
```

Open [localhost:8000](http://localhost:8000/). Stop the server with **Ctrl+C**.

## Edit the site

- The six HTML files contain page content, navigation and metadata.
- `assets/site.css` and `assets/site.js` provide the shared appearance, menu, tabs and image previews.
- `assets/map.js`, `assets/map.css` and `assets/map-data.js` provide the Map demonstration.
- `assets/pcs-memory-flow.svg` explains memory; `screenshots/` contains the app captures.

When changing sample records, update both `assets/map-data.js` and the HTML records in `continuity-map.html`. Keep version labels, download links, descriptions and screenshots consistent. Check links, phone layouts and interactive controls after changes.

The separate authoring kit includes page fragments and Python generators. If using that kit, edit its source fragments and rebuild before copying the generated `site/` contents here; a rebuild replaces direct edits to generated HTML.

## Publish an update

Use the repository’s configured GitHub Pages publishing process. Keep the HTML files, `assets/`, `screenshots/` and `.nojekyll` at the publishing root. Preserve existing deployment and custom-domain configuration. Upload the extracted files, not the ZIP itself.

For an app release update, publish the matching release first and verify the public Windows, source and checksum links. Then check the deployed website. Update canonical, social-preview and sitemap URLs if the site address changes.

## Feedback

[Website issues](https://github.com/PCS-PersonalContinuitySystem/PCS-site/issues) · [App bugs](https://github.com/PCS-PersonalContinuitySystem/PCS/issues) · [Discord](https://discord.com/invite/2ssCQhNgAN) · [Optional Ko-fi support](https://ko-fi.com/pcssupport)
