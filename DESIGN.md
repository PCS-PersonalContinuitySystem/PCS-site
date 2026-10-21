---
name: PCS website
description: Star Atlas. A slate night chart where saved records are fixed stars and AI models come and go.
colors:
  night-slate: "#101920"
  chart-slate: "#17262f"
  deep-slate: "#1f323c"
  starlight-ink: "#eef2e8"
  lichen-grey: "#b3bfae"
  sage: "#bfd29f"
  sage-bright: "#d3e2b9"
  sage-mist: "#e3ecd3"
  pine: "#405f4c"
  star-cream: "#f5e8d2"
  chart-paper: "#e4eadc"
  paper-step: "#d9e1cf"
  paper-deep: "#cdd7c1"
  paper-ink-soft: "#3a4a40"
typography:
  display:
    fontFamily: "Albert Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2.375rem, 0.9rem + 5.6vw, 5.75rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Albert Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(2rem, 1.3rem + 3.2vw, 4rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Albert Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)"
    fontWeight: 500
    lineHeight: 1.4
  body:
    fontFamily: "Albert Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Albert Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)"
    fontWeight: 400
    lineHeight: 1.4
  guide-headline:
    fontFamily: "Albert Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.15rem + 1.9vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  code:
    fontFamily: "ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "0.86em"
rounded:
  none: "0px"
spacing:
  margin: "clamp(16px, 2.2vw, 32px)"
  gutter: "clamp(12px, 1.6vw, 24px)"
  tile-gap: "8px"
  section: "clamp(96px, 11vw, 184px)"
components:
  button-primary:
    backgroundColor: "{colors.sage}"
    textColor: "{colors.night-slate}"
    rounded: "{rounded.none}"
    padding: "0.8em 1.35em"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.sage-bright}"
  button-on-sage:
    backgroundColor: "{colors.night-slate}"
    textColor: "{colors.sage}"
    rounded: "{rounded.none}"
  action-cell:
    backgroundColor: "{colors.deep-slate}"
    textColor: "{colors.starlight-ink}"
    rounded: "{rounded.none}"
    padding: "0 22px"
    height: "72px"
  input-on-pine:
    backgroundColor: "#4a6855"
    textColor: "{colors.starlight-ink}"
    rounded: "{rounded.none}"
    padding: "13px 16px"
    height: "52px"
  data-sheet:
    backgroundColor: "{colors.chart-paper}"
    textColor: "{colors.night-slate}"
    rounded: "{rounded.none}"
    padding: "clamp(32px, 4.5vw, 64px)"
  reading-sheet:
    backgroundColor: "{colors.chart-paper}"
    textColor: "{colors.night-slate}"
    rounded: "{rounded.none}"
    padding: "clamp(22px, 4.6vw, 72px)"
  callout:
    backgroundColor: "{colors.night-slate}"
    textColor: "{colors.starlight-ink}"
    rounded: "{rounded.none}"
    padding: "22px 26px"
  disclosure:
    backgroundColor: "{colors.paper-step}"
    textColor: "{colors.night-slate}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
---

# Design System: PCS website

## Overview

**Creative North Star: "The Star Atlas"**

The site is a night chart drawn in the app's own colours. A person's saved records (conversations, memories, notes) are the fixed stars; AI models are observers who come and go. The one shape is the four-point star from the PCS wordmark, used at three very different scales: enormous and cropped behind the hero's app card, as the stage behind a screenshot, and at text size as a bullet or tab marker. Everything else is flat ground, ink and one sage action colour.

Pages are dark because the app is dark and the visitor arrives from it or is about to live in it. Surfaces change by tone, not by lines or shadows: a section may take a whole field of pine, sage or chart paper. Type is one family, set large and tight for headings and plain and full-strength for reading. Real app screens, labelled as fictional example data, carry the proof; nothing is decorated for its own sake.

**Key Characteristics:**
- One four-point star motif, at three scales, never mixed with other shapes.
- Flat fields of slate, pine, sage and chart paper; separation by tone step.
- One family (Albert Sans), five sizes, sentence case.
- Square corners on everything the site draws; app fragments keep the app's own radius.
- Sage marks the action; cream marks the one thing to look at.

