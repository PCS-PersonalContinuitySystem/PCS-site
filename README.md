# PCS website

**A new AI shouldn’t mean starting over.**

PCS is a free Windows app that keeps saved AI conversations, memories and notes together. Users can talk or type with a supported model, then use those saved records again when they change models.

[Website](https://pcs-personalcontinuitysystem.github.io/PCS-site/) · [Download PCS 0.9.114](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/tag/v0.9.114) · [Application repository](https://github.com/PCS-PersonalContinuitySystem/PCS) · [Discord](https://discord.com/invite/2ssCQhNgAN)

This repository contains the public GitHub Pages website. The application version remains **0.9.114**; this update changes the website presentation, not the application.

## Website content

| Page | Purpose |
| --- | --- |
| [Home](index.html) | Explain PCS, show the actual interface, describe practical uses, and link to requirements and downloads. |
| [Map demo](continuity-map.html) | Explore a fictional set of related memories and read the supporting records. |
| [How memory works](memory-control.html) | Explain saved passages, AI-written memories, corrections, history and recall. |
| [Local AI](local-ai.html) | Explain supported models, hardware, voice, screen input and setup limits. |
| [Get started](getting-started.html) | Install, choose a connection, set saving and sharing permissions, and update safely. |
| [Data and privacy](data-and-privacy.html) | Explain what is stored locally, what can be shared, and how backup and deletion work. |

The homepage leads with the application and the reason to keep saved information across models. It uses plain language, short examples and real app screenshots. Detailed controls and experimental features belong in the guides. The interactive Map story remains on its dedicated page.

## Palette revision 2

The website now uses the application’s slate (`#101920`, `#17262f`) and sage (`#bfd29f`) colors. Light surfaces remain neutral, with a darker green (`#405f4c`) for readable headings and links. Buttons, selected tabs, guide panels, focus indicators and social preview artwork use the revised palette. This revision retains the page wording, layout, screenshots and interactions.

## Screenshots and examples

The 0.9.114 application screenshots are genuine captures of the shipped interface with authored fictional data. They do not show live AI results. Existing screenshot files are unchanged. See [SCREENSHOTS.md](SCREENSHOTS.md) and [SCREENSHOT-MANIFEST.json](SCREENSHOT-MANIFEST.json) for provenance.

The Map demo uses fictional data, makes no model requests and does not read a personal vault. Its eight-passage story, free exploration and no-JavaScript reading path remain available. The homepage memory correction is a labeled illustration.

## Accurate product claims

PCS is free and open source; cloud API charges are separate. Google, OpenAI and Meta require their own API access. Local models, runtimes and optional speech packs download separately, and need compatible hardware. Windows x64 is the main package; experimental platform and model limits are documented in the guides.

Saved conversations, memories and notebooks are encrypted locally. Cloud features send permitted content to the selected provider. Original Materials files and readable exports are outside vault encryption. Saved records remain available when models change; this does not transfer a provider’s internal state or guarantee complete recall.

## Maintain and preview

This is a buildless static site. GitHub Pages serves the repository root. There are no external font, analytics or AI dependencies for browsing it.

- Shared layout and behavior: `assets/site.css` and `assets/site.js`.
- Current visual refresh: `assets/plain-english.css`, loaded last on all six pages.
- Map behavior and data: `assets/map.js`, `assets/map.css`, `assets/map-data.js`.
- Current social card: `assets/social-preview-plain.svg` and its rendered PNG.

Serve a local checkout with `python -m http.server 8000 --bind 127.0.0.1`, then open `http://127.0.0.1:8000/`. Stop with Ctrl+C. See [UPLOAD-INSTRUCTIONS.md](UPLOAD-INSTRUCTIONS.md) for publishing.

`PUBLICATION-MANIFEST.json` records the current site file identities. `WEBSITE-CHECKS.json` records the checks performed for the website revision, including their limits. Neither is proof of live application or device reliability. Older root ZIP/TAR files and stylesheets are historical artifacts, not the current deployment source.
