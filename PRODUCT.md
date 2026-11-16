# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People on Windows PCs who talk to AI models regularly and are tired of every new model, provider or chat starting from nothing. They use AI for ongoing personal work: picking a project back up, reading and studying, talking through a game while they play. Many are not developers; the site is written in plain English for them. A smaller group wants AI that runs on their own PC (compatible NVIDIA GPU) for privacy or offline use.

Their job on the website: understand what PCS is in seconds, trust what it does with their data, check it fits their PC and model choice, then download and get it running.

## Product Purpose

PCS (Personal Continuity System) is a free, open-source Windows app that keeps saved AI conversations, memories and notes together in an encrypted vault on the user's PC. Users talk or type with a supported model, then use those saved records again when they change models. Success is a visitor who downloads PCS, completes the setup guide, and returns to a saved stopping point later, with whichever model they choose.

## Positioning

Continuity belongs to the person, not the model. PCS keeps the saved records (conversations, source-linked AI-written memories, corrections, notebooks) on the user's PC, so switching between Google, OpenAI API, Meta, Claude, signed-in ChatGPT, OpenRouter or a local model keeps the history. Memories can be inspected, corrected or forgotten, with revision history kept. Formation and recall can still omit or misinterpret details.

## Operating Context

- Download is a Windows x64 ZIP from GitHub Releases. Extract it to a writable folder, open `Start PCS.exe`, choose **Get started** and follow its six steps (Workspace, Connection, Sharing, Voice, Screen and Review) to create the vault and choose an AI connection.
- Cloud API connections need the user's provider API key with separate billing. ChatGPT sign-in is an alternative for eligible accounts, subject to account access and usage limits. Local models, runtimes and optional speech packs download separately and need compatible hardware.
- App areas: Conversation (with a "Where you left off" briefing and saved stopping points), Continuity (Map and Library of memories), Materials (documents, reading notes), Notebooks, Calendar (manual entries and optional conversation assistance), Settings, and optional PCS Perspective (PCS's own interests and open questions, kept apart from the user's memories). Optional voice and OBS screen sharing.
- Controls people must learn: Stop, Lock and Quit PCS do different jobs; "Don't save this conversation" is a per-conversation setting.
- Community: Discord for questions, GitHub Issues for bugs, Ko-fi for optional support.

## Capabilities and Constraints

- Current Windows application version is 0.9.164. Website changes never change the app version.
- OpenRouter is a native route in guided setup and across PCS features within the selected model's tool/image support and permissions. It uses its own key, not a second required provider. Free-model inference limits vary and optional web research can charge separately. Do not promise a fixed monthly free quota.
- Direct Alibaba Qwen access and automatic activity following are retired. Qwen-family models offered by OpenRouter are a separate choice. Manual Activity details, explicit memory approvals, Practice, Conversation pace and PCS Perspective remain. Do not restore the retired Proactive help panel in website instructions.
- The default Companion direction gives PCS opinions, tastes and dry humor without inventing a human life story. Custom instructions are preserved. Initiative and Conversation pace remain separate controls.
- Only Google and OpenAI offer cloud embeddings in PCS. Other routes use word/navigation recall and an optional local Nomic index. Local memory and Preparation remain Local.
- OpenRouter conversation data requires PCS 0.9.151 or later; OpenRouter helper data and larger Practice assessment records require 0.9.152 or later. Check backup reports the actual saved minimum reader. Keep pre-upgrade backups.
- Saved conversations, memories and notebooks are encrypted locally. Original Materials files and readable exports sit outside vault encryption.
- Cloud features send permitted content to the selected provider. Local chat and memory can work offline after setup.
- OpenRouter forwards permitted inputs to an upstream provider. Don’t save changes retention, not a cloud request's destination. Original Materials need a separate backup.
- PCS Perspective background thinking keeps enabled microphone input on, including when invited to think it over. Explore now offers a focused pause with input off; Return to conversation interrupts it. Each step thinks then files its conclusion, using two cloud Preparation requests. Independent steps are limited to 12/hour cloud or 30/hour Local; finished thoughts can join ordinary replies at most 4/hour.
- Custom Local GGUF models can offload weights to RAM and expose a thinking switch. This does not change the recommended model or establish that larger models work reliably; the pinned 26B runtime has a known long-prompt crash.
- Switching models keeps saved records; it does not transfer a provider's internal state or guarantee complete recall. Recall can miss details and AI-written memories can be wrong.
- Main package is Windows x64. Earlier experimental Linux x64 0.9.115 and macOS Apple silicon 0.9.114 builds are available on the previous v0.9.114 release page.
- Website is a buildless static site served by GitHub Pages from the repository root. No external fonts, analytics or AI dependencies at browse time; everything is served from the repository.
- Terminology: vault, stopping point, saved memory, saved passage, Continuity Map, Library, Materials, notebook, setup guide (Get started), PCS Perspective, observation (one saved statement in a Local memory), Local, Jev (optional cloud service).

