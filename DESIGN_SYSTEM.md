# Taste of Cement Sound Map: Design System

Every visual, interaction, motion, sound and copy rule used in the site. Values come from `css/style.css` (`:root`), `js/app.js`, `js/compare.js` and `js/sfx.js`. When this document and the code disagree, the code wins: update this file.

The site is one page. A film strip shows where seven sounds of war fall in the film and links each one to a building sound. Under it, the chosen pair is compared and explained. There are no tabs, no filters and no separate comparison page.

---

## 1. Principles

1. **Selected moments, not every sound.** The page shows only the pairs picked by watching the film. It does not map every second of the soundtrack, and it does not show the sound classifier's labels, which were unreliable.
2. **Compare in context.** The sound comparison and the explanation of why it matters sit side by side, on the same card.
3. **For a visitor with no context.** One opening sentence sets the scene. Each pair gets two or three sentences, not more.
4. **Two worlds, two colours.** War is orange, building is blue. Everything else is ink, grey or white.
5. **Quiet chrome.** White cards on a pale grey canvas, separated by space. No borders, no dividers, almost no shadow.
6. **One screen.** On a laptop (1280×800 and up) the whole page fits with no scroll.

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

### 2.1 Colour

| Token | Value | Use |
|---|---|---|
| `--canvas` | `#f4f4f5` | Page background; secondary buttons, chips, the "most alike" shading |
| `--card` | `#ffffff` | Cards, menus, the About dialog |
| `--ink` | `#1f1f23` | Text, primary button, selected link on the strip, score ring, playhead |
| `--mute` | `#7c7c85` | Secondary text, lane labels, minute labels, times in chips |
| `--line` | `#e4e4e7` | Strip lanes, unselected links, hover fill on secondary controls |
| `--c-bomb` | `#ff6a1f` | War: dots, chip dot, waveform line |
| `--c-tool` | `#1f63ad` | Building: dots, chip dot, waveform line |

Use only two text tones, `--ink` and `--mute`.

### 2.2 Typography

| Token | Value | Use |
|---|---|---|
| `--font` | Figtree, then bundled Figtree (`fonts/Figtree-Variable.woff2`), Helvetica Neue, Arial | The only typeface |
| `--fs` | 14px | Body |
| `--fs-small` | 12.5px | Small print |
| `--fs-h1` | 15px | Site name |
| `--fs-h2` | 22px | Pair title, About title |
| `--fs-h3` | 14px | About subheadings |
| `--fw-body` / `--fw-head` | 400 / 600 | Body / headings |
| `--lh` | 1.55 | Line height |

- The opening sentence is 15px. The "why it matters" text is 16px with 1.6 line height: it is the main reading text.
- Use sentence case everywhere, with no uppercase transforms and no letter-spacing. Numbers are tabular.

### 2.3 Shape, shadow, spacing

| Token | Value | Use |
|---|---|---|
| `--r-card` | 7px | Cards, menus, dialog |
| `--r-btn` | 5px | Buttons, selects |
| `--r-pill` | 4px | Strip tooltip |
| `--r-nav` | 7px | Header icon button |
| — | 999px | Chips |
| `--shadow` | `0 18px 6px rgb(20 20 30 / .01)` | Cards: near-flat |
| `--page-pad` | 24px (16px at 900px and below) | Side gutter |
| `--gap` | 16px | Between cards |
| `--pad-card` | 24px (18px small screens) | Card padding |
| `--maxw` | 1320px | Max content width |
| `--strip-h` | 150px (170px small screens) | Film strip height |
| `--info-w` | 380px | Text column of the pair card |

No borders anywhere. Menus use `0 12px 32px rgb(20 20 30 / .12)`.

---

## 3. Layout

```
Header      Brand (mark, "Taste of Cement", "War and work, side by side")      [About] [sound]
Strip card  Opening sentence
            War, Syria        ──●1────────────●2●3──●4●5●6●7──────
                                 ╲             │ │   ╲ ╲ ╲  ╲
            Building, Beirut  ──●●─●──────●────●─●────────────●──
                              0   10 min  20 min …            80 min
Pair card   [‹] ○○●○○○○ [›]                | (98%)  ● War  ● Building  ▭ Most alike
            Title                          | waveform canvas, 6 seconds
            [● war, time] [● building, time] | [Play both] [War] [Building]   ☑ Line them up
            How the pair was found         |
            Why it matters (16px)          |
            What you hear (muted)          |
```

At 900px and below the pair card stacks into one column, text first.

---

## 4. Components

### 4.1 Header
Brand mark: an orange dot joined to a blue dot by an ink curve, echoing the strip. "About" is a white button with the card shadow. The speaker icon button opens the sound menu.

