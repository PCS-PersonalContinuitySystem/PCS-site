# PCS website

**Your personal thinking space. Room to think. Space to connect.**

This repository contains the public website for **Personal Continuity System**. PCS brings AI conversation, revisable memory, reading, notebooks and planning into a locally owned workspace. **Change the AI. Keep your continuity.**

[Visit the website](https://pcs-personalcontinuitysystem.github.io/PCS-site/) · [Download PCS 0.9.88](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/tag/v0.9.88) · [Application repository](https://github.com/PCS-PersonalContinuitySystem/PCS) · [Discord](https://discord.com/invite/2ssCQhNgAN)

The site describes **PCS 0.9.88**. Leave a stopping point, add a next step, pin a thought and review it on your return. A context strip keeps that chosen thought within reach across the workspace. The Windows, Source and checksum links use the published **v0.9.88** release; their sizes and digests were checked against the qualified application delivery. Saving pin/next-step metadata or editing an existing kept note requires PCS 0.9.88 or newer to reopen that vault. Opening or browsing alone does not add this requirement.

PCS is free and open source. Cloud API usage is separate; models, AI runtimes and optional speech packs are separate downloads. Windows x64 is the main application package. Local CUDA needs compatible NVIDIA hardware; Custom GGUF, Radeon Vulkan text and the Ubuntu browser/cloud source route have experimental limits. Models differ in quality and supported tools. Optional Brave, Local + Jev and separately reviewed cloud preparation send their approved inputs outside the computer.

| Page | What it explains |
| --- | --- |
| [index.html](index.html) | PCS features, the interactive Map, conversation controls, current screenshots, downloads and common questions. |
| [continuity-map.html](continuity-map.html) | Mara's fictional Map story, supporting records, exploration controls and the distinction from the application's Map. |
| [memory-control.html](memory-control.html) | Saved passages, memory formation, corrections, recall, Keep, quotations and saved-work search. |
| [local-ai.html](local-ai.html) | Local models, hardware, profiles, search, voice, vision, optional online tools and platform previews. |
| [getting-started.html](getting-started.html) | First launch, provider setup, reading and practice, conversation pace, switching connections and updating. |
| [data-and-privacy.html](data-and-privacy.html) | Vault storage, sharing, Local/cloud boundaries, drafts, backups, passphrase changes and reader compatibility. |

**About the Map demonstration.** The website tells an original fictional story through **60 themes, 299 connections, eight constellations and 76 records**. Start the story for a guided route through three threads and eight passages. Read and keep each passage, follow the next-step action, then piece together the ending. Counts show exactly what remains. Opening a passage does not count as keeping it; skipping to the ending does not complete the story. Keep is only page-local demonstration progress: leaving or reloading resets it.

Explore freely at any time, then resume the story on the same page. Focus, Constellations, Connections, Map/List, search, Back/Forward, pan, zoom and keyboard controls remain available. Selecting a connection focuses both endpoint themes and their connected evidence without rearranging the graph. The ending explains how themes and lines relate to records. The same story passages and ending are also ordinary HTML without JavaScript.

The demonstration uses fixed authored records and explicit theme membership. It does not open a vault, call an AI model, accept uploads or save changes. Counts describe shared records, not confidence, importance, personality or cause. The PCS application derives its own Map from saved wording and labels; its bounded overview supports up to **120 themes and 900 connections**, considering up to 600 matching memories and 128 notebooks. Filters and available records affect the result. The demonstration's smaller counts are intentional.

**Images and diagrams.** The retained **PCS 0.9.87** Map picture shows an Astronomy–Photography connection and its saved evidence in a fictional 16-record workspace. It is an unmodified capture of the shipped interface, with no live provider or device input. Other retained pictures remain honestly labeled **0.9.78**: one Conversation image shows actual Local Huihui output from a fictional creative-writing trial; the others use generated records or fixture responses. The website memory diagram is an authored explanation. See [SCREENSHOTS.md](SCREENSHOTS.md) and `SCREENSHOT-MANIFEST.json` for exact dimensions, hashes and provenance. Historical assets are not relabeled as newer captures.

**Preview locally.** This is an editable static HTML, CSS and JavaScript site with no build step or npm dependencies. With Python 3 installed, run from this folder:

```console
python -m http.server 8000 --bind 127.0.0.1
```

Visit [localhost:8000](http://localhost:8000/). Stop the server with Ctrl+C. This previews the public website, not the PCS application.

**Maintain the site.** The six HTML pages own their content, navigation and metadata. `assets/site.css` and `assets/site.js` provide shared presentation, mobile menus, tabs and image previews. `assets/map.js`, `assets/map.css` and `assets/map-data.js` implement the Map demonstration. Keep the JavaScript records and their HTML equivalents in `continuity-map.html` consistent if editing the story. Application guides and source live in the matching release ZIP, not this repository.

When updating a release, verify the published tag and all three assets. Change current release labels and links together, but preserve historical reader requirements and accurately dated screenshot captions. Check all page links, fragment targets, structured metadata, image dialogs, tabs, Map interactions and narrow-screen layouts. `WEBSITE-CHECKS.json` records the website checks for this delivery; it does not certify application models, microphones, graphics hardware or long sessions.

**Upload an update.** Follow [UPLOAD-INSTRUCTIONS.md](UPLOAD-INSTRUCTIONS.md). The update ZIP contains only changed and new files; overlay those paths at the existing Pages root. The full-site ZIP provides a clean preview with all active runtime files. Upload extracted contents, not the ZIP itself. Preserve deployment workflows and custom-domain configuration. `PUBLICATION-MANIFEST.json` identifies the active files included in the full site; older unrelated assets can remain.

[Website issues](https://github.com/PCS-PersonalContinuitySystem/PCS-site/issues) · [Application bugs](https://github.com/PCS-PersonalContinuitySystem/PCS/issues) · [Optional Ko-fi support](https://ko-fi.com/pcssupport)

Review reports before sharing and remove personal information. First-party application code is GPL-3.0-only; see the [application license and notices](https://github.com/PCS-PersonalContinuitySystem/PCS). Optional components retain their own terms.
