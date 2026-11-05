# Sound Map of *Taste of Cement*

An interactive, three-dimensional map of the soundtrack of Ziad Kalthoum's documentary *Taste of Cement* (2017). Each of the film's 5,098 seconds becomes one point, placed by how it sounds rather than where it was filmed. The map asks what the film asks without words: **how far apart do building in Beirut and destruction in Syria actually sound?**

Made for a creative mapping assignment on film and migration.

## Views

| Tab | What it shows |
|---|---|
| **Map** | Every second of the soundtrack in 3D. Filter construction, bomb and environmental sounds in the sidebar; nearby dots merge into bubbles sized by how many seconds they hold. Click a dot or a colour swatch to make that group stand out. Hold a dot and drag it into circle A or B, then press **Compare sounds**. |
| **Compare** (opens from the map) | The two sounds overlapped and shifted so their most similar parts line up, with an overlap score, labels on the matching stretches, a pitch fingerprint, and playback (your film file, or a rough sketch rebuilt from the measurements). |
| **Timeline** | The film in order: dominant sound-world, loudness, building-vs-bombing resemblance, hits and hard cuts. Includes a tool to mark what is on screen. |
| **About** | The film, the method and the limits. |

The speaker button sets the interface sounds, which come from [UI SFX](https://github.com/romainsimon/uisfx) (MIT code, CC0 audio; vendored in `js/vendor/uisfx.js`). Pick one of its 12 sound packs, then a cue for each event (click, hover, pick up, drop, highlight, compare…). "Data voice" is this site's own sound for a clicked dot, shaped by that dot's measurements.

## Running it

**Online:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root). The map will be at `https://<username>.github.io/taste-of-cement-map/`.

**Locally:** browsers block `fetch()` from `file://`, so start a tiny server in this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

**Design tuner:** add `#tune` to the address (e.g. `…/taste-of-cement-map/#tune`) and reload to open a slider panel for every colour, size, radius and spacing value. *Copy values* gives you the CSS to paste into `:root` in `css/style.css`.

**Listening:** click *Load your copy of the film or its audio* and choose your local MP4 or audio file. It plays in the browser and is never uploaded. If you load the MP4, the video plays in sync with the map.

## What's in the repo

```
index.html, css/, js/app.js    the map (no build step; Plotly is vendored in js/vendor/)
js/tuner.js                    design tuner (opens with #tune)
js/sfx.js                      interface sounds (wraps UI SFX)
js/vendor/uisfx.js             UI SFX 0.4.0 runtime (MIT; audio CC0)
js/compare.js                  comparison page: alignment, overlap scoring, playback
fonts/                         Figtree (SIL Open Font License)
data/data.json                 5,098 per-second points + 400 rhymes + 57 sound-world regions
data/impacts.json              75 impact events
data/cuts.json                 hard level shifts in the sound edit
data/places.json               your place annotations (export from the Timeline tab and commit)
data/fine.json                 50 fps loudness envelope and 12-band spectrum for the comparison page
data/summary.json              headline numbers
analysis/                      the scripts that produced the data
FINDINGS.md                    what the analysis found, with timestamps to verify against the film
WRITEUP_DRAFT.md               draft of the 2-page explanation
```

**The repo contains no audio or video from the film**, only numbers derived from it. `.gitignore` blocks media files so they can't be committed by accident.

## Reproducing the analysis

Needs Python 3.10+ and ffmpeg.

```bash
pip install -r analysis/requirements.txt
```
```bash
ffmpeg -i taste_of_cement.mp4 -vn -ac 2 -ar 22050 st.wav
```
```bash
ffmpeg -i taste_of_cement.mp4 -vn -ac 1 -ar 16000 mono16.wav
```
```bash
curl -O https://storage.googleapis.com/audioset/yamnet.h5
```
```bash
python analysis/extract.py st.wav feat.npz
```
```bash
python analysis/yam.py yamnet.h5 mono16.wav yam.npy yam_emb.npy
```
```bash
python analysis/build_data.py feat_frames.npy yam.npy yam_emb.npy analysis/yamnet_class_map.csv data
```
```bash
ffmpeg -i taste_of_cement.mp4 -vn -ac 1 -ar 22000 m22k.wav && python analysis/fine.py m22k.wav data/fine.json
```

`analysis/yam.py` is a self-contained re-implementation of the YAMNet network (MobileNet v1, 521 AudioSet classes, Google, Apache 2.0) that loads only the published weight file. `yamnet_class_map.csv` is from the TensorFlow Models repository (Apache 2.0). Plotly.js is MIT-licensed.