### 4.2 Film strip (`svg#strip`)
- Drawn in SVG by `drawStrip()`; redrawn on resize and when the selection changes.
- Two lanes (2px `--line`): "War, Syria" on top, "Building, Beirut" below. Lane labels sit in a 112px left gutter; on screens under 600px they sit above the top lane and below the bottom lane.
- Time runs left to right over the whole film (84:58). Minute labels every 10 minutes (every 20 under 600px), no gridlines.
- **War dot:** orange, radius 10 (12 when selected), white pair number inside.
- **Building dot:** blue, radius 7 (9 when selected).
- **Link:** an S-curve from war dot to building dot. Unselected 2px `--line`; hover `--mute`; selected 2.5px `--ink`, drawn on top.
- Dots that would overlap on a lane are nudged apart (gap = 2r + 3) and kept inside the lane.
- Each pair is one focusable group (`role="button"`) with a 14px invisible hit stroke along the link.
- **Tooltip:** a dark pill on hover: "3 A tank firing 54:14 · Drilling a wall 54:27".

### 4.3 Pair card: text column
- Prev/next icon buttons around seven progress dots (6px; current `--ink`, others `--line`, hover `--mute`). Each dot opens its pair. The buttons are disabled at the ends.
- Title: "War sound vs building sound", e.g. "A tank firing vs drilling a wall".
- Two chips: coloured dot, label, time in `--mute`.
- How it was found, muted: "Cut together in the film" or "Closest-sounding building moment".
- Why it matters: the curated text for the pair (16px).
- What you hear: generated, muted, one sentence (see 8.3).

### 4.4 Pair card: sound column
- **Score ring:** 72px, 11px stroke, `--ink` on `--canvas`, percentage in the middle (18px / 700). No label under it.
- **Key:** War (orange dot), Building (blue dot), Most alike (grey bar).
- **Waveform** (`canvas#wave`, 230px tall):
  - six seconds, starting two seconds before each moment
  - two loudness lines (2.25px), war orange on top of building blue, smoothed over 140 ms
  - scaled to this pair: from the 2nd percentile to the maximum of both windows
  - "Most alike" stretches shaded `--canvas`, each labelled above in 12.5px / 600, at most two
  - seconds 0–6 along the bottom; a 1px baseline in `--line`
  - an ink playhead while playing
- **Play row:** "Play both" (primary, with play icon), "War", "Building". The playing button turns ink. "Line them up" checkbox on the right, with the shift in seconds in `--mute`.

### 4.5 About dialog
A native `<dialog>` card, 560px max. Sections: the film, How it was made, Limits, credit line. Closes with ×, Escape or a click on the backdrop (`rgb(20 20 30 / .25)`).

### 4.6 Sound menu
Opens under the speaker button. Rows: Sound on and volume, Sound pack with a try button, then one cue select per event with a try button. Credit line for UI SFX.

### 4.7 Design tuner (`#tune`)
Slider panel for every token in section 2, including the two sound colours, strip height and text column width. "Copy values" gives CSS for `:root`.

---

## 5. Interaction

| Action | Result |
|---|---|
| Click or tap a pair on the strip (dot or link) | Selects it; strip redraws; pair card fills |
| Enter or Space on a focused pair | Same as click |
| ← / → keys, the ‹ › buttons, or a progress dot | Previous / next pair, or that pair |
| Hover a pair | Tooltip; link turns grey |
| Play both / War / Building | Plays six seconds; playhead moves; button turns ink. Starting another stops the first |
| Untick "Line them up" | The building line slides back to its original timing; tick to align again |
| About | Opens the dialog |

The first pair is selected on load. Selecting a pair stops any playback.

---

## 6. Motion

| Moment | Effect | Duration / easing |
|---|---|---|
| Pair selected | Text column items rise 6px and fade in, staggered 30 ms | 400 ms `cubic-bezier(.2,.8,.2,1)` |
| Score | Count up and ring fill | 800 ms, ease-out cubic |
| Waveform | Lines draw left to right, then the building line slides into alignment | 700 ms + 500 ms, ease-out cubic |
| "Most alike" labels | Fade in and rise, tied to the line draw | — |
| Line them up toggle | Building line slides | 450 ms |
| Strip dot selected | Radius grows | 200 ms |
| Button press | Scale 0.97 | 120 ms |

With `prefers-reduced-motion`, all of these are instant.

---

## 7. Sound design

