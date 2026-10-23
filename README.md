# PCS website

**A new AI shouldn’t mean starting over.**

PCS is a free Windows app that keeps saved AI conversations, memories and notes together. Users can talk or type with a supported model, then use those saved records again when they change models.

[Website](https://pcs-personalcontinuitysystem.github.io/PCS-site/) · [Download PCS 0.9.121](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/tag/v0.9.121) · [Application repository](https://github.com/PCS-PersonalContinuitySystem/PCS) · [Discord](https://discord.com/invite/2ssCQhNgAN)

This repository contains the public GitHub Pages website. The current Windows application version is **0.9.121**. This website package refreshes release links, connection and platform guidance, the Map demo and its screenshot. It does not modify the application.

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

## Star Atlas design

The site uses the application's own palette: dark slate (`#101920`, `#17262f`), sage (`#bfd29f`), a darker green (`#405f4c`) and the cream four-point star from the PCS wordmark. The star is the one recurring shape: large and cropped on each page's opening screen, and at text size as list bullets and the current-section marker. The homepage includes an interactive illustration where visitors switch between Gemini, GPT, Llama, Claude, ChatGPT and Local while the saved records stay put. The guides retain their layout and are set on a light chart-paper reading sheet with a contents rail and a guides rail. The type is Albert Sans, served from the repository. The design system is recorded in [DESIGN.md](DESIGN.md).

## Screenshots and examples

The homepage Map screenshot is a fresh PCS 0.9.121 capture. The memory and Map-demo guides retain their labeled 0.9.120 Map capture. Other application screenshots retain their 0.9.114 capture labels. All are genuine captures of the shipped interface with authored fictional data. They do not show live AI results. The homepage has six refreshed full-viewport examples, including source inspection, displayed without cropping. Earlier screenshot files remain unchanged for the guides and existing links. See [SCREENSHOTS.md](SCREENSHOTS.md) and [SCREENSHOT-MANIFEST.json](SCREENSHOT-MANIFEST.json) for provenance.

The Map demo uses fictional data, makes no model requests and does not read a personal vault. Its eight-passage story, free exploration and no-JavaScript reading path remain available, alongside Constellations, Focus, comparison routes and a navigation trail. Demo progress and notes last only for the current visit. The homepage memory correction is a labeled illustration.

## Accurate product claims

PCS is free and open source; cloud API charges are separate. Google, OpenAI, Meta and Claude API routes require their own API access. ChatGPT sign-in is a separate connection for eligible accounts, subject to access and usage limits. Claude and ChatGPT support personal-memory learning and recall with the existing sharing controls. Local models, runtimes and optional speech packs download separately, and need compatible hardware. Windows x64 is the current 0.9.121 package. Earlier Linux x64 0.9.115 and macOS Apple silicon 0.9.114 experimental builds remain linked with their actual versions and limits.

Saved conversations, memories and notebooks are encrypted locally. Cloud features send permitted content to the selected provider. Original Materials files and readable exports are outside vault encryption. Saved records remain available when models change; this does not transfer a provider’s internal state or guarantee complete recall.

## Maintain and preview

This is a buildless static site. GitHub Pages serves the repository root. There are no external font, analytics or AI dependencies for browsing it.

- Shared Star Atlas styles and behaviour for every page: `assets/atlas.css` and `assets/atlas.js`, with the self-hosted Albert Sans font in `assets/fonts/` (SIL Open Font License, copy beside the font), the transparent wordmark `assets/pcs-wordmark-clear.webp`, and current homepage images in `screenshots/refresh-0114/` (earlier crops remain in `screenshots/crops/`). The design system is recorded in [DESIGN.md](DESIGN.md); product facts the site must keep are in [PRODUCT.md](PRODUCT.md).
- Guide pages and the Map demo: `assets/atlas.css`, then `assets/atlas-guides.css`, with the same `assets/atlas.js`. The previous `assets/site.css`, `assets/site.js` and `assets/plain-english.css` are no longer loaded by any page.
- Map behavior and data: `assets/map.js`, `assets/map.css`, `assets/map-data.js`.
- Current social card: `assets/social-preview-plain.svg` and its rendered PNG.

Serve a local checkout with `python -m http.server 8000 --bind 127.0.0.1`, then open `http://127.0.0.1:8000/`. Stop with Ctrl+C. See [UPLOAD-INSTRUCTIONS.md](UPLOAD-INSTRUCTIONS.md) for publishing.

`PUBLICATION-MANIFEST.json` records the current site file identities. `WEBSITE-CHECKS.json` records the checks performed for the website revision, including their limits. Neither is proof of live application or device reliability. Older root ZIP/TAR files and stylesheets are historical artifacts, not the current deployment source.
