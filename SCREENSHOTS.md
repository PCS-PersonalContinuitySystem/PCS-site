# PCS 0.9.13 — real interface captures

These PNGs are **browser captures of the released PCS 0.9.13 interface with authored sample data**. They are not generated UI illustrations, screenshots of an older version with a new badge, or evidence of a live AI conversation.

The homepage keeps the caption short: **PCS 0.9.13 · Sample data**. This file contains the capture details so a long explanation is not needed above the feature list.

## Capture method

The checksum-verified `PCS-0.9.13-Source.zip` was extracted into a separate working directory. A disposable encrypted vault was populated through the shipped storage classes. The application's actual FastAPI host, vault, Materials readers, notebook store, Calendar store and Continuity Map implementation served the sample records. The real interface controls were then used to browse, inspect, link a document to a notebook, and capture the screens.

The browser environment blocks direct localhost navigation. For capture, the released HTML, styles and scripts were loaded inline, and `fetch`/WebSocket transport was bridged to the actual ASGI application through `TestClient`. **The bridge did not supply fabricated API results, add controls, replace displayed content, or redraw the interface.** It replaces asset loading and browser-to-host transport, not PCS's frontend renderers or storage implementation. A synthetic platform-session monitor replaced the Windows-only monitor; no live provider session was started.

All **923 extracted release files** were checked against the source archive afterward and were unchanged. The source archive SHA-256 is:

```text
3c45e54924654867d2cdccace9c5adcd4deae66c2e39f8a241f75fd6beb9ae70
```

Captures are **1920 × 1080**, device scale 1, using Chromium 144.0.7559.96 on Linux with Python 3.13.5. The final capture run recorded no browser page errors and 41 successful real ASGI HTTP requests. This is **not execution of the native Windows launcher, a live-provider test, or a full deployed-website browser test**.

## Sample vault

The data consists of 72 owner-authored sample memories, five topic notebooks, three small local Markdown documents, 15 Calendar plans, and three seeded saved-source snapshots with separate bookmarks. Themes include astronomy, sketching, photography, fiction, robotics, hiking and learning. No personal vault, private conversation, API credential or live research result is used.

The three saved-source examples are original demonstration text at reserved example addresses. They were seeded locally through the real store, **not downloaded from those addresses**. Their source limitations record this. Their visible capture timestamps are the store timestamps of those sample snapshots, not evidence that a public site was fetched. The quiz is open-ended; it does not claim to have a verified answer key or automatic grading.

The Conversation capture shows the **actual welcome panel and memory stream**, not a simulated model conversation. The memory inspector shows a genuine owner correction to one of the sample records, with its linked source. Notebook and Calendar controls are the ones actually present in the release.

## Continuity Map

PCS computed **26 themes and 86 connections** from the sample memories and notebooks. Nodes were moved with the map's normal drag controls to make the labels more readable. The node set, edge set, counts, colors and inspector contents were not rewritten or painted onto the screenshots.

The map illustrates shared wording and records; it is not a neurological diagram, personality assessment or demonstration of model reasoning. The date comparison shows current records grouped by their last save, not a reconstruction of past beliefs.

## Image inventory

| File | View |
| --- | --- |
| `screenshots/01-conversation-0913.png` | Welcome panel and sample memory stream. |
| `screenshots/02-continuity-map-0913.png` | Full 26-theme, 86-connection overview; homepage's first feature. |
| `screenshots/03-continuity-map-inspect-0913.png` | Astronomy selected with supporting records. |
| `screenshots/04-materials-documents-0913.png` | Local Documents tab with a selected Markdown source. |
| `screenshots/05-materials-web-sources-0913.png` | Saved quiz, study guide and fictional puzzle source cards. |
| `screenshots/06-notebook-0913.png` | Actual notebook editor with owner notes and a linked document. |
| `screenshots/07-calendar-0913.png` | September 2026 month view and selected-day details. |
| `screenshots/08-library-0913.png` | Library record list and selected record. |
| `screenshots/09-memory-inspect-0913.png` | Real memory inspector, owner correction and source. |
| `screenshots/10-material-reader-0913.png` | Local document reader; included as an additional capture. |
| `screenshots/11-saved-source-bookmark-0913.png` | Original saved sample quiz text and separate bookmark controls. |
| `screenshots/12-map-timeline-0913.png` | Actual timeline and equal-window comparison controls. |

[`SCREENSHOT-MANIFEST.json`](SCREENSHOT-MANIFEST.json) contains the file sizes, dimensions, SHA-256 hashes, environment and capture facts. The separate screenshot-evidence archive contains the authored sample-data script, capture harness, control actions, request log, and unchanged-release verification for reproduction.

## Website use

All five public HTML pages point to these 0.9.13 images, including social metadata and full-image destinations. Brand artwork and existing site resources are unchanged. Historical PNGs may remain in the repository for older links; the refreshed HTML does not reference them.

The previously generated concept images are **not included** in this update. They remain possible design references for a future application revision, not screenshots of features in 0.9.13.