## Colors

A cool slate night with a lichen-green action and a single warm star.

### Primary
- **Sage** (sage): every primary action (download buttons, the selected model chip, action cells) and the chart lines in app fragments. On a sage field it becomes the ground and the action flips to slate.

### Secondary
- **Pine** (pine): a full-section field (the Map band, the bug coupon), headings on chart paper, and the Map band field. Light ink on pine passes AA.

### Tertiary
- **Star Cream** (star-cream): the four-point star and, at most, one tile or block per screen (the hero star, the last stage of the setup bar).

### Neutral
- **Night Slate** (night-slate): the page ground and the ink on every light field.
- **Chart Slate** (chart-slate) and **Deep Slate** (deep-slate): one and two tone steps up from the ground for sections, proof panels, cards and secondary cells.
- **Starlight Ink** (starlight-ink): all running text on dark grounds, at full strength.
- **Lichen Grey** (lichen-grey): secondary notes and captions only (9.3:1 on the ground).
- **Chart Paper** (chart-paper): the light data sheet on the homepage and the reading sheet of every guide, with paper-ink-soft for its notes.
- **Paper Step** (paper-step) and **Paper Deep** (paper-deep): one and two tone steps down from chart paper, for disclosures, tab panels and inline code on the reading sheet.
- **Sage Mist** (sage-mist): the inline select on the sage field.

### Named Rules
**The One Lit Star Rule.** Cream appears once per screen: the star, or one block that is the thing to look at. Never as a page ground.

**The Reading Sheet Rule.** Long reading happens on chart paper; the slate night frames it. Links on paper are pine, never sage.

**The Retired Banner Rule.** The cyan and purple orbital banner in `brand/` is a retired identity. Its colours never appear on the site.

## Typography

**Display Font:** Albert Sans (self-hosted variable woff2, with Segoe UI, system-ui)
**Body Font:** Albert Sans

**Character:** A round, even geometric grotesque that matches the soft chamfers of the wordmark; set tight and heavy for headings, open for reading.

### Hierarchy
- **Display** (600, clamp 38–92px, 1.0, -0.035em): the hero headline and the setup heading. Two lines at most at every width.
- **Headline** (600, clamp 32–64px, 1.02, -0.035em): section titles, the data-sheet title, the download sentence and the word tiles.
- **Title** (500–600, clamp 20–26px, 1.3–1.4): the hero lead, tab labels, FAQ questions, sheet group names and stage names.
- **Body** (400, clamp 17–19px, 1.5): all running text, 34–60ch measures.
- **Label** (400–600, 13–14px): captions, notes and the small print under actions.
- **Guide headline** (600, clamp 28–44px, 1.08, -0.03em): section headings inside the guides' reading sheet; 22px on phones so long headings stay within two lines.
- **Code** (monospace, 0.86em on paper-deep): real file names, paths and values only.

### Named Rules
**The Two-Line Rule.** No heading runs past two lines at 1440, 768 or 390px. Cut words before shrinking type.

**The No Costume Rule.** No eyebrows above headings, no monospace, no tracked capitals and no index numbers in site typography.

## Layout

A 12-column grid with one pair of outer margins (clamp 16–32px) and gutters (clamp 12–24px). Sections are separated by 96–184px or by a change of field, and neighbouring sections never share a composition: split, proof list, band, bar, word wall, sheet, statement, card stack, coupon, mark. The memory section pairs each true-size app fragment, on a chart-slate panel up to 360px wide, with its heading and sentence, two pairs to a row; the word wall uses square cells with 8px gaps. Below 1080px, splits stack, the memory pairs drop to one column, the wall to three or two and the setup bar turns vertical; below 860px the navigation collapses behind a Menu button; below 640px every composition is rebuilt for a thumb.

