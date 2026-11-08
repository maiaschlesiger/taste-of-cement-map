# Taste of Cement Sound Map: Design System

Every visual, interaction, motion, sound and copy rule used in the site. Values come from `css/style.css` (`:root`), `js/app.js`, `js/compare.js` and `js/sfx.js`. When this document and the code disagree, the code wins: update this file.

The site is one page. On the left, a list of seven relationships, each a sound of war joined to a building sound. On the right, the chosen relationship: fact bullets for each sound, the two sounds compared and played from the film, and a footer of other moments in the film that sound like each side. There are no tabs, no filters and no separate comparison page.

---

## 1. Principles

1. **Selected moments, not every sound.** The page shows only the pairs picked by watching the film. It does not map every second of the soundtrack, and it does not show the sound classifier's labels, which were unreliable.
2. **Compare in context.** The sound comparison and the explanation of why it matters sit side by side, on the same card.
3. **Human facts, not prose.** Every written part is a bullet list. After one line on what is on screen, each bullet is a sourced fact about what that sound means for the people who live with it: trauma and PTSD, children's fear of aircraft and shouting, life underground, the workers' pay, safety, curfews and silence. Each has a source listed in About.
4. **Two worlds, two colours.** War is orange, building is blue. Everything else is ink, grey or white.
5. **Quiet chrome.** White cards on a pale grey canvas, separated by space. No borders, no dividers, almost no shadow.
6. **The list stays put.** The relationship list is sticky; the detail card scrolls about 100px at 1440×900 and 190px at 1280×800.

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
| `--ink` | `#1f1f23` | Text, primary button, selected row number and connector, score ring, playhead |
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
| `--list-w` | 330px | Relationship list column |
| `--text-w` | 360px | Text column inside the detail card |

No borders anywhere. Menus use `0 12px 32px rgb(20 20 30 / .12)`.

---

## 3. Layout

```
Header   Brand (mark, "Taste of Cement", "War and work, side by side")              [About] [sound]

List card (sticky)            Detail card
 ① ● A tank moving   51:38     Title: "A tank moving vs machinery moving"
   │                  97%      [● war, time] [● building, time]  How it was paired
   ● Machinery moving 53:17
 ② …                           ● A tank moving          | (97%) ● War ● Building ▭ Most alike
 …                               • fact                 | waveform, 6 seconds
 ⑦ …                             • fact                 | [Play both] [War] [Building]  ☑ Line them up
                               ● Machinery moving       | What they share
                                 • fact                 |   • fact  • measurements (● war ● building)
                               Footer: Other moments in the film that sound like this
                                ● Like the tank moving      [28:51 bombs] [53:45] …
                                ● Like the machinery moving [46:39] [1:19:20] …
```

- Above 1100px the detail card has two columns (facts, sound). From 1100px down to 900px they stack inside the card.
- At 900px and below the list sits above the detail card.

---

## 4. Components

### 4.1 Header
Brand mark: an orange dot joined to a blue dot by an ink curve, echoing the list's connector. "About" is a white button with the card shadow. The speaker icon button opens the sound menu.

### 4.2 Relationship list (`#rels`)
- Seven rows, no intro text. The list card sticks to the top of the viewport while the page scrolls.
- **Row:** number in a 22px circle; the war sound (orange dot, label, time) above the building sound (blue dot, label, time), joined by a 2px vertical connector; the overlap percentage on the right.
- Hover fills the row with `--canvas`. The selected row keeps that fill, its number circle turns ink and its connector turns ink.
- Labels truncate with an ellipsis rather than wrap.

### 4.3 Detail card: head and facts
- Title: "War sound vs building sound".
- Chips: coloured dot, label, time in `--mute`. Then how it was paired, muted: "Paired by watching the film" or "Building moment picked by measurement".
- **War sound facts:** a heading with an orange dot and the sound's name, then bullets: what is on screen and when, then the human cost of that sound in Syria (fear, trauma, rescue, life underground).
- **Building sound facts:** a heading with a blue dot, then bullets: what is on screen and when (or how the moment was picked), then the workers' side (PTSD, pay, contracts, safety, curfew, silence, poverty).
- Bullets are 13.5px (13px at 1366px and below), 1.5 line height, with grey markers.