- **Interface sounds:** [UI SFX](https://github.com/romainsimon/uisfx) 0.4.0 (MIT code, CC0 audio), vendored as `js/vendor/uisfx.js`, synthesized in the browser. 12 packs; Soft is the default. Settings are saved in the browser.

| Event | Default cue | Alternatives |
|---|---|---|
| Choose a pair | select | press, check |
| Hover a pair | hover | focus |
| Play a sound | play | start |
| Open a menu | expand | open |

Every event can be set to Off.

- **Playback of the film's sounds:** no film audio is stored. `COMPARE.play()` rebuilds a rough sketch: 12 band-pass noise voices (40 Hz to 10 kHz) whose levels follow the measured spectrum at 20 frames a second. "Play both" mixes the two at 0.75 each.

---

## 8. Copy

### 8.1 Voice
- Plain, short, active. Written for a museum visitor who has not seen the film.
- Sentence case. No periods in titles, labels or buttons.
- Places are named only where the film shows them: war footage is from Syria, the building site is in Beirut.

### 8.2 Fixed strings
- Opening: "Syrian workers build a tower in Beirut while the war goes on at home. The film ties the two together through sound. Pick a pair to hear how close they are."
- Lanes: "War, Syria" / "Building, Beirut".
- How found: "Cut together in the film" / "Closest-sounding building moment".
- Key: "War", "Building", "Most alike". Buttons: "Play both", "War", "Building", "Line them up", "About".

### 8.3 Generated text
- What you hear: "Most alike from 2.2 to 4.6 seconds: same sharp edge, the same metallic crack." The kind of match is one of:
  - same deep thud: the low end you feel in your chest
  - same body: the same weight and grain
  - same sharp edge: the same metallic crack
  - hits land together: the same attack, hard to tell apart
- If nothing lines up: "Little of the two sounds lines up."
- Stretches are only named when the score is 30% or more.

### 8.4 Curated text
The seven "why it matters" texts live in `PAIRS` at the top of `js/app.js`, next to each pair's times and labels. Edit them there.

---

## 9. Data

| Pair | War sound | Building sound | Found by | Overlap |
|---|---|---|---|---|
| 1 | Bombs 28:53 | Building site 10:01 | measurement | 100% |
| 2 | A tank moving 51:38 | Machinery moving 53:17 | the film's cut | 97% |
| 3 | A tank firing 54:14 | Drilling a wall 54:27 | the film's cut | 98% |
| 4 | Footsteps in tunnels 1:02:16 | Building site 14:26 | measurement | 94% |
| 5 | Panicked voices 1:03:28 | Building site 43:56 | measurement | 100% |
| 6 | Digging out survivors 1:04:35 | Building site 10:38 | measurement | 99% |
| 7 | A helicopter 1:07:47 | The construction lift 1:17:21 | the film's cut | 93% |

**Overlap score** (`js/compare.js`):
- Windows are 6 seconds, starting 2 seconds before each moment.
- The building window may shift by up to ±2 seconds to line up with the war window. The shift maximises 0.6 × loudness-shape correlation + 0.4 × timbre similarity, minus a small penalty for distance.
- raw = 0.5 × timbre + 0.3 × loudness shape + 0.2 × loudness level, each scaled to 0–1.
- score = (raw − 0.2) / 0.7, clamped to 0–100%.
- A random pair of seconds from the film scores about 40–55%. Loud, dense sounds reach 100% easily, so 100% means "as close as this measure can tell".

**Measurement source:** `data/fine.json`, with a 50 fps loudness envelope and 12 log-spaced bands at 20 fps, measured from a 22 kHz copy of the soundtrack.

---

## 10. Responsive

- Above 900px: two-column pair card; the whole page fits 1280×800 and 1440×900 with no scroll.
- 900px and below: the pair card stacks; the strip grows to 170px.
- Under 600px: the strip moves its lane labels off the left gutter, smaller dots, minute labels every 20.
- Side gutter is 16px on phones; no horizontal scroll at 390px.

---

## 11. Accessibility

- Each pair on the strip is focusable with a full spoken label (pair number, both sounds, both times).
- Arrow keys move between pairs; Enter and Space select.
- The pair card is an `aria-live="polite"` region, so a new selection is announced.
- Focus ring: 2px `--c-tool`, 2px offset.
- Colour is never the only cue: lanes are labelled, and chips carry text.
- Reduced motion is respected.

---

## 12. Files

| File | Role |
|---|---|
| `index.html` | The page and the About dialog |
| `css/style.css` | All tokens and styles |
| `js/app.js` | Pair data and texts, film strip, pair card, playback controls |
| `js/compare.js` | Alignment, overlap score, waveform drawing, sketch playback |
| `js/sfx.js` | Interface sounds and the sound menu |
| `js/tuner.js` | Design tuner |
| `data/fine.json` | Measurements used by the comparison |
