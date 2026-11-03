# Sound Map of *Taste of Cement*

An interactive, three-dimensional map of the soundtrack of Ziad Kalthoum's documentary *Taste of Cement* (2017). Each of the film's 5,098 seconds becomes one point, placed by how it sounds rather than where it was filmed. The map asks what the film asks without words: **how far apart do building in Beirut and destruction in Syria actually sound?**

Made for a creative mapping assignment on film and migration.

## Views

| Tab | What it shows |
|---|---|
| **Sound space** | Every second in 3D. Choose any three of 17 measurements as axes (loudness, low-frequency weight, brightness, percussiveness, hits per second, classifier probabilities, echo index…), or start from one of four preset views. *Rhyme lines* join each machine-dominated second to the war-dominated second it sounds most like. Click a point to set A and shift-click to set B, then listen to them one after the other. |
| **Timeline** | The same data in film order: the dominant sound-world, loudness, the echo index (machine ↔ war), impacts and hard sound cuts. Includes a **Places** tool for marking where each shot actually is (Beirut site, barracks, Syria footage…), because the soundtrack alone can't tell you that. |
| **Impacts** | The 75 isolated hits in the film (hammer, slab, shell, boom), measured by decay, low-frequency weight and brightness, and coloured by what the classifier thinks they are. |
| **About the map** | Method and limitations. |

## Running it

**Online:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root). The map will be at `https://<username>.github.io/taste-of-cement-map/`.

**Locally:** browsers block `fetch()` from `file://`, so start a tiny server in this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

**Listening:** click *Load your copy of the film or its audio* and choose your local MP4 or audio file. It plays in the browser and is never uploaded. If you load the MP4, the video plays in sync with the map.

## What's in the repo

```
index.html, css/, js/app.js    the map (no build step; Plotly is vendored in js/vendor/)
data/data.json                 5,098 per-second points + 400 rhymes + 57 sound-world regions
data/impacts.json              75 impact events
data/cuts.json                 hard level shifts in the sound edit
data/places.json               your place annotations (export from the Timeline tab and commit)
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

`analysis/yam.py` is a self-contained re-implementation of the YAMNet network (MobileNet v1, 521 AudioSet classes, Google, Apache 2.0) that loads only the published weight file. `yamnet_class_map.csv` is from the TensorFlow Models repository (Apache 2.0). Plotly.js is MIT-licensed.
