# Taste of Cement Sound Map: Design System

Every visual, interaction, motion, sound and copy rule used in the site. Values come from `css/style.css` (`:root`), `js/app.js`, `js/compare.js` and `js/sfx.js`. When this document and the code disagree, the code wins: update this file.

The site is one page. On the left, a list of seven relationships, each a sound of war joined to a building sound. On the right, the chosen relationship: fact bullets for each sound, the two sounds compared and played from the film, and a footer of other moments in the film that sound like each side. There are no tabs, no filters and no separate comparison page.

---

## 1. Principles

1. **Selected moments, not every sound.** Only the seven pairs picked by watching the film.
2. **A quiet frame around the work.** The interface is greyscale. Colour appears only in the sound itself: the orange and blue waveform lines and their key. (Visual style after Naheel Jawaid's portfolio: flat page, white cards that fill the window, one type size in two greys, the work as the only colour.)
3. **Hierarchy by tone, not size.** One type size (13.5px). Headings, selected items, values and actions are `--ink`; everything else is `--mute`.
4. **Buttons still look like buttons.** Quiet grey fills, one dark primary action (Play both), no icons except a play glyph.
5. **Human facts, not prose.** Every written part is a bullet list of sourced facts about the people who live with each sound, plus a short "why" section.
6. **Fits the window.** Both cards fill the viewport height; the detail card scrolls inside itself, the page does not scroll on a laptop.

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
| `--canvas` | `#e9e9eb` | Page background (flat; no gradient) |
| `--card` | `#ffffff` | Cards, menus, dialog, header buttons |
| `--ink` | `#2f2f34` | Headings, selected row, values, primary button, playing state |
| `--mute` | `#74747c` | All other text (4.6:1 on white) |
| `--line` | `#ededef` | Selected row fill, "most alike" shading in the waveform |
| `--fill` | `#f1f1f3` | Secondary buttons, footer moment pills, row hover (hover darkens to `#e6e6e9`) |
| `--c-bomb` | `#e8642c` | War: waveform line and key only |
| `--c-tool` | `#3a6ea8` | Building: waveform line and key only |

No other colour anywhere in the interface: no coloured dots in the list, headings, chips or stats.

### 2.2 Typography

| Token | Value | Use |
|---|---|---|
| `--font` | Figtree, then bundled Figtree, Helvetica Neue, Arial | The only typeface |
| `--fs` (and `--fs-h1/h2/h3/small`) | 13.5px | Every piece of text |
| `--fw-body` / `--fw-head` | 400 / 500 | Body / headings and primary button |
| `--lh` | 1.6 | Line height |

Hierarchy comes from tone (`--ink` vs `--mute`) and weight 500, never from size. Exceptions: the waveform's canvas labels (12–13px) and the sound menu (13px).

### 2.3 Shape, shadow, spacing

| Token | Value | Use |
|---|---|---|
| `--r-card` | 7px | Cards, menus, dialog |
| `--r-inner` / `--r-btn` | 5px | List rows, buttons, moment pills |
| `--shadow` | `0 16px 40px rgb(20 20 30 / .06)` | Cards and header buttons: soft, wide |
| `--page-pad` | 32px (16px at 900px and below) | Outer margin |
| `--gap` | 18px | Between the two cards |
| `--pad-card` | 32px (22px small screens) | Detail card padding |
| `--hdr-h` | 64px | Header height; the cards fill `100dvh − 64px` |
| `--list-w` | 300px | List card |
| `--text-w` | 340px | Facts column inside the detail card |

No borders. Separation comes from white space (36px between detail sections, 26–30px between groups, 8px between bullets).

---

## 3. Layout

```
Taste of Cement                                                        [About] [Sound]
War and work, side by side

┌ List card ─────────────┐ ┌ Detail card (scrolls inside) ───────────────────────────────┐
│ Seven pairs            │ │ A tank moving vs machinery moving                            │
│ 1  Bombs         28:53 │ │ War at 51:38, building at 53:17. Paired by watching the film │
│    Site machinery 1:19 │ │                                                              │
│ 2  A tank moving 51:38 │ │ War  A tank moving            97% alike once lined up  key   │
│    Machinery…    53:17 │ │ facts                         waveform                       │
│ …                      │ │ Building  Machinery moving    [▶ Play both] [War only] [Building only] [☑ Lined up] │
│                        │ │ facts                         War / Building measurements    │
│                        │ │                               What they share                │
│                        │ │                               Why is their similarity significant? │
│                        │ │ Other moments in the film that sound like this               │
└────────────────────────┘ └──────────────────────────────────────────────────────────────┘
```

- Above 1180px the detail card has two columns. At 1180px and below they stack.
- At 900px and below the cards stack and the page scrolls normally.

---

## 4. Components

### 4.1 Header
Two lines of text on the page background: "Taste of Cement" in `--ink`, "War and work, side by side" in `--mute`. On the right, two white buttons with the card shadow: About and Sound.

### 4.2 Relationship list (`#rels`)
- "Seven pairs" in `--ink`, then seven rows.
- **Row:** number, war sound and time on the first line, building sound and time on the second, all in `--mute`. Hover: `--fill` and `--ink` text. Selected: `--line` fill and `--ink` text.
- No dots, connectors or percentages. Labels truncate with an ellipsis.

### 4.3 Detail card: head and facts
- Title in `--ink`, then one muted line: "War at 51:38, building at 53:17. Paired by watching the film" (or "Building moment picked by measurement").
- Each side: a heading with a muted label and the sound's name in `--ink` ("War  A tank moving"), then plain bullets with no markers, 8px apart.

### 4.4 Detail card: the sound
- "97% alike once lined up" in `--ink` (counts up), with the key on the right: short orange and blue lines and a grey "Most alike" swatch.
- **Waveform** (`canvas#wave`, 200px): six seconds; war orange over building blue; the most-alike stretch shaded `--line` and labelled; an ink playhead while playing.
- **Buttons:** "Play both" is the primary (ink fill, white text, play glyph). "War only", "Building only" and the "Lined up" toggle (a small checkbox inside the button) are `--fill` buttons. Playing turns the button ink with a pulsing dot; loading pulses the button.
- **Measurements:** a plain three-column text table (label, War, Building): louder than, bass, tone centre, hits a second. Labels muted, values in `--ink`.
- **What they share** and **Why is their similarity significant?**: headings in `--ink`, plain bullets.

### 4.5 Footer: other moments that sound like this
- Heading in `--ink` with the muted hint "Closest first. Click one to hear it".
- Two rows: a muted label ("Like the tank moving"), then up to six small `--fill` pills, each with a play glyph, the time in `--ink` and, if the moment was identified by watching, its name in `--mute` ("28:51 bombs"). Playing turns the pill ink.
- **How matches are found** (`COMPARE.similar()`): every second is tried with the same six-second window; quiet windows, windows of very different loudness and windows whose tone centre is more than 1.5 bands away are skipped, as is anything within 20 s of the pair's own scenes; ranked by 0.6 × tone similarity + 0.4 × loudness-shape correlation − 0.2 × tone-centre distance; the best six at least 90 s apart are kept.

### 4.6 About dialog
A native `<dialog>` card, 560px max, scrolling inside if taller than the window. Same single type size; headings in `--ink`, bullets without markers. Sections: The film, Syrians in Lebanon, How it was made, Sources (links). Closes with the Close button, Escape or a click on the backdrop.

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

- Above 1180px: list card plus a two-column detail card, both filling the window; the detail card scrolls inside.
- 1180px to 901px: the detail card stacks facts above the sound.
- 900px and below: cards stack, the page scrolls, footer rows put their label above the pills, the playback toggle drops to its own line.

---

## 11. Accessibility

- Relationship rows are buttons with `aria-pressed`; their text reads both sounds and times.
- Arrow keys move between relationships.
- Footer chips are buttons labelled "Play 52:42, tank moving".
- The detail card is an `aria-live="polite"` region, so a new selection is announced.
- Focus ring: 1.5px `--ink`, 3px offset.
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
