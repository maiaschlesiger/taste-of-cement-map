# Taste of Cement Sound Map: Design System

Every visual, interaction, motion, sound and copy rule used in the site. Values come straight from `css/style.css` (`:root`), `js/app.js`, `js/compare.js` and `js/sfx.js`. When this document and the code disagree, the code wins: update this file.

---

## 1. Principles

1. **Explain by doing, not by reading.** Each screen has one short line of text at most. Meaning comes from interaction: hover, highlight, drag, compare.
2. **Two worlds, two colours.** Building is blue, bombing is orange. Everything else is grey or neutral so those two always lead.
3. **Quiet chrome.** White cards on a pale grey canvas, separated by space. No borders, no dividers, almost no shadow.
4. **One screen.** On a laptop, the map and its sidebar fit the viewport with no page scroll.
5. **Honest data.** Labels say "sounds like", never "is". The tool hears sound types, not places.

### Banned patterns

Do not use any of these. Tags and pills are the one exception.

- Excessive italics: none at all. `i` and `em` are reset to normal.
- Instrument Serif, or any serif.
- Negative letter-spacing.
- Over-detailed UI.
- Stacked dividers or rules.
- Many shades and opacities in the chrome. Data dimming is the exception.
- Containers with borders.
- Over-detailed diagrams: no tick numbers, minimal grid.
- Verbose or redundant text.
- Code-style names in the UI, such as file names or `places.json`.
- Section numbering, such as "Step 4 of 8". Use progress dots.
- Eyebrows: small labels above titles.
- Dithering, hatching or patterned fills.
- ASCII art.
- Squircles or icon tiles.
- Mono fonts.
- ALL CAPS subtitles.
- Gradient backgrounds.
- Periods at the end of titles, headings, labels or buttons.

---

## 2. Tokens

All tokens live on `:root` in `css/style.css`. The design tuner (`#tune`) edits them live.