## Brand Commitments

- Name: PCS, Personal Continuity System. Headline in use: "A new AI shouldn't mean starting over."
- Current identity matches the application: dark slate (`#101920`, `#17262f`), sage (`#bfd29f`), darker green (`#405f4c`) for readable text on light grounds, cream star (`#f5e8d2`). The wordmark is chamfered sage letters threaded by a constellation line with cream four-point stars (`assets/pcs-wordmark-36dae8b37826.webp`, `assets/pcs-star.svg`).
- Retired: the cyan and purple orbital banner in `brand/pcs-banner-dark.png` is an old design and does not represent PCS. Do not use it or its colours.
- Voice: plain, careful, honest. Every capability claim carries its real limit (costs, hardware, recall can be wrong). No hype.

## Evidence on Hand

- Genuine 0.9.114 app screenshots with authored fictional data in `screenshots/pcs-*-0114.png` (conversation, library, map, materials, notebook, calendar, memory lessons, memory links). Provenance in `SCREENSHOT-MANIFEST.json`.
- Fresh 0.9.139 Map screenshots: `screenshots/pcs-map-0139.jpg` (homepage, full screen) and `screenshots/pcs-map-focus-0139.png` (guides), made with a hand-written fictional demonstration vault and no live AI result. Provenance in `SCREENSHOT-MANIFEST.json`.
- An interactive Continuity Map demo with a fictional story (`continuity-map.html`, `assets/map*.js`).
- Five guides: getting started, memory, local AI, data and privacy, map demo.
- No testimonials, user counts, press, benchmarks or customer logos exist. Do not invent any.

## Product Principles

1. Show the real app, labelled honestly; illustrations are marked as illustrations.
2. Every claim states its limit in the same breath.
3. The person stays in control: what is saved, what is shared, what is remembered.
4. Plain words over product jargon; detailed controls belong in the guides.

## Accessibility & Inclusion

Plain-language copy for non-technical readers. Visible focus, keyboard-operable tabs and dialogs, a no-JavaScript reading path for the Map demo, and text and focus contrast that pass WCAG AA.

## 0.9.164 website update

- New-user setup uses Get acquainted. Each newly opened page using ChatGPT sign-in needs Get ChatGPT ready.
- The app Map opens on All links, displaying up to 1,000 themes and 10,000 connections. The website demo retains its older Constellations start.
- Local speech on Meta, Claude, ChatGPT and OpenRouter allows 60-second turns, warning at 50.
- Research starts in Materials → Reference notes; Practice starts in Materials → Notebooks. Activity's selected-account Explore another perspective action is removed.
- Cloud memory placement and shrinkage checks remain fallible; Google lite can merge drifting subjects. Local separation is unchanged. Small OpenRouter open models need a capable separate Memory model.
- Windows contains the app, offline runtime and user guides. Source contains tests and build tools. This website package does not qualify the app, devices or a fresh installation.