Guides use three columns on desktop: a contents rail on the left (left-aligned, its current entry marked by a cream star), the chart-paper reading sheet in columns 3–10 with text held to 68ch, and a guides rail on the right (right-aligned, so both rails meet the shared margins). Below 1080px both rails fold into the flow, above and below the sheet; on phones the sheet runs edge to edge, padded to the page margin.

## Elevation & Depth

Flat. Nothing at rest carries a shadow. Depth comes from tone steps (night slate, chart slate, deep slate) and from whole fields of pine, sage or chart paper. The only layered moment is the screenshot viewer dialog over a dimmed backdrop.

### Named Rules
**The Tone Step Rule.** Separate surfaces with a step in tone, never with a rule or a shadow. Lines appear only inside forms and inside app fragments.

## Shapes

Square corners on every surface, button, cell and field the site draws (0px). The four-point star (concave sides, slightly taller than wide) is the one recurring silhouette. App fragments marked `data-ui` keep the app's own 6–10px radii, pill chips and 1px borders because they depict the product. Chart lines inside fragments carry state by stroke: solid links a record to its saved passage, dashed marks a suggested connection.

## Components

### Buttons
- **Shape:** square (0px).
- **Primary:** sage fill, night-slate text, weight 600, at least 52px tall (64px large, 40px small).
- **Hover / Focus:** hover brightens to sage-bright (180ms, behind a fine-pointer query); focus is a 2px sage outline offset 3px; press scales to 0.97 (140ms).
- **On sage fields:** the action flips to a night-slate block with sage text.

### Chips
- **Style:** only inside the app fragment: pill chips with a 1px border; the pressed chip fills sage.

### Cards / Containers
- **Corner Style:** square.
- **Background:** chart slate or deep slate on the ground; pine or sage for one block at a time; cream only for the star.
- **Shadow Strategy:** none (see Elevation).
- **Internal Padding:** 20px on proof panels and word tiles, 22–28px on FAQ cards, 48px on the coupon.

### Inputs / Fields
- **Style:** filled blocks one tone lighter than their field, no border, square, 52px tall, 16px text; placeholders at 4.5:1 or better.
- **Focus:** cream outline and a slightly lighter fill.

### Navigation
- **Style:** a plain bar: wordmark left, five single-word links, one small Download button. Links underline in sage on hover. Below 860px a Menu button opens a chart-slate panel.

### Reading Sheet and Rails (guides)
- **Sheet:** chart paper, square, clamp 22–72px padding, text 68ch. Ordered lists number in pine; bullets are the star at text size in pine.
- **Callouts:** a night-slate block with starlight text and sage emphasis.
- **Disclosures:** paper-step blocks with a pine chevron, no lines; one tone deeper on hover.
- **Rails:** sticky on desktop; links in lichen grey turn to ink when current or hovered.

### Live Model Switcher (signature)
A working fragment of the app's "Where you left off" briefing, set at the heart of the giant star. Choosing Gemini, GPT, Llama or Local changes only the model name and who receives shared records, with a 140ms blur crossfade; every saved record stays where it is. It is always labelled as an illustration with fictional records.

## Do's and Don'ts

### Do:
- **Do** use the four-point star at one of its three scales and nowhere as decoration without a job.
- **Do** keep running text in starlight ink at 17px or more; lichen grey is for notes only.
- **Do** label every app screen or fragment as real PCS UI with fictional example data.
- **Do** self-host fonts and assets; the site makes no external requests while browsing.
- **Do** keep every hidden motion state inside `prefers-reduced-motion: no-preference`, so reduced motion shows the finished page.

### Don't:
- **Don't** use gradients, glass, glows or shadows on resting elements.
- **Don't** add eyebrow labels, monospace, tracked capitals or 01/02/03 numbering to site typography.
- **Don't** use the retired cyan and purple banner or its colours.
- **Don't** introduce a second motif shape (circles, hexagons, blobs) next to the star.
- **Don't** let cream become a page ground or appear more than once per screen.
- **Don't** put eyebrow labels or "01 02 03" markers on guide sections; the headings carry the order.
