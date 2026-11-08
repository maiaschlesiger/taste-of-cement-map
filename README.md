# Sound Map of *Taste of Cement*

An interactive map of the sound of Ziad Kalthoum's documentary *Taste of Cement* (2017). The film follows Syrian workers building a tower in Beirut while the war goes on at home, and links the two places through sound. The map picks out seven sounds of war, pairs each with a building sound, and lets visitors replay and compare them next to a short explanation of why the link matters.

Made for a creative mapping assignment on film and migration.

## The page

- **Relationship list:** the seven pairs, each a sound of war joined to a building sound, with their times and overlap. Click one to open it.
- **Detail:** fact bullets for each sound (what is on screen, and the background behind it); the two sounds' loudness drawn on top of each other and lined up, with an overlap score, measurements and playback of the real sound; and a footer of other moments in the film that sound like each side, which you can click to hear.
- **About:** the film, how the map was made, and its limits.

Three pairs are cut together in the film itself. For the other four, the building sound is the construction moment that measures closest. The pairs, their fact bullets and their measurements are at the top of `js/app.js`. Sources are listed in the About box.

The speaker button sets the interface sounds, which come from [UI SFX](https://github.com/romainsimon/uisfx) (MIT code, CC0 audio; vendored in `js/vendor/uisfx.js`).

## Running it

**Online:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root). The map will be at `https://<username>.github.io/taste-of-cement-map/`.

**Locally:** browsers block `fetch()` from `file://`, so start a tiny server in this folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

**Design tuner:** add `#tune` to the address (e.g. `…/taste-of-cement-map/#tune`) and reload to open a slider panel for every colour, size, radius and spacing value. *Copy values* gives you the CSS to paste into `:root` in `css/style.css`.

**Listening:** the page plays short clips of the film's soundtrack from `audio/clips/` (87 clips, about 9.6 minutes in all), one per moment on the page.

## What's in the repo

```
index.html, css/, js/app.js    the page, pair data and texts (no build step)
js/tuner.js                    design tuner (opens with #tune)
js/sfx.js                      interface sounds (wraps UI SFX)
js/vendor/uisfx.js             UI SFX 0.4.0 runtime (MIT; audio CC0)
js/compare.js                  alignment, overlap score, similar-moment search, waveform drawing, clip playback
audio/clips/                   short excerpts of the soundtrack, one per moment on the page
data/clips.json                each clip's start and length in film time
fonts/                         Figtree (SIL Open Font License)
data/data.json                 5,098 per-second measurements (analysis output; not used by the page)
data/impacts.json              75 impact events
data/cuts.json                 hard level shifts in the sound edit
data/fine.json                 50 fps loudness envelope and 12-band spectrum, used by the page
data/summary.json              headline numbers
analysis/                      the scripts that produced the data
FINDINGS.md                    what the analysis found, with timestamps to verify against the film
WRITEUP_DRAFT.md               draft of the 2-page explanation
```

**The repo contains no video and no full audio from the film.** It holds only the short study clips in `audio/clips/`, about 9.6 minutes in all, which the page plays. All rights belong to the film's makers. `.gitignore` blocks every other media file so the film can't be committed by accident.

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

`analysis/yam.py` is a self-contained re-implementation of the YAMNet network (MobileNet v1, 521 AudioSet classes, Google, Apache 2.0) that loads only the published weight file. `yamnet_class_map.csv` is from the TensorFlow Models repository (Apache 2.0).
