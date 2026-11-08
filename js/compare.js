/* Comparison engine: two six-second windows of the soundtrack, lined up where they are most alike.
   Measures from data/fine.json (50 fps loudness envelope, 20 fps 12-band spectrum).
   Plays short clips of the film's soundtrack from audio/clips/. */
(() => {
  "use strict";
  const W = 6, PRE = 2, LAGMAX = 2;           // window length, seconds before the chosen moment, max shift (s)
  const BF = 20, EF = 50;                      // band and envelope frame rates
  let F = null, loading = null, meanBand = null;
  const BANDS = [[0, 3, "bass"], [4, 7, "body"], [8, 11, "edge"]];
  const LABEL = {
    bass: ["Same deep thud", "the low end you feel in your chest"],
    body: ["Same body", "the same weight and grain"],
    edge: ["Same sharp edge", "the same metallic crack"],
    hits: ["Hits land together", "the same attack, hard to tell apart"],
  };

  function load() {
    if (F) return Promise.resolve(F);
    if (loading) return loading;
    loading = fetch("data/fine.json").then(r => r.json()).then(d => {
      const dec = b64 => { const s = atob(b64), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };
      F = { env: dec(d.env), bands: dec(d.bands), nb: d.n_bands, hz: d.band_hz, nf: d.n_frames };
      meanBand = new Float32Array(F.nb);
      for (let f = 0; f < F.nf; f++) for (let b = 0; b < F.nb; b++) meanBand[b] += F.bands[f * F.nb + b];
      for (let b = 0; b < F.nb; b++) meanBand[b] /= F.nf;
      return F;
    });
    return loading;
  }
  const band = (f, b) => (f >= 0 && f < F.nf ? F.bands[f * F.nb + b] : 0);
  const envAt = t => { const i = Math.round(t * EF); return i >= 0 && i < F.env.length ? F.env[i] : 0; };
  const env20 = f => envAt(f / BF);

  function frameSim(fa, fb) {
    let dot = 0, na = 0, nb2 = 0;
    for (let b = 0; b < F.nb; b++) { const x = band(fa, b) - meanBand[b], y = band(fb, b) - meanBand[b]; dot += x * y; na += x * x; nb2 += y * y; }
    const cos = dot / (Math.sqrt(na * nb2) || 1);
    const ea = env20(fa), eb = env20(fb);
    const ls = 1 - Math.min(1, Math.abs(ea - eb) / 110);
    return { s: Math.max(0, Math.min(1, 0.55 * (cos + 1) / 2 + 0.45 * ls)), active: Math.max(ea, eb) > 95 };
  }
  // whole-window measures: timbre (spectral profile vs the film's average), loudness shape, loudness level
  function windowStats(a0, b0) {
    const n = W * BF, ea = [], eb = [], pa = new Float32Array(F.nb), pb = new Float32Array(F.nb); let k = 0;
    for (let i = 0; i < n; i++) {
      const x = env20(a0 + i), y = env20(b0 + i); ea.push(x); eb.push(y);
      if (Math.max(x, y) > 95) { k++; for (let b = 0; b < F.nb; b++) { pa[b] += band(a0 + i, b); pb[b] += band(b0 + i, b); } }
    }
    const z = a => { const m = a.reduce((p, q) => p + q, 0) / a.length, sd = Math.sqrt(a.reduce((p, q) => p + (q - m) ** 2, 0) / a.length) || 1; return [a.map(v => (v - m) / sd), m]; };
    const [za, ma] = z(ea), [zb, mb] = z(eb); let corr = 0; for (let i = 0; i < n; i++) corr += za[i] * zb[i]; corr /= n;
    let dot = 0, na = 0, nn = 0; for (let b = 0; b < F.nb; b++) { const x = pa[b] / (k || 1) - meanBand[b], y = pb[b] / (k || 1) - meanBand[b]; dot += x * y; na += x * x; nn += y * y; }
    // spectral centre of each window, in bands (energy-weighted)
    const cen = p => { let a = 0, e = 0; for (let b = 0; b < F.nb; b++) { const x = Math.pow(10, (p[b] / (k || 1)) / 255 * 104 / 10); a += b * x; e += x; } return a / (e || 1); };
    return { corr, tim: dot / (Math.sqrt(na * nn) || 1), lvl: 1 - Math.min(1, Math.abs(ma - mb) / 60), dcen: Math.abs(cen(pa) - cen(pb)) };
  }
  function align(a0, b0) {
    const L = LAGMAX * BF; let best = { lag: 0, v: -9 };
    for (let lag = -L; lag <= L; lag++) {
      const s = windowStats(a0, b0 + lag), v = 0.6 * s.corr + 0.4 * s.tim - 0.15 * Math.abs(lag) / L;
      if (v > best.v) best = { lag, v };
    }
    return best.lag;
  }
  function regionKind(fa, fb, r) {
    const jumps = f0 => { const out = []; for (let i = r.a + 1; i < r.b; i++) { if (env20(f0 + i) - env20(f0 + i - 2) > 28) out.push(i); } return out; };
    const ja = jumps(fa), jb = jumps(fb);
    if (ja.some(i => jb.some(j => Math.abs(i - j) <= 2))) return "hits";
    let best = "bass", bv = -1;
    for (const [lo, hi, name] of BANDS) {
      let v = 0; for (let i = r.a; i < r.b; i++) for (let b = lo; b <= hi; b++) v += Math.min(band(fa + i, b), band(fb + i, b)) - meanBand[b];
      if (v > bv) { bv = v; best = name; }
    }
    return best;
  }
  function analyse(a0, b0, lag) {
    const n = W * BF, sims = [];
    for (let i = 0; i < n; i++) { const r = frameSim(a0 + i, b0 + lag + i); sims.push(r.active ? r.s : null); }
    const ws = windowStats(a0, b0 + lag);
    const raw = 0.5 * (ws.tim + 1) / 2 + 0.3 * (Math.max(-1, ws.corr) + 1) / 2 + 0.2 * ws.lvl;
    const score = Math.round(100 * Math.max(0, Math.min(1, (raw - 0.2) / 0.7)));
    const sm = sims.map((_, i) => { let a = 0, c = 0; for (let j = i - 2; j <= i + 2; j++) if (sims[j] != null) { a += sims[j]; c++; } return c ? a / c : 0; });
    const sorted = sm.filter(v => v > 0).sort((x, y) => x - y);
    const thr = Math.max(0.6, sorted[Math.floor(sorted.length * 0.6)] || 0.6);
    const regs = []; let st = -1;
    for (let i = 0; i <= n; i++) {
      const on = i < n && sm[i] >= thr;
      if (on && st < 0) st = i;
      if (!on && st >= 0) { if (i - st >= 6) regs.push({ a: st, b: i, m: sm.slice(st, i).reduce((x, y) => x + y, 0) / (i - st) }); st = -1; }
    }
    regs.sort((x, y) => (y.b - y.a) * y.m - (x.b - x.a) * x.m);
    const top = regs.slice(0, 1).map(r => ({ ...r, kind: regionKind(a0, b0 + lag, r) })).sort((x, y) => x.a - y.a);
    // join neighbouring stretches of the same kind
    for (let i = top.length - 1; i > 0; i--) if (top[i].kind === top[i - 1].kind && top[i].a - top[i - 1].b <= 12) { top[i - 1].b = top[i].b; top.splice(i, 1); }
    return { score, regs: score >= 30 ? top : [] };
  }

  // compare two moments (seconds): returns everything the page needs to draw and describe them
  function compare(ta, tb) {
    return load().then(() => {
      const a0 = Math.round((ta - PRE) * BF), b0 = Math.round((tb - PRE) * BF), lag = align(a0, b0);
      const res = analyse(a0, b0, lag);
      return { a0, b0, lag, lagSec: lag / BF, score: res.score, regs: res.regs };
    });
  }
  // other moments in the film that sound like the moment at t (seconds).
  // Scans every second of the soundtrack with the same six-second window. Ranks by tone (spectral profile)
  // and loudness shape, keeps only windows of similar loudness and brightness, skips quiet windows and the ranges in
  // `avoid` ([from, to] seconds, with a 20 s margin), and keeps the best n at least `gap` seconds apart
  // so the matches spread across the film.
  const simCache = {};
  function similar(t, avoid, n, gap) {
    n = n || 6; gap = gap || 90;
    const key = [t, n, gap].concat(avoid.map(r => r.join("-"))).join("|");
    if (simCache[key]) return Promise.resolve(simCache[key]);
    return load().then(() => {
      const a0 = Math.round((t - PRE) * BF), end = Math.floor(F.nf / BF) - W + PRE, cand = [];
      for (let s = PRE; s <= end; s++) {
        if (avoid.some(([lo, hi]) => s > lo - 20 && s < hi + 20)) continue;
        const b0 = Math.round((s - PRE) * BF);
        let m = 0; for (let i = 0; i < W * BF; i += 4) m += env20(b0 + i); m /= W * BF / 4;
        if (m < 130) continue;
        const ws = windowStats(a0, b0);
        if (ws.lvl < 0.6 || ws.dcen > 1.5) continue;
        cand.push({ t: s, v: 0.6 * ws.tim + 0.4 * ws.corr - 0.2 * ws.dcen });
      }
      cand.sort((x, y) => y.v - x.v);
      const pick = [];
      for (const c of cand) { if (pick.every(p => Math.abs(p.t - c.t) >= gap)) pick.push(c); if (pick.length >= n) break; }
      simCache[key] = pick; return pick;
    });
  }
  function hear(c) {
    if (!c.regs.length) return "Little of the two sounds lines up.";
    const r = c.regs.reduce((p, q) => (q.b - q.a > p.b - p.a ? q : p)), [t1, t2] = LABEL[r.kind];
    return `Most alike from ${(r.a / BF).toFixed(1)} to ${(r.b / BF).toFixed(1)} seconds: ${t1.toLowerCase()}, ${t2}.`;
  }

  // ---------- drawing ----------
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function sizeCanvas(cv) {
    if (!cv.dataset.h) cv.dataset.h = cv.getAttribute("height");
    const w = cv.parentElement.clientWidth, h = +cv.dataset.h;
    if (!w) return { g: cv.getContext("2d"), w: 1, h };
    cv.width = w * dpr(); cv.height = h * dpr(); cv.style.height = h + "px";
    const g = cv.getContext("2d"); g.setTransform(dpr(), 0, 0, dpr(), 0, 0); return { g, w, h };
  }
  // c: result of compare(); opts: { progress 0–1, shift 0–1, playT seconds or null, colA, colB }
  // Both loudness curves on one axis, smoothed and scaled to this pair, so their shapes can be compared.
  function draw(cv, c, o) {
    const { g, w, h } = sizeCanvas(cv);
    const padL = 8, padR = 8, top = 40, bot = 30, base = h - bot, H = base - top;
    const X = s => padL + s / W * (w - padL - padR), n = W * EF;
    const raw = st => { const a = []; for (let i = 0; i <= n; i++) a.push(envAt(st + i / EF)); return a; };
    const smooth = a => a.map((_, i) => { let s = 0, k = 0; for (let j = i - 3; j <= i + 3; j++) if (j >= 0 && j < a.length) { s += a[j]; k++; } return s / k; });
    const A = smooth(raw(c.a0 / BF)), B = smooth(raw((c.b0 + c.lag * o.shift) / BF));
    const all = A.concat(B).slice().sort((x, y) => x - y), lo = all[Math.floor(all.length * 0.02)], hi = all[all.length - 1];
    const Y = v => base - Math.max(0, Math.min(1, (v - lo) / ((hi - lo) || 1))) * H * 0.92;
    g.clearRect(0, 0, w, h);
    g.textBaseline = "middle"; g.textAlign = "left";
    let lastEnd = -99;
    c.regs.forEach((r, i) => {
      const x0 = X(r.a / BF), x1 = X(r.b / BF), k = Math.min(1, Math.max(0, o.progress * 3 - i * 0.4));
      g.globalAlpha = k; g.fillStyle = css("--canvas"); g.fillRect(x0, top - 8, x1 - x0, H + 8);
      g.fillStyle = css("--ink"); g.font = `600 12.5px ${css("--font")}`;
      const txt = LABEL[r.kind][0], tw = g.measureText(txt).width, tx = Math.min(x0 + 4, w - padR - tw);
      if (tx > lastEnd + 10) { g.fillText(txt, tx, 14 + (1 - k) * 6); lastEnd = tx + tw; }
      g.globalAlpha = 1;
    });
    g.strokeStyle = css("--line"); g.lineWidth = 1; g.beginPath(); g.moveTo(padL, base); g.lineTo(w - padR, base); g.stroke();
    g.fillStyle = css("--mute"); g.font = `12px ${css("--font")}`;
    for (let s = 0; s <= W; s++) { g.textAlign = s === 0 ? "left" : s === W ? "right" : "center"; g.fillText(`${s} s`, X(s), h - 10); }
    const N = Math.floor(n * o.progress);
    const line = (arr, col) => { g.strokeStyle = col; g.lineWidth = 2.25; g.lineJoin = "round"; g.beginPath(); for (let i = 0; i <= N; i++) { const x = X(i / EF), y = Y(arr[i]); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    line(B, o.colB); line(A, o.colA);
    if (o.playT != null) { g.strokeStyle = css("--ink"); g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(o.playT), top - 8); g.lineTo(X(o.playT), base + 4); g.stroke(); }
  }

  // ---------- playback: short clips of the film's soundtrack (audio/clips/<seconds>.mp3) ----------
  // data/clips.json maps each moment (seconds) to [clip start, clip length] in film time.
  let clipMap = null, nodes = [];
  const bufs = {};
  const clips = () => clipMap ? Promise.resolve(clipMap) : fetch("data/clips.json").then(r => r.json()).then(m => (clipMap = m));
  const ctx = () => window.SFX && window.SFX.ctx;
  function buffer(t) {
    if (!bufs[t]) bufs[t] = fetch(`audio/clips/${t}.mp3`).then(r => r.arrayBuffer()).then(a => new Promise((ok, no) => ctx().decodeAudioData(a, ok, no)));
    return bufs[t];
  }
  function stop() { nodes.forEach(n => { try { n.stop(); } catch (e) { /* already stopped */ } }); nodes = []; }
  // items: [{ t: moment (key in clips.json), from: film second to start at }]; plays W seconds of each, together
  function play(items) {
    stop();
    const c = ctx(); if (!c) return Promise.resolve(false);
    return clips().then(m => Promise.all(items.map(it => buffer(it.t).then(buf => ({ it, buf, clip: m[it.t] }))))).then(list => {
      stop();
      const t0 = c.currentTime + 0.03, gain = list.length > 1 ? 0.75 : 1;
      list.forEach(({ it, buf, clip }) => {
        const src = c.createBufferSource(), g = c.createGain();
        src.buffer = buf; g.gain.value = gain;
        const off = Math.max(0, Math.min(buf.duration - 0.1, it.from - clip[0]));
        src.connect(g).connect(c.destination); src.start(t0, off, Math.min(W, buf.duration - off)); nodes.push(src);
      });
      return true;
    }).catch(() => false);
  }
  function preload(ts) { clips().then(() => { if (ctx()) ts.forEach(buffer); }); }

  window.COMPARE = { W, PRE, BF, load, compare, similar, hear, draw, play, stop, preload };
})();