### 2.1 Colour: interface

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#f4f4f5` | Page background; also secondary button, pill and input fill |
| `--card` | `#ffffff` | Cards, menus, hover card |
| `--ink` | `#1f1f23` | Primary text, primary button, active pill |
| `--mute` | `#7c7c85` | Secondary text, counts, hints |
| `--line` | `#e4e4e7` | Hover fill on secondary controls, slider track |
| `--accent` | `#ff6a1f` | Score ring, tour dots, links, "ready" pulse |
| `--grid` | `#ececef` | Reserved for gridlines (the map's empty-cell dots use `--line`) |

Rules:
- Use only two text tones, `--ink` and `--mute`.
- Never put text on `--accent` except inside a filled compare circle, where it is white.

### 2.2 Colour: sound groups (data)

| Group | Token | Value | Family |
|---|---|---|---|
| Tools and metal | `--c-tool` | `#1f63ad` | Construction |
| Engines and machines | `--c-engine` | `#8fb8e3` | Construction |
| Bombs | `--c-bomb` | `#ff6a1f` | Bombs |
| Heard as both | `--c-both` | `#ff85b8` | Both |
| Environment | `--c-env` | `#a7b0bd` | Environment (all other sounds) |

Rules:
- Environment is a single cool grey that covers every sound that is neither building nor bombing. Its sub-types are not shown, because the classifier's labels for them were unreliable. It must never compete with blue or orange.
- On the comparison page, if A and B share a colour, B switches to `--c-maroon` (`#932a10`).
- The shared part of two overlapped waves is always solid `--ink`.

### 2.3 Typography

| Token | Value | Use |
|---|---|---|
| `--font` | Figtree → bundled Figtree (`fonts/Figtree-Variable.woff2`) → Helvetica Neue → Arial | The only typeface |
| `--fs` | 14px | Body |
| `--fs-small` | 12.5px | Counts, hints, subtitles |
| `--fs-h1` | 15px | Site name |
| `--fs-h2` | 19px | Card titles, compare title |
| `--fs-h3` | 13.5px | Sidebar and section headings |
| `--fw-body` | 400 | Body |
| `--fw-head` | 600 | Headings |
| `--lh` | 1.55 | Line height |

Rules:
- Use sentence case everywhere, with no uppercase transforms and no letter-spacing.
- Numbers use `font-variant-numeric: tabular-nums` (set on `body`).
- The score number is 30px / 700. The sidebar filter title is 14px / 700.
- Headings use `text-wrap: balance`.

### 2.4 Shape

| Token | Value | Use |
|---|---|---|
| `--r-card` | 7px | Outer cards, menus |
| `--r-inner` | 5px | Menu rows, hover card |
| `--r-btn` | 5px | Buttons, inputs, selects |
| `--r-pill` | 4px | Nav tab highlight |
| `--r-nav` | 7px | Nav bar, icon buttons |
| — | 999px | Question pills, chips |
| — | 50% | Dots, swatches, compare circles, drag ghost |

Rule: no borders anywhere. Separate things with fill and space.

### 2.5 Shadow

`--shadow: 0 var(--sh-y) var(--sh-blur) rgb(20 20 30 / var(--sh-a))`, with `--sh-a: 0.01`, `--sh-y: 18px` and `--sh-blur: 6px`. That is near-flat: cards read as white shapes on grey.

Floating layers use a stronger, fixed shadow:
- menus: `0 12px 32px rgb(20 20 30 / .12)`
- hover card: `0 10px 30px rgb(20 20 30 / .14)`
- drag ghost: `0 10px 24px rgb(20 20 30 / .25)`

### 2.6 Spacing and layout

| Token | Value | Use |
|---|---|---|
| `--page-pad` | 24px (16px at 900px and below) | Side gutter, always `max(token, safe-area)` |
| `--gap` | 16px | Between cards |
| `--pad-card` | 20px | Card inner padding |
| `--sec-gap` | 22px | Between sidebar sections |
| `--row-pad` | 8px | Menu row padding |
| `--filter-w` | 268px | Map filter sidebar width |
| `--side-w` | 300px | Other sidebars |
| `--maxw` | 1480px | Max content width |
| `--nav-pad` / `--nav-px` / `--nav-py` | 5 / 14 / 7px | Pill nav spacing |

**Map layout (above 900px wide):**
- The `#pane-space` height is `calc(100dvh - 98px)`, with a minimum of 520px.
- The sidebar and map card fill that height. The sidebar scrolls internally if needed, and the plot flexes to fill its card.
- Checked at 1280×800, 1440×900 and 1536×864: no page scroll.

---

## 3. Layout map

```
┌ Header ───────────────────────────────────────────────────────┐
│ ●● Taste of Cement / Sound map      [Map|Timeline|About] [🔊] │
└───────────────────────────────────────────────────────────────┘
┌ Filters (268px) ┐ ┌ Map card ────────────────────────────────┐
│ Sounds   Reset  │ │ (Building↔bombs)(Heaviness)(Sharpness)…  │
│ ☑ ●● Construct… │ │ 47 seconds are heard as building and …   │
│ ☑ ●  Bombs      │ │ 0 min  ● ● ◉ ●  ·  ·    ·  ●   ·         │
│ ☑ ●  Both       │ │ 13 min ● ◉ ● ●  ·  ·    ● ●  ●           │
│ ☐ ●  Environment│ │        dot grid (fills card)             │
│ Film time ○──○  │ │ ← Sounds like building · hint · bombs →  │
│                 │ └──────────────────────────────────────────┘
│ Compare         │
│    ( A )        │
│     vs          │
│    ( B )        │
│ [Compare sounds]│
└─────────────────┘
```

At 900px and below: one column, with the map card first, then the filters. The header wraps.

---

## 4. Components

### 4.1 Header
- Brand: a 30px mark made of six dots in the group colours, plus "Taste of Cement" (15px / 600) over "Sound map" (12px, mute). Clicking it goes to the Map.
- Right side, in order: pill nav, then the sound settings icon button.

### 4.2 Pill nav (tabs)
- White bar, `--r-nav`, padding `--nav-pad`, `--shadow`.
- Tabs: Map, Timeline, About. 14px / 500, mute by default, ink on hover.
- The active tab gets a `--canvas` fill with radius `--r-pill`.
- On the comparison page the whole nav dims to 0.5 opacity.

### 4.3 Icon button
- 40×40 square, `--r-nav`, white fill, `--shadow`, 20px icon in ink. Hover fill is `--canvas`.

### 4.4 Buttons

| Variant | Fill | Text | Use |
|---|---|---|---|
| Secondary `.btn` | `--canvas` (hover `--line`) | ink, 13px / 500 | Play A, Back to map, Mark start… |
| Primary `.btn.primary` | `--ink` (hover `#3a3a40`) | white | Compare sounds, Play together |
| Big `.btn.big` | primary + padding 11×18, 14px | | Compare sounds |
| Icon `.btn.icon` | 34px square | | Play preview in menus |
| Link `.link` | none | accent, 500 | "Open the sound space" |

- Disabled buttons use mute text and no hover.
- Ready state (`.btn.ready`): a soft accent ring pulses every 1.6 seconds once both compare circles are filled.

### 4.5 Sound settings menu
- White, `--r-card`, menu shadow, 12–14px padding, opening 10px below the speaker button. Closes on outside click or Esc.
- Contents:
  - Sound on toggle and volume slider
  - Sound pack select, with a preview button
  - 14 event rows (label, cue select, preview button)
  - credit line

### 4.6 Filter sidebar (Amazon-style facets)
- Section titles are 14px / 700. "Reset" is a text button in `--c-tool`.
- **Facet row (master):** checkbox, colour swatches, label (500), count (mute, 12.5px), expand chevron.
  - Groups: Construction (tool + engine swatches), Bombs, Both at once, Environment (one grey swatch, no sub-types).
  - Default: Construction, Bombs and Both on; Environment off.
- **Child rows** appear when a group is expanded, indented 25px, 13px text:
  - Construction: Hammering and drilling, Metal and clatter, Engines, Vehicles, Rumble
  - Bombs: Explosions, Booms, Gunfire, Thunder
- A master checkbox shows the indeterminate state when only some children are on.
- Counts update with the film-time range.
- **Swatch:** a 12px circle that scales to 1.25 on hover. Clicking it highlights that group (§5.3). There is no selected ring.
- **Film time:** a two-handle range from 0 to 85 min.
  - Track: 3px in `--line`, with the selected part in `--ink`.
  - Thumbs: 18px white circles with a 1.5px ink outline.
  - Values below, at each end, in mute.
- **Compare dock** is pinned to the bottom of the sidebar (§4.10).

### 4.7 Question pills and finding line
- Pills: Building ↔ bombs, Heaviness, Sharpness, Pace. Fully rounded, `--canvas` fill, 13px / 500.
  - Hover fill `--line`, press scales to 0.96. The active pill is ink with white text.
- Each pill sets what runs left to right on the map. Rows are always film time.

| Pill | Left end | Right end | Measure |
|---|---|---|---|
| Building ↔ bombs | Sounds like building | Sounds like bombs | bomb confidence − building confidence (−1 to 1) |
| Heaviness | Light | Heavy, felt in the chest | share of deep bass |
| Sharpness | Muffled | Sharp, metallic | spectral centroid (log scale) |
| Pace | Sparse | Rapid hits | hits per second |

- The finding line under the pills is one sentence, 13.5px, in mute, with key numbers bold in ink. Numbers are computed live from the data.
- The end labels sit in the map's footer, ink, 13px / 500, with arrows: "← Sounds like building" on the left and "Sounds like bombs →" on the right.

### 4.8 The dot-grid map
A flat, axis-free grid drawn on a `<canvas>`, in the style of a population dot map. There is no charting library.

- **Grid:**
  - Rows are equal stretches of the selected film time, top to bottom: 12–34 rows, about 20px each, fitted to the card height.
  - Columns are equal steps of the selected measure, left to right: 10–60 columns, kept square.
  - Every grid point shows a faint 1.6px `--line` dot, so the empty map reads as a field.
- **Minute marks:** about six labels down the left edge, such as "0 min", "13 min", "27 min", in 12px mute.
- **Circles:**
  - One circle per occupied cell, in the colour of the group with the most seconds in that cell.
  - Radius = `cell × 0.47 × (0.3 + 0.7 × √(count ÷ largest count))`, with a minimum of 2.6px. Multiplied by `--dot-scale ÷ 1.2`.
  - **Mixed cells:** if a second group is also present, an inner dot in its colour sits inside a 1.4px white ring. Its size reflects that group's share.
  - Hovering a circle grows it by 18%.
- **Hollow markers:** seconds sitting in A or B leave the grid. An open ring in their colour, labelled A or B, marks the cell they came from.
- **Footer:** the left and right end labels, with the hint "Hover a dot · Click to highlight its group · Drag it into A or B" between them. The hint fades 4 seconds after the first press.

### 4.8b Pairs from the film
Seven war sounds identified by watching the film, each joined to a building sound.

| # | War sound (seen) | Building sound | How the partner was found |
|---|---|---|---|
| 1 | Bombs 28:53 | 10:01 | closest building sound by measurement |
| 2 | Tank moving 51:38 | Construction moving 53:17 | seen in the film |
| 3 | Tank firing 54:14 | Drilling a wall 54:27 | seen in the film |
| 4 | Footsteps in tunnels 62:16 | 14:26 | closest building sound by measurement |
| 5 | Panicked clamour 63:28 | 43:56 | closest building sound by measurement |
| 6 | Shovelling rubble 64:35 | 10:38 | closest building sound by measurement |
| 7 | Helicopter 67:47 | Construction lift 77:21 | seen in the film |

- **Closest by measurement:** every construction second was searched, excluding anything within 90 s of the war moment and the war stretches (51–56 min, 59–71 min). Ranking uses the comparison page's measure (timbre, loudness shape, level). Where two partners were nearly tied, the one clearly away from war footage was chosen.
- **On the map:**
  - Each end is a 9px white disc with a 2.5px ring (bomb orange for the war side, tool blue for the building side) and its number.
  - A 1.2px ink curve joins the two ends.
  - Hovering a marker or a sidebar row thickens that pair to 2.2px, grows its discs to 11px, fades the other pairs to 0.25, and shows the overlap % in an ink pill.
  - Clicking loads the pair into A and B.
- **In the sidebar:** a numbered list ("Bombs ↔ Engines   100%") between Film time and the compare circles.
- Overlap % is computed live with the comparison page's own measure.

### 4.9 Hover card
- White (`--hover-a` = 1), `--r-inner`, floating shadow, 280px wide, 12×14 padding, 13px.
- It follows the cursor 18px right and 14px down, and flips left or up near the edges. It is not clickable unless pinned.
- Content, top to bottom:
  1. Colour dot, then a bold label (sub-type such as "Metal and clatter", or the group name)
  2. "N seconds · start–end", or a single time, in ink
  3. "Heard as …", the computer's top labels in lower case, in mute. Environment cells skip this line.
  4. For a mixed cell, a small coloured dot and "N s of {other group} here too"
  5. Optional key-moment note
  6. When pinned on touch: "Put in A" and "Put in B" buttons

### 4.10 Compare dock (sidebar, vertical)
- Layout, pinned to the bottom of the sidebar: circle A, "vs" (13px, mute), circle B, then a full-width big primary button.
- **Circle:** 72px (`--vs-size`), `--canvas` fill.
  - Empty: a bold letter (ink) over "Drop a dot" (11px, mute).
  - Over (dragging nearby): scales to 1.14 with a `--line` fill.
  - Filled: the group colour grows from the centre (scale 0→1, 0.45s spring). It then shows white text: time or "N s", over the label.
  - Clear button: 24px white circle, top right, ×, appears only when filled.
  - Pop animation on fill (0.45s).
- The button stays disabled until A and B are both filled, then pulses (`.ready`).

### 4.11 Drag ghost
- A fixed circle in the item's colour that follows the cursor, centred on it. A bubble shows its count in white.
- Size: `min(64, 18 + √count × 5)` px. White 3px ring, ghost shadow, lift-in animation (scale 0.6→1, 0.18s).
- On a valid drop it flies into the circle centre, shrinking to 0.4 and fading (0.18s). On a miss it fades out (0.2s).

### 4.12 Comparison page
Full-width card that slides in (pageIn: up 18px, from 0.985 scale and transparent; 0.45s). The header nav dims.

1. **Top row:** a "Back to map" button with a chevron on the left, and chips on the right. Each chip is fully rounded with a `--canvas` fill, a colour dot, the letter, the label and the time or count, with "vs" between them.
2. **Hero row:**
   - Score ring: 128px, 10px stroke, `--canvas` track, accent arc. It counts up over 0.9s.
   - Title: "A label vs B label" (19px / 600).
   - Verdict (16px), for example "Building and bombing, nearly the same sound".
   - Checkbox "Line up the similar parts", followed by a mute note such as "B moved 1.85 s earlier".
3. **Overlapped wave canvas** (300px tall, 6-second window):
   - Each sound is drawn as a mirrored loudness envelope: A in its colour, B in its colour, and the shared part solid ink.
   - The legend on the left reads A, B, Shared.
   - Second marks run along the bottom. A 1.5px ink playhead moves during playback.
   - **Overlap regions** (only when the score is 30% or more): up to three `--canvas` bands, each labelled with a title (12.5px / 600) and a meaning (12px, mute):
     - "Same deep thud", felt in the chest alike
     - "Same body", same weight and texture
     - "Same sharp edge", same metallic crack
     - "Hits land together", same attack, hard to tell apart
   - Animation: the waves draw left to right (0.8s), then B slides into alignment (0.6s). Toggling the checkbox slides B back or forward (0.5s).
4. **Play row:** Play together (primary), Play A, Play B.
5. **Description:** 15px / 1.6, max 70ch, two or three sentences (§8.3).

### 4.13 Timeline tab
- A card titled "The film, minute by minute", with one mute sentence: "Each dot is one minute. Bigger is louder. Hover to read it, click to open it on the map."
- **The line:** a 1.5px `--line` rule across the card, with 85 evenly spaced dots, one per minute. It scrolls sideways below 760px.
- **Dot colour:**
  - the minute's strongest building or bomb group, if it holds at least 12 seconds of that minute
  - otherwise the environment grey
- **Dot size:** 6–18px from the minute's average loudness. Each dot has a 2px white ring.
- **Key moments** have an extra 1.5px ink ring.
- **Hover or keyboard focus:**
  - The dot scales by 1.7 with a spring.
  - An ink label with white 12.5px text expands above it ("30:00 · Environment", plus the key-moment note when there is one).
  - Labels near the ends anchor left or right so they stay on screen.
- **Click:** opens the map with film time set to that minute, from 4 minutes before to 5 minutes after.
- **Below the line:** minute ticks at 0, 15, 30, 45, 60, 75 and 85, and a legend of the five groups.

### 4.14 About tab
A centred letter card (620px) with:
- a title and one paragraph
- an accent link to the map
- three short sections (What this is, Method, Limits)
- a small mute footer with the rights note

### 4.15 Design tuner (`#tune`, and always on in the preview)
- A fixed right panel (330px; a bottom sheet at 58vh on phones) with collapsible groups:
  - Typography, Colour, Sound colours, Interaction, Shape, Shadow, Spacing, Map, Hover card
- Sliders and colour inputs write `:root` tokens live. Changed rows show an accent dot.
- Buttons: "Save for Claude" (preview only), "Copy values" (copies CSS) and "Reset all".

---

## 5. Interaction model

### 5.1 Hover
- The cell under the cursor is found by grid position, and counts if the cursor is within the circle's radius plus 2px (at least 7px).
- The circle grows, the card appears, and the hover sound plays (rate-limited by UI SFX). The cursor becomes a grab hand over circles.

### 5.2 Click a circle
- Press and release without moving 4px or holding 170ms.
- The click sound plays, and the circle's group is highlighted (or un-highlighted if it already was).

### 5.3 Highlight
- Click a circle or a sidebar swatch to highlight that group.
- The highlighted group stays at opacity 1, and every other group fades to the same `--dim-op` (0.12). The fade is eased over `--anim-ms`.
- **Clear it by:**
  - clicking empty space on the map
  - clicking anywhere on the page that isn't a circle, swatch, menu, compare circle or filter control
  - pressing Esc
  - clicking the same circle or swatch again

### 5.4 Drag to compare
1. Press on a circle.
2. Moving 4px, or holding 170ms, starts the drag: the ghost appears, the pick-up sound plays, and the circle's seconds leave the grid at once.
3. While dragging, a compare circle within 24px of the cursor grows and highlights.
4. **Drop on a compare circle:** the ghost flies in, the circle fills, the drop sound plays, and the grid redraws without those seconds. A hollow ring marks where they were. If the same seconds are in the other circle, they move out of it.
5. **Drop elsewhere:** the ghost fades, the seconds return, and the miss sound plays.
6. Pressing × on a filled compare circle empties it and returns the seconds (clear sound).
7. **Touch:** tap a circle to pin the hover card, then use "Put in A" or "Put in B".
8. What is dragged is the cell's main group only. A mixed cell's inner dot stays behind.

### 5.5 Compare
- Opens only when both circles are filled.
- **Representative moment:** for a bubble, the member with the highest confidence for its group.
- **Window:** 6 s, starting 2 s before that moment.
- **Alignment:** B is shifted up to ±2 s in 50 ms steps to maximise `0.6 × loudness-shape correlation + 0.4 × timbre cosine − 0.15 × |shift| / max`.
- **Score:**
  - raw = `0.5 × (timbre+1)/2 + 0.3 × (shape+1)/2 + 0.2 × level similarity`
  - score = `clamp((raw − 0.2) / 0.7) × 100`
  - Calibration on 300 random pairs: building vs bomb has a median of about 50%, bomb vs bomb about 70%, and clearly different sounds 20% or less.
- **Playback:** a 12-band noise sketch rebuilt from the measurements. A and B play at equal volume.

### 5.6 Keyboard and other input
- Esc closes menus and clears the highlight.
- Space plays or pauses the film when one is loaded and the comparison page isn't open.
- Every control is a real button, input or select with a visible focus ring: 2px `--c-tool` outline, 2px offset.

---

## 6. Motion

| Moment | Effect | Duration / easing |
|---|---|---|
| Measure, time or filter change | Each circle grows or shrinks from its old size; new circles grow from zero | `--anim-ms` (320 ms), ease-out cubic |
| Highlight | Opacity cross-fade | 0.7 × `--anim-ms`, ease-out quad |
| Pick up | Ghost lift | 180 ms |
| Drop | Ghost flies in and shrinks; circle fill spring | 180 ms; 450 ms `cubic-bezier(.2,1.4,.4,1)` |
| Circle over | Scale 1.14 | 200 ms `cubic-bezier(.3,1.6,.5,1)` |
| Compare ready | Accent ring pulse | 1.6 s loop |
| Page change to Compare | pageIn | 450 ms `cubic-bezier(.2,.8,.2,1)` |
| Score | Count-up and ring fill | 900 ms, ease-out cubic |
| Waves | Draw left to right, then B aligns | 800 ms + 600 ms |
| Region labels | Rise 6 px and fade in, staggered | Tied to the wave draw |
| Timeline dot hover | Dot scales by 1.7; label rises 6px and scales up from 0.92 | 200 ms `cubic-bezier(.3,1.4,.5,1)` |

With `prefers-reduced-motion`, every duration becomes 0.

---

## 7. Sound design

- **Engine:** [UI SFX](https://github.com/romainsimon/uisfx) 0.4.0 (MIT code, CC0 audio), vendored as `js/vendor/uisfx.js`. Sounds are synthesized in the browser, with no audio files.
- It shares one `AudioContext` with the site. It unlocks on the first pointer or key press.
- **Packs:** Minimal, Soft (default), Glass, Arcade, Mechanical, Organic, Dreamy, Sci-fi, Rubber, Cinematic, Studio, Zen.
- Settings are saved in the browser: pack, volume, mute, and the cue for each event.

| Event | Default cue | Alternatives |
|---|---|---|
| Click a dot | select | press, double-click, check, Data voice |
| Hover a dot | hover | focus |
| Pick up | drag-start | long-press, press |
| Drop in a circle | drop | snap, check, add-to-cart |
| Drop outside | invalid-drop | cancel, release |
| Highlight a colour | focus | toggle-on, select, badge |
| Checkboxes and pills | toggle-on (toggle-off when unchecked) | check (uncheck), press, select |
| Compare sounds | open | start, level-up, achievement |
| While comparing | processing (loop) | loading, scanning |
| Comparison ready | complete | success, reward |
| Play audio | play | start |
| Back to map | back | close |
| Clear a circle | remove-from-cart | delete, undo |
| Open a menu | expand | open |

Every event can also be set to Off.

**Data voice** is the site's own sonification of a dot:
- tools: a metallic FM ping, pitched by sharpness
- engines: a low sawtooth hum, pitched by heaviness
- bombs: a sine thump with a falling low-passed noise tail
- both: a thump plus a ping
- environment: a soft sine
- Loudness sets the volume.

---

## 8. Copy

### 8.1 Voice
- Plain, short, active. Name things by what people recognise.
- Sentence case. No periods in titles, labels or buttons.
- Use "sounds like" or "heard as", never "is". Never say a place ("Beirut", "Syria") unless a person marked it.

### 8.2 Fixed strings

| Where | Text |
|---|---|
| Brand | Taste of Cement / Sound map |
| Tabs | Map · Timeline · About |
| Map title area | Question pills plus a one-line finding |
| Map hint | Drag to turn · Scroll to zoom · Click a dot to highlight its group · Hold a dot and drag it to compare |
| Hover hint | Hold and drag to compare |
| Empty circle | A (or B) / Drop a dot |
| Compare button | Compare sounds |
| Compare page | Back to map · Line up the similar parts · Play together · Play A · Play B |
| Axis labels | More like building → · More like bombs → · Later in the film → · Heavier → · Sharper → · Louder → · Faster hits → · More percussive → · Harder jolt → · Noisier → · More like tools → · More like engines → · Closer to bombs → |

### 8.3 Generated text (comparison page)

**Verdict:**
- Building vs bomb, 65% or more: "Building and bombing, nearly the same sound".
- Building vs bomb, 45–64%: "Partly alike: {top region label}".
- Building vs bomb, under 45%: "Different here: {the more muffled one} is more muffled".
- Other pairs: "A close match", "Alike in parts: …", or "Mostly different".

**Description:**
1. "{A} ({time}) and {b} ({time}) overlap by {n}% once lined up."
2. Only at 30% or more: "They match most from {s} to {e} s: {label}, {meaning}."
3. Building vs bomb only:
   - 65% or more: "Here the sound of building carries the sound of the war."
   - 45–64%: "Part of the work still echoes the war."
   - Under 45%: "Here the two worlds stay apart."
   - Same family: "Two moments from the same sound-world, heard side by side."

---

## 9. Data encoding

- **One point per second** (5,098 in total). Each second is classified in this order:
  1. Bomb, when YAMNet bomb-family confidence is above 0.25.
  2. Both, when it is also at least 0.15 for tools or 0.2 for engines.
  3. Tool, when tool confidence is above 0.2.
  4. Engine, when engine confidence is above 0.3.
  5. Otherwise environment: one group, with no sub-types.
- **Construction sub-type** comes from the stronger of the top tool label and the top engine label. Hammer, Jackhammer, Drill and similar map to "Hammering and drilling"; Vehicle, Truck and similar map to "Vehicles". The sub-type also decides the colour: tool blue for hammering and metal, engine blue for the rest.
- **Axis ranges** are fixed to the 0.5–99.5 percentile of the whole film, padded 4%, so positions don't jump when filters change.

---

## 10. Responsive

| Width | Behaviour |
|---|---|
| Above 900px | Two columns. The map pane fills the viewport height, and the sidebar scrolls internally if needed |
| 900px and below | One column with the map card first. Plot height is 480px, the header wraps, menus become full-width sheets |
| Phones (about 390px) | No horizontal scroll (tested). Tap to pin the hover card, then use "Put in A" or "Put in B" |

All side gutters use `max(token, env(safe-area-inset-*))`.

---

## 11. Accessibility

- Contrast: ink on white is 16.4:1. Mute (`#7c7c85`) is 4.1:1 on white and 3.8:1 on the canvas grey, which is below the WCAG AA target of 4.5:1 for small text. Darkening `--mute` to about `#6b6b74` would pass.
- Every interactive element is a native control with a visible `:focus-visible` ring.
- Compare circles have `aria-label`s that update ("Comparison slot A, Metal and clatter"). The hover card is `role="status"`.
- Sound is optional, off with one toggle, and never carries meaning on its own.
- Reduced motion is respected (§6).

---

## 12. Files

| File | Holds |
|---|---|
| `css/style.css` | All tokens (`:root`) and component styles |
| `index.html` | Structure: header, map pane, compare page, timeline, About |
| `js/app.js` | Dot-grid map (canvas), filters, highlight, drag, dock, line timeline |
| `js/compare.js` | Comparison page: alignment, scoring, regions, drawing, description, playback sketch |
| `js/sfx.js` | Sound settings and event mapping (wraps UI SFX) and the data voice |
| `js/tuner.js` | Design tuner panel |
| `js/vendor/` | UI SFX 0.4.0, with its licences (no charting library) |
| `fonts/` | Figtree (OFL) |
| `data/` | Per-second points, the fine envelope and bands, impacts, cuts, places |
