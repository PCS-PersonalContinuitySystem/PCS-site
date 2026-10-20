# PCS website

**Your personal thinking space. Room to think. Space to connect.**

This repository contains the public website for Personal Continuity System. PCS brings AI conversation, revisable memory, reading, notebooks and planning into a locally owned workspace. **Change the AI. Keep your continuity.**

[Visit the website](https://pcs-personalcontinuitysystem.github.io/PCS-site/) · [Download PCS 0.9.114](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/tag/v0.9.114) · [Application repository](https://github.com/PCS-PersonalContinuitySystem/PCS) · [Discord](https://discord.com/invite/2ssCQhNgAN)

The site describes **PCS 0.9.114**. Current downloads point to the published Windows, Source and checksum assets. The guides cover linked memory revisions, settled marks, named lessons, optional saved-area hints, whole-archive Map indexing, larger Local contexts, longer microphone turns, resumable Prepared Notes and updated setup and compatibility requirements.

The interactive Map reflects current connection bundling, discovery and landmark workflows using a small fictional archive. The existing eight-passage story, free exploration and no-JavaScript reading path remain available. It is an explanatory website demo; it makes no model requests, reads no personal vault and does not save visitor edits.

Current application pictures are genuine captures of the shipped 0.9.114 interface with authored fictional data. They show controls and saved records, not live AI results. SVG diagrams explain the current memory and Local-context workflows. See [SCREENSHOTS.md](SCREENSHOTS.md) and [SCREENSHOT-MANIFEST.json](SCREENSHOT-MANIFEST.json) for provenance. Historical images retain their original versions and paths.

| Page | What it explains |
| --- | --- |
| [Home](index.html) | PCS, the Map demo, memory workflow, Local AI, screenshots and downloads. |
| [Continuity Map](continuity-map.html) | Fictional interactive exploration and the complete story with supporting records. |
| [Memory](memory-control.html) | Originals, corrections, links, settled memories, lessons and permitted recall. |
| [Local AI](local-ai.html) | Models, context, voice, Vision and hardware/setup choices. |
| [Get started](getting-started.html) | Quick Setup, connections, Materials and upgrades. |
| [Data and privacy](data-and-privacy.html) | Local storage, sharing, backups, deletion and reader compatibility. |

PCS is free and open source. Cloud API usage is separate; models, runtimes and optional speech packs download separately. Windows x64 is the main application package. Local CUDA needs compatible NVIDIA hardware; Custom GGUF, Radeon Vulkan text and the Ubuntu source preview have experimental limits. Models differ in quality and supported features. Optional online services send permitted inputs outside your computer.

## Upload and preview

See [UPLOAD-INSTRUCTIONS.md](UPLOAD-INSTRUCTIONS.md). Apply the Update ZIP's extracted contents at the existing repository root and preserve unrelated files. The Full-Site ZIP contains the active site and supporting/provenance assets for a clean preview; it does not replace deployment configuration or historical repository files.

This is a buildless static site. Serve a local copy with `python -m http.server 8000 --bind 127.0.0.1`, then open `http://127.0.0.1:8000/`. Stop with Ctrl+C. There are no external font, analytics or application API dependencies for browsing the demo.

`PUBLICATION-MANIFEST.json` records packaged file identities; `WEBSITE-CHECKS.json` records local preparation checks. These are not a deployment receipt or evidence of live model/device reliability. Application validation and limits are described in its release and repair records.
