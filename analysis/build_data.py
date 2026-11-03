"""Combine signal features + YAMNet scores into the map's dataset.

Usage: python build_data.py <feat_frames.npy> <yam.npy> <yam_emb.npy> <class_map.csv> <out_dir>
Writes: data.json (per-second points), impacts.json, cuts.json, summary.json
"""
import sys, csv, json
import numpy as np

frames_p, yam_p, emb_p, cmap_p, out = sys.argv[1:6]
F = np.load(frames_p).astype(np.float64)
S = np.load(yam_p).astype(np.float64)
E = np.load(emb_p).astype(np.float64)
names = [r[2] for r in csv.reader(open(cmap_p))][1:]

SR, HOP = 22050, 512
FPS = SR / HOP
dur = F.shape[1] / FPS
N = int(dur)                                 # 1-second points
(RMS, PEAK, SUB, LOW, MID, PRES, HIGH, CENT, FLAT, ROLL, PERC, SIDE, ONSET, LOWFLUX, LOWDB) = range(15)

# ---------------- YAMNet families ----------------
FAM = {
    "war": ["Explosion", "Boom", "Gunshot, gunfire", "Machine gun", "Artillery fire", "Fusillade", "Cap gun",
            "Thunder", "Thunderstorm", "Eruption", "Burst, pop", "Bang", "Fireworks", "Firecracker"],
    "machine": ["Tools", "Power tool", "Drill", "Jackhammer", "Hammer", "Sawing", "Filing (rasp)", "Sanding",
                "Mechanisms", "Ratchet, pawl", "Clang", "Engine", "Heavy engine (low frequency)", "Idling",
                "Truck", "Air brake", "Medium engine (mid frequency)", "Vehicle", "Motor vehicle (road)",
                "Rail transport", "Train", "Railroad car, train wagon", "Bus", "Car", "Mechanical fan",
                "Electric shaver, electric razor", "Microwave oven", "Steam", "Hiss", "Rumble"],
    "voice": ["Speech", "Narration, monologue", "Conversation", "Whispering",
              "Child speech, kid speaking", "Shout", "Yell", "Screaming",
              "Crying, sobbing", "Crowd", "Chatter", "Hubbub, speech noise, speech babble"],
    "media": ["Television", "Radio"],
    "music": ["Music", "Ambient music", "Soundtrack music", "Scary music", "Gong", "Timpani", "Percussion",
              "Musical instrument", "Bowed string instrument", "Synthesizer", "Sad music"],
    "water": ["Water", "Ocean", "Waves, surf", "Stream", "Waterfall", "Gurgling", "Boat, Water vehicle",
              "Splash, splatter", "Rain", "Rain on surface", "Drip"],
    "silence": ["Silence"],
    "air": ["Wind", "Rustle", "Wind noise (microphone)", "Rustling leaves", "Pink noise", "White noise", "Noise"],
}
for k, L in FAM.items():
    bad = [n for n in L if n not in names]
    assert not bad, (k, bad)
FIDX = {k: [names.index(n) for n in L] for k, L in FAM.items()}

ypatch_t = np.arange(S.shape[0]) * 0.48 + 0.48      # patch centre (0.96 s window)


def yam_at(sec):
    """mean YAMNet scores of patches whose centre falls in [sec, sec+1)."""
    m = (ypatch_t >= sec) & (ypatch_t < sec + 1)
    if not m.any():
        m = np.abs(ypatch_t - sec - 0.5) == np.abs(ypatch_t - sec - 0.5).min()
    return S[m].mean(0), E[m].mean(0)


# ---------------- per-second points ----------------
fr = lambda sec: slice(int(sec * FPS), int((sec + 1) * FPS))
db = lambda x: 20 * np.log10(x + 1e-7)

# onset peaks for density
from scipy.signal import find_peaks
on = F[ONSET]
pk, _ = find_peaks(on, height=np.percentile(on, 90), distance=int(0.08 * FPS))
onset_times = pk / FPS

