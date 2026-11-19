# PCS website

**A new AI shouldn’t mean starting over.**

PCS is a free Windows app that keeps saved AI conversations, memories and notes together. Talk or type with a supported model, then use your saved records again when you change models.

[Website](https://pcs-personalcontinuitysystem.github.io/PCS-site/) · [Download PCS 0.9.180](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.180/PCS-0.9.180-Windows-x64.zip) · [Release notes](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/tag/v0.9.180) · [Application repository](https://github.com/PCS-PersonalContinuitySystem/PCS) · [Discord](https://discord.com/invite/2ssCQhNgAN)

This repository contains the public GitHub Pages website. The current Windows application version is **0.9.180**. This file package was prepared on November 18, 2026 against website commit `7e7eeff802c24ff9490cc70ba1b51cffa5d0782c` for the 0.9.180 release, before that release was published. Creating the package does not publish it.

## Pages

| Page | Purpose |
| --- | --- |
| [Home](index.html) | Introduce PCS, show its interface, and link to requirements and downloads. |
| [Map demo](continuity-map.html) | Explore fictional related memories and their supporting passages. |
| [Memory](memory-control.html) | Inspect sources, corrections, history, recall and PCS Perspective. |
| [Local AI](local-ai.html) | Review model, hardware, voice and setup limits. |
| [Get started](getting-started.html) | Install, connect an AI, choose permissions and upgrade safely. |
| [Data and privacy](data-and-privacy.html) | Understand storage, sharing, backup and deletion. |

## Updated for 0.9.180

All six public pages use the 0.9.180 Windows, Source, checksum and release-note links, including structured metadata and the bug-report version. The memory guide explains how a memory is made and checked (a memory writer drafts, a separate review checks each draft before anything is saved) and what changed in memory jobs, and it has a new section on the three experimental memory settings, **Let memories come to mind on their own**, **Start with a fuller picture of what PCS knows** and **Show what PCS has in mind**, with their limits and costs. It also covers the separate Claude memory model. The Local AI, setup and privacy guides describe faster local speech start-up, the 1.5-second end-of-turn pause, Quick setup's Haiku 5.5 memory model for new Claude setups, and what arriving memory sends to a provider. The memory, Perspective and Local context diagrams have new 0180 versions.

The application ZIP contains the offline runtime and user guides. Tests, developer documents and build tools are in the matching [Source ZIP](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.180/PCS-0.9.180-Source.zip). GitHub’s automatic Source code archive contains the download repository, not the complete application source. [Release checksums](https://github.com/PCS-PersonalContinuitySystem/PCS/releases/download/v0.9.180/PCS-0.9.180-SHA256SUMS.txt) identify the application archives.

## Design and examples

Preserve the Star Atlas design: dark slate, sage, cream four-point stars and self-hosted Albert Sans. The homepage demonstrates switching models while saved records stay in place. Shared styles and behavior are in `assets/atlas.css` and `assets/atlas.js`; guides also load `assets/atlas-guides.css`. The font and its SIL Open Font License are in `assets/fonts/`. [DESIGN.md](DESIGN.md) records the design system; [PRODUCT.md](PRODUCT.md) records the product facts.

Screenshots retain their genuine **0.9.114** and **0.9.139** capture labels. They contain authored fictional demonstration data, not new 0.9.180 screenshots or live AI results. See [SCREENSHOTS.md](SCREENSHOTS.md) and [SCREENSHOT-MANIFEST.json](SCREENSHOT-MANIFEST.json).

The website Map is an older, explicitly labeled adaptation with 76 fictional records. It starts on Constellations; the current app starts on All links. The demo makes no AI requests, reads no personal vault and does not edit PCS. Its progress and notes last for the current visit. The homepage memory correction is an illustration. The 0180 memory, Perspective and Local context SVGs, and the memory and Perspective diagrams’ equivalent phone HTML, are authored explanations, not captured AI behavior.

## Keep product claims accurate

- PCS is free and open source. Provider API charges and any account subscription used for ChatGPT sign-in are separate. ChatGPT sign-in does not import chat history or provide unlimited use; each newly opened PCS page needs **Get ChatGPT ready**.
- OpenRouter uses its own key and the selected upstream provider. Models need the appropriate tool/image capabilities. Small open models did not perform memory work in the release tests; choose a separate memory model, such as the recommended `anthropic/claude-haiku-5.5`. Existing blank Memory-model settings are not changed automatically. Free-model limits and web-search charges still apply.
- Only Google and OpenAI maintain PCS cloud embeddings. Other routes retain word/navigation recall and can use the optional local Nomic index.
- Local models, runtimes and speech packs are separate downloads. The recommended Local route requires compatible NVIDIA hardware. Custom GGUF RAM offload does not establish reliable long-prompt operation.
- Saved continuity is encrypted locally. Original Materials and readable exports are outside that encryption. **Don’t save** controls PCS retention; cloud requests still reach the selected services. Corrections and deletion cannot retract prior disclosures or erase earlier backups.
- The three memory settings that let memories come to mind are experimental and off unless turned on; Quick setup does not turn them on. They match words, not meaning, and can add paid replies on OpenAI Realtime. New Recommended Claude setups use Haiku 5.5 for memory, on the basis of one test.
- AI memories and recall remain fallible. Google’s lite memory model can still merge drifting subjects; Local subject separation is unchanged. Release tests do not qualify physical devices, personal vaults, long sessions, a fresh installation or live microphone behavior.
- Windows x64 is the current package. The linked Linux 0.9.115 and macOS Apple silicon 0.9.114 builds are archived experiments. Preserve their older filenames.
- Direct Alibaba Qwen, automatic activity following, the former Proactive help panel and Activity’s **Explore another perspective** are retired. PCS Perspective remains available.
- Back up before upgrading. OpenRouter connection records require PCS 0.9.151 or later; helper records and larger Practice assessments require 0.9.152 or later. Versions through 0.9.180 add no later reader requirement. **Check backup** reports the saved copy’s actual requirement.

## Preview and publish

This is a buildless static site. GitHub Pages serves the repository root; browsing needs no external font, analytics or AI service.

Serve the extracted full site with `python -m http.server 8000 --bind 127.0.0.1`, then open `http://127.0.0.1:8000/`. Stop the server with Ctrl+C.

For an existing website checkout, merge the contents of **PCS-Website-0.9.180-Update.zip** into the repository root, preserving its `assets/` subfolder. **PCS-Website-0.9.180-Full-Site.zip** contains the complete static site for preview or restoration. Do not upload either ZIP as a website file. See [UPLOAD-INSTRUCTIONS.md](UPLOAD-INSTRUCTIONS.md).

`PUBLICATION-MANIFEST.json` records file identities; `SHA256SUMS.txt` verifies them. `WEBSITE-CHECKS.json` records only checks performed on this package, with their limits. These records do not establish deployed-site or application reliability. Historical ZIP/TAR files in the repository are not deployment source.