### 4.4 Detail card: sound and "What they share"
- **Score ring:** 64px, 11px stroke, `--ink` on `--canvas`, percentage in the middle (16px / 700).
- **Key:** War (orange dot), Building (blue dot), Most alike (grey bar).
- **Waveform** (`canvas#wave`, 140px tall): six seconds starting two seconds before each moment; two loudness lines, war orange over building blue, smoothed and scaled to the pair; the single most-alike stretch shaded `--canvas` and labelled; an ink playhead while playing.
- **Play row:** "Play both" (primary), "War", "Building". These play the film's real sound. A button pulses while its clip loads and turns ink while playing; clicking it again stops. "Line them up" on the right, with the shift in seconds.
- **Measurements:** four small `--canvas` tiles under the play row (two per row on phones), each with a muted label and two values, war after an orange dot and building after a blue dot:
  - louder than (% of the film's non-silent seconds)
  - bass (% of energy below 250 Hz)
  - tone centre (spectral centroid, Hz)
  - hits a second (sharp onsets)
- **What they share:** bullets: how the two relate in the film (cut together, minutes apart), then the most-alike stretch ("Most alike from 2.5 to 3.0 seconds: same sharp edge, the same metallic crack").
- **Why is their similarity significant?** Three bullets with ink markers under "What they share": what critics, programme notes and the film's own history say about why the filmmakers set these sounds side by side, followed by one reading of what it means for the workers. Readings use "may" or "suggests"; quotes and claims come from the sources in About.

### 4.5 Footer: other moments that sound like this
- A `--canvas` panel at the bottom of the detail card. Heading, plus muted hint "Closest first. Click one to hear it".
- Two rows, one per side: a coloured dot with "Like the tank moving" / "Like the machinery moving", then up to six time chips.
- **Chip:** white pill with the time in 600 weight. If the time falls on a moment identified by watching the film, its name follows ("28:51 bombs"). Clicking plays six seconds of the film's real sound, from two seconds before that time; the chip pulses while loading, turns ink while playing, and stops on a second click.
- While the search runs, the row reads "Listening through the film…".
- **How matches are found** (`COMPARE.similar()`):
  - every second of the soundtrack is tried with the same six-second window
  - quiet windows (mean envelope under 130 of 255), windows of very different loudness (level match under 0.6) and windows whose tone centre is more than 1.5 bands away are skipped
  - anything within 20 s of the pair's own moments, or of the scene they belong to, is skipped
  - ranked by 0.6 × tone similarity + 0.4 × loudness-shape correlation − 0.2 × tone-centre distance
  - the best six that are at least 90 s apart are kept, so matches spread across the film instead of bunching in one scene
- No percentages on the chips: almost every match scores near 100% on the pair measure, so the number would say nothing. Order alone shows closeness.

### 4.6 About dialog
A native `<dialog>` card, 560px max, scrolling inside if taller than the window. All bullets: The film, Syrians in Lebanon, How it was made, Sources (links). Closes with ×, Escape or a click on the backdrop.

### 4.7 Sound menu
Opens under the speaker button: Sound on and volume, Sound pack with a try button, one cue select per event with a try button, UI SFX credit.

### 4.8 Design tuner (`#tune`)
Slider panel for every token in section 2, including the two sound colours, list width and text column width. "Copy values" gives CSS for `:root`.

---

## 5. Interaction

| Action | Result |
|---|---|
| Click a relationship row | Selects it; the detail card fills; the footer search runs |
| ↑ ↓ (or ← →) keys | Previous / next relationship |
| Play both / War / Building | Plays six seconds; playhead moves; button turns ink. Starting anything else stops it |
| Click a footer chip | Plays that moment; click again to stop |
| Untick "Line them up" | The building line slides back to its original timing |
| About | Opens the dialog |

The first relationship is selected on load. Selecting another stops any playback.

---

## 6. Motion

| Moment | Effect | Duration / easing |
|---|---|---|
| Relationship selected | Head and text rise 6px and fade in, text 50 ms later | 400 ms `cubic-bezier(.2,.8,.2,1)` |
| Score | Count up and ring fill | 800 ms, ease-out cubic |
| Waveform | Lines draw left to right, then the building line slides into alignment | 700 ms + 500 ms, ease-out cubic |
| "Most alike" labels | Fade in and rise, tied to the line draw | — |
| Line them up toggle | Building line slides | 450 ms |
| Footer chip press | Scale 0.96 | 120 ms |
| Button press | Scale 0.97 | 120 ms |

With `prefers-reduced-motion`, all of these are instant.

---

## 7. Sound design

- **Interface sounds:** [UI SFX](https://github.com/romainsimon/uisfx) 0.4.0 (MIT code, CC0 audio), vendored as `js/vendor/uisfx.js`, synthesized in the browser. 12 packs; Soft is the default. Settings are saved in the browser.

| Event | Default cue | Alternatives |
|---|---|---|
| Choose a pair | select | press, check |
| Hover a pair in the list | hover | focus |
| Play a sound | play | start |
| Open a menu | expand | open |

Every event can be set to Off.

- **Playback of the film's sounds:** real excerpts of the soundtrack in `audio/clips/<seconds>.mp3` (MP3, 96 kbps, 44.1 kHz stereo, 50 ms fade in, 80 ms fade out). `data/clips.json` maps each moment to its clip's start and length in film time.
  - Pair moments: 10 s clips from 4 s before the moment, so the lined-up building sound (shifted by up to ±2 s) still has six seconds.
  - Footer moments: 6 s clips from 2 s before.
  - 87 clips, 578 s in all (about 9.6 minutes), 6.8 MB. Cut from the 48 kHz AAC track of the film; checked against the measurements to within 0.04 s.
  - Played through the Web Audio API, straight to the speakers (not through the interface-sound volume). "Play both" mixes the two at 0.75 each.

---

## 8. Copy

### 8.1 Voice
- Bullets of facts only, no free prose. Each bullet is one checkable statement, with no full stop at the end.
- Written for a museum visitor who has not seen the film.
- Sentence case. No periods in titles, labels or buttons.
- Places are named only where the film shows them: war footage is from Syria, the building site is in Beirut.

### 8.2 Fixed strings
- No intro text above the list.
- How paired: "Paired by watching the film" / "Building moment picked by measurement".
- Detail headings: the war sound's name, the building sound's name, "What they share". Footer: "Other moments in the film that sound like this", hint "Closest first. Click one to hear it", rows "Like the …".
- Key: "War", "Building", "Most alike". Buttons: "Play both", "War", "Building", "Line them up", "About".

### 8.3 Generated text
- "What they share" ends with the most-alike stretch: "Most alike from 2.2 to 4.6 seconds: same sharp edge, the same metallic crack". The kind of match is one of:
  - same deep thud: the low end you feel in your chest
  - same body: the same weight and grain
  - same sharp edge: the same metallic crack
  - hits land together: the same attack, hard to tell apart
- It is only shown when the overlap is 30% or more.

### 8.4 Fact bullets
- Each relationship in `PAIRS` (top of `js/app.js`) has `warFacts`, `buildFacts`, `linkFacts` and `whyFacts`. The measurements come from `M`, in the same file.
- "On screen" bullets come only from moments identified by watching the film. Every other bullet comes from a source listed in About, and is chosen for its human impact rather than for history or engineering.
- The names on footer chips come from `SEEN`, the list of moments identified by watching.

---

## 9. Data

| Pair | War sound | Building sound | Found by | Overlap |
|---|---|---|---|---|
| 1 | Bombs 28:53 | Site machinery 1:19:40 | measurement | 95% |
| 2 | A tank moving 51:38 | Machinery moving 53:17 | watching | 97% |
| 3 | A tank firing 54:14 | Drilling a wall 54:27 | watching | 98% |
| 4 | Footsteps in tunnels 1:02:16 | Site rumble 14:26 | measurement | 94% |
| 5 | Panicked voices 1:03:28 | Site noise 43:56 | measurement | 100% |
| 6 | Digging out survivors 1:04:35 | Site machinery 10:38 | measurement | 99% |
| 7 | A helicopter 1:07:47 | The construction lift 1:17:21 | watching | 93% |

**Overlap score** (`js/compare.js`):
- Windows are 6 seconds, starting 2 seconds before each moment.
- The building window may shift by up to ±2 seconds to line up with the war window. The shift maximises 0.6 × loudness-shape correlation + 0.4 × timbre similarity, minus a small penalty for distance.
- raw = 0.5 × timbre + 0.3 × loudness shape + 0.2 × loudness level, each scaled to 0–1.
- score = (raw − 0.2) / 0.7, clamped to 0–100%.
- A random pair of seconds from the film scores about 40–55%. Loud, dense sounds reach 100% easily, so 100% means "as close as this measure can tell".

**Measurement source:** `data/fine.json`, with a 50 fps loudness envelope and 12 log-spaced bands at 20 fps, measured from a 22 kHz copy of the soundtrack.

---

## 10. Responsive

- Above 1100px: list column plus a two-column detail card. The list is sticky; the page scrolls about 100px at 1440×900 and 190px at 1280×800. At 1366px and below the facts column narrows to 320px and bullets drop to 13px.
- 1100px to 901px: the detail card stacks text above sound.
- 900px and below: one column, list first. Footer rows stack their label above the chips. Side gutter 16px; no horizontal scroll at 390px.

---

## 11. Accessibility

- Relationship rows are buttons with `aria-pressed`; their text reads both sounds and times.
- Arrow keys move between relationships.
- Footer chips are buttons labelled "Play 52:42, tank moving".
- The detail card is an `aria-live="polite"` region, so a new selection is announced.
- Focus ring: 2px `--c-tool`, 2px offset.
- Colour is never the only cue: lanes are labelled, and chips carry text.
- Reduced motion is respected.

---

## 12. Files

| File | Role |
|---|---|
| `index.html` | The page and the About dialog |
| `css/style.css` | All tokens and styles |
| `js/app.js` | Relationship data, fact bullets and measurements, list, detail card, footer, playback controls |
| `js/compare.js` | Alignment, overlap score, similar-moment search, waveform drawing, clip playback |
| `audio/clips/` | Short excerpts of the soundtrack, one per moment on the page |
| `data/clips.json` | Each clip's start and length in film time |
| `js/sfx.js` | Interface sounds and the sound menu |
| `js/tuner.js` | Design tuner |
| `data/fine.json` | Measurements used by the comparison |