pts, embs = [], []
for s in range(N):
    sl = fr(s)
    rms = F[RMS, sl]
    y, e = yam_at(s)
    fam = {k: float(y[i].max()) for k, i in FIDX.items()}
    top = np.argsort(y)[::-1][:3]
    loud = float(db(np.sqrt((rms ** 2).mean())))
    pts.append(dict(
        t=s,
        loud=round(loud, 1),
        peak=round(float(db(F[PEAK, sl].max())), 1),
        crest=round(float(db(F[PEAK, sl].max()) - loud), 1),
        weight=round(float((F[SUB, sl] + F[LOW, sl]).mean()), 3),
        sub=round(float(F[SUB, sl].mean()), 3),
        bright=round(float(F[CENT, sl].mean()), 0),
        noisy=round(float(F[FLAT, sl].mean()), 4),
        perc=round(float(F[PERC, sl].mean()), 3),
        dens=int(((onset_times >= s) & (onset_times < s + 1)).sum()),
        thud=round(float(F[LOWFLUX, sl].max()), 1),
        **{"p_" + k: round(v, 3) for k, v in fam.items()},
        top=[[names[i], round(float(y[i]), 2)] for i in top],
    ))
    embs.append(e)
embs = np.array(embs)

# dominant family (with silence threshold from level)
for p in pts:
    fams = {k: p["p_" + k] for k in FAM}
    if p["loud"] < -55:
        fams["silence"] = max(fams["silence"], 0.5)
    p["fam"] = max(fams, key=fams.get) if max(fams.values()) > 0.12 else "ambient"

# ---------------- comparator: war-likeness vs machine-likeness in embedding space ----------------
W = np.array([p["p_war"] for p in pts])
M = np.array([p["p_machine"] for p in pts])
war_ref = embs[W > 0.35].mean(0)
mac_ref = embs[(M > 0.35) & (W < 0.1)].mean(0)
def cos(a, b):
    return (a @ b) / (np.linalg.norm(a, axis=-1) * np.linalg.norm(b) + 1e-9)
cw, cm = cos(embs, war_ref), cos(embs, mac_ref)
# "echo": how much a moment leans toward the war prototype vs the machine prototype, in [-1,1]
echo = (cw - cm) / (np.abs(cw) + np.abs(cm) + 1e-9)
for p, a, b, c in zip(pts, cw, cm, echo):
    p["sim_war"], p["sim_mac"], p["echo"] = round(float(a), 3), round(float(b), 3), round(float(c), 3)

# nearest "war" neighbours for strongly machine moments (for rhyme lines)
war_ids = np.where(W > 0.35)[0]
mac_ids = np.where((M > 0.35) & (W < 0.1))[0]
En = embs / (np.linalg.norm(embs, axis=1, keepdims=True) + 1e-9)
rhymes = []
if len(war_ids) and len(mac_ids):
    sim = En[mac_ids] @ En[war_ids].T
    for r, i in enumerate(mac_ids):
        j = int(np.argmax(sim[r]))
        rhymes.append([int(i), int(war_ids[j]), round(float(sim[r, j]), 3)])
    rhymes.sort(key=lambda x: -x[2])

# ---------------- impacts (transients with a low-frequency punch) ----------------
lowdb = F[LOWDB]
ldb = db(F[RMS])
SPEECH = [names.index(n) for n in ["Speech", "Narration, monologue", "Conversation", "Whispering"]]
cand, _ = find_peaks(F[LOWFLUX], height=6, distance=int(0.25 * FPS))
impacts = []
for c in cand:
    pre = np.median(ldb[max(0, c - int(0.5 * FPS)):c]) if c > 2 else ldb[c]
    pkf = c + int(np.argmax(ldb[c:c + 8]))
    peak = ldb[pkf]
    jump = peak - pre
    if jump < 6 or peak < -40:
        continue
    t = c / FPS
    mwin = (ypatch_t >= t - 0.3) & (ypatch_t <= t + 0.9)
    y = S[mwin].max(0) if mwin.any() else yam_at(int(t))[0]
    if y[SPEECH].max() > 0.3:
        continue
    tail = ldb[pkf:pkf + int(4 * FPS)]
    below = np.where(tail < peak - 12)[0]
    decay = (below[0] if len(below) else len(tail)) / FPS
    win = slice(c, c + int(0.3 * FPS))
    w, m = float(y[FIDX["war"]].max()), float(y[FIDX["machine"]].max())
    reading = ("both" if w > 0.2 and m > 0.2 else "war" if w > 0.2 else "machine" if m > 0.2 else "unclear")
    pool = FAM["war"] + FAM["machine"]
    top = int(np.argmax(np.r_[y[FIDX["war"]], y[FIDX["machine"]]]))
    impacts.append(dict(
        t=round(t, 2), peak=round(float(peak), 1), jump=round(float(jump), 1), decay=round(float(decay), 2),
        weight=round(float((F[SUB, win] + F[LOW, win]).mean()), 3), bright=round(float(F[CENT, win].mean()), 0),
        war=round(w, 2), machine=round(m, 2), reading=reading, label=pool[top],
    ))

