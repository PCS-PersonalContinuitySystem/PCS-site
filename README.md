# PCS website

*Room to think. Space to connect.*

The public website for **Personal Continuity System**, a Windows app for AI conversation, editable memory, notebooks and local plans. Application source and releases are in the [PCS repository](https://github.com/PCS-PersonalContinuitySystem/PCS).

This website presents **PCS 0.9.61**, including simpler public research during activities, a fuller app Map, Balanced OpenAI turn-taking by default and a Local stopped-reply notice that fades after six seconds. Download links use the published `v.0.9.61` release tag.

Retained app screenshots show fictional records captured in **PCS 0.9.61** and keep their original version labels.

[Website](https://pcs-personalcontinuitysystem.github.io/PCS-site/) · [Download PCS](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/tag/v.0.9.61) · [Discord](https://discord.com/invite/2ssCQhNgAN)

## Swappable cognition

Change the AI. Keep your continuity. Supported conversation, memory and preparation connections can change while saved records remain in the PCS vault. The setup guide explains switching and the sharing and compatibility choices to review. Different models can produce different answers and recall.

For Local AI, we recommend a compatible NVIDIA GPU with **16 GB of VRAM**. This is a recommendation, not a minimum or a guarantee for every model and configuration. Google and OpenAI cloud connections do not require this GPU. The Local AI guide explains the separate Radeon and Linux preview limits.

## Pages

| File | Contents |
| --- | --- |
| [index.html](index.html) | Features, interactive Map, memory examples, downloads and common questions. |
| [continuity-map.html](continuity-map.html) | Mara's fictional Map story, supporting records and an explicit resolution. |
| [memory-control.html](memory-control.html) | Saving, formation, correction, activity-memory approvals, reflection and recall. |
| [local-ai.html](local-ai.html) | Local models, recommended hardware, profiles, search, voice, vision and platform previews. |
| [getting-started.html](getting-started.html) | Setup, optional starting introduction, read-along, provider choices and updating. |
| [data-and-privacy.html](data-and-privacy.html) | Vault storage, provider sharing, public research, Materials, exports and session controls. |

## Map demonstration

Begin in **Focus**, close to the opening thread of Mara's fictional story. Choose **Connections** to reveal the full web of **60 themes** and **299 shared-record connections**, arranged in eight constellations and supported by **76 records**. Choose **Constellations** for a calmer overview, then open a group to explore its five to ten themes. Her unfinished idea connects practical skills, small teaching moments and what others have asked of her. Follow the supporting records to discover **A table for first tries**: a concrete beginning for welcoming repair sessions where people can learn by doing. The story has an answer and an outcome; the Map makes the scattered evidence available for inspection.

Select a theme or connection to read its evidence. In Connections, clicking a thread focuses both endpoint themes as stars, highlights their connections and dims unrelated parts of the map. Search, exploration history, zoom and List remain available beside the three main views. Counts come from explicit shared record tags; they are not confidence scores. The three primary views are specific to this website demonstration. PCS derives its own Map from saved wording and topic labels; its 0.9.59 app display supports up to 60 nodes and 300 connections with adaptive limits. In your own records, a connection can be a useful question to investigate, rather than proof of a motive or a prediction.

Move between **Focus**, **Constellations** and **Connections** as your question changes. Guided story threads take you to the relevant themes. Scroll over a theme graph to zoom around the pointer. Drag its background to pan. In **Focus**, click a surrounding theme to make it the new center and explore its connections. Your pan and zoom stay as set. Selecting a connection keeps the arrangement and viewport in place. Use **Clear selection**, Escape or a double-click on empty graph space to clear the highlights. Inspector text remains selectable for copying. Zoom buttons and keyboard shortcuts remain available.

On desktop, the Map uses the available window height, with records and lists scrolling inside their panels. Full screen gives the graph more room. Short windows retain scrolling access to the controls; phones place the records below the graph.

The Map uses the established slate-and-pastel palette. Colors distinguish authored theme groups and stay consistent across views; they do not indicate importance or confidence.

The records and app screenshots use fictional data. The website does not open a PCS vault, call an AI model or save changes. The interactive Map needs JavaScript; the sample records are also available as ordinary HTML on its page.

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
- `assets/pcs-memory-flow.svg` explains memory; `screenshots/` contains the retained app captures.

When changing sample records, update both `assets/map-data.js` and the HTML records in `continuity-map.html`. Keep the story's evidence and resolution consistent. Current release labels and links should match the app release; screenshot labels should describe the version actually captured. Check links, phone layouts and interactive controls after changes.

The separate authoring kit includes page fragments and Python generators. If using that kit, edit its source fragments and rebuild before copying the generated `site/` contents here; a rebuild replaces direct edits to generated HTML.

## Publish an update

Use the repository's configured GitHub Pages publishing process. Keep the HTML files, `assets/`, `screenshots/` and `.nojekyll` at the publishing root. Preserve existing deployment and custom-domain configuration. Upload the extracted files, not the ZIP itself.

For an app release update, publish the matching release first and verify the public Windows, source and checksum links. Then check the deployed website. Update canonical, social-preview and sitemap URLs if the site address changes.

## Feedback

[Website issues](https://github.com/PCS-PersonalContinuitySystem/PCS-site/issues) · [App bugs](https://github.com/PCS-PersonalContinuitySystem/PCS/issues) · [Discord](https://discord.com/invite/2ssCQhNgAN) · [Optional Ko-fi support](https://ko-fi.com/pcssupport)