# ---------------- hard cuts in the sound edit ----------------
# abrupt shift of the sound level: median level 1.5 s before vs 1.5 s after a 0.1 s boundary
blk = max(1, int(0.1 * FPS))
nb = F.shape[1] // blk
L = db(np.sqrt((F[RMS, :nb * blk].reshape(nb, blk) ** 2).mean(1)))
W15 = 15
cuts = []
i = W15
while i < nb - W15:
    before, after = np.median(L[i - W15:i]), np.median(L[i:i + W15])
    step = after - before
    if abs(step) >= 15 and abs(L[i] - L[i - 1]) >= 8:
        t = i * blk / FPS
        sb, sa = pts[max(0, int(t) - 2)]["fam"], pts[min(N - 1, int(t) + 2)]["fam"]
        kind = "voice" if "voice" in (sb, sa) else "scene"
        cuts.append(dict(t=round(t, 2), delta=round(float(np.clip(step, -60, 60)), 1), before=round(float(before), 1),
                         after=round(float(after), 1), fb=sb, fa=sa, kind=kind))
        i += W15
    else:
        i += 1

# ---------------- summary stats ----------------
fam_seconds = {}
for p in pts:
    fam_seconds[p["fam"]] = fam_seconds.get(p["fam"], 0) + 1
imp_read = {}
for i in impacts:
    imp_read[i["reading"]] = imp_read.get(i["reading"], 0) + 1
summary = dict(
    duration=round(dur, 2), points=N, fam_seconds=fam_seconds, impacts=len(impacts), impact_readings=imp_read,
    cuts=len(cuts), silent_seconds=int(sum(p["loud"] < -55 for p in pts)),
    rhyme_count=len(rhymes),
    war_seconds=int((W > 0.35).sum()), machine_seconds=int(((M > 0.35) & (W < 0.1)).sum()),
)

json.dump(dict(points=pts, rhymes=rhymes[:400]), open(f"{out}/data.json", "w"), separators=(",", ":"))
json.dump(impacts, open(f"{out}/impacts.json", "w"), separators=(",", ":"))
json.dump(cuts, open(f"{out}/cuts.json", "w"), separators=(",", ":"))
json.dump(summary, open(f"{out}/summary.json", "w"), indent=1)
print(json.dumps(summary, indent=1))

# ---------------- regions: smoothed dominant sound-world ----------------
from collections import Counter
fams = [p["fam"] for p in pts]
K = 7
sm = [Counter(fams[max(0, i - K):i + K + 1]).most_common(1)[0][0] for i in range(N)]
runs = []
for i, f in enumerate(sm):
    if runs and runs[-1][2] == f:
        runs[-1][1] = i + 1
    else:
        runs.append([i, i + 1, f])
# absorb short runs (<20 s) into the longer neighbour
changed = True
while changed:
    changed = False
    for j, r in enumerate(runs):
        if r[1] - r[0] < 20 and len(runs) > 1:
            nb = [x for x in (j - 1, j + 1) if 0 <= x < len(runs)]
            k = max(nb, key=lambda x: runs[x][1] - runs[x][0])
            runs[k][0], runs[k][1] = min(runs[k][0], r[0]), max(runs[k][1], r[1])
            runs.pop(j); changed = True
            break
    # merge equal neighbours
    m = []
    for r in runs:
        if m and m[-1][2] == r[2]:
            m[-1][1] = r[1]
        else:
            m.append(r)
    runs = m
regions = [dict(a=a, b=b, fam=f, loud=round(float(np.mean([pts[i]["loud"] for i in range(a, b)])), 1)) for a, b, f in runs]
d = json.load(open(f"{out}/data.json"))
d["regions"] = regions
json.dump(d, open(f"{out}/data.json", "w"), separators=(",", ":"))
print(len(regions), "regions")
for r in regions:
    print(f'{r["a"]//60:3d}:{r["a"]%60:02d}-{r["b"]//60:3d}:{r["b"]%60:02d} {r["fam"]:8s} {r["loud"]}')
