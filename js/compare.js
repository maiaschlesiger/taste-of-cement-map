/* Comparison engine: two six-second windows of the soundtrack, lined up where they are most alike.
   Uses data/fine.json (50 fps loudness envelope, 20 fps 12-band spectrum). No film audio is stored;
   playback is a rough sketch rebuilt from those measurements. */
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
    return { corr, tim: dot / (Math.sqrt(na * nn) || 1), lvl: 1 - Math.min(1, Math.abs(ma - mb) / 60) };
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
    const top = regs.slice(0, 2).map(r => ({ ...r, kind: regionKind(a0, b0 + lag, r) })).sort((x, y) => x.a - y.a);
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
    c.regs.forEach((r, i) => {
      const x0 = X(r.a / BF), x1 = X(r.b / BF), k = Math.min(1, Math.max(0, o.progress * 3 - i * 0.4));
      g.globalAlpha = k; g.fillStyle = css("--canvas"); g.fillRect(x0, top - 8, x1 - x0, H + 8);
      g.fillStyle = css("--ink"); g.font = `600 12.5px ${css("--font")}`; g.fillText(LABEL[r.kind][0], x0 + 4, 14 + (1 - k) * 6);
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

  // ---------- playback: 12 band-limited noise voices following the measured band levels ----------
  let nodes = [];
  function stop() { nodes.forEach(n => { try { n.stop(); } catch (e) { /* already stopped */ } }); nodes = []; }
  function play(starts) {
    stop();
    const ctx = window.SFX && window.SFX.ctx; if (!ctx || !F) return false;
    const out = window.SFX.out, t0 = ctx.currentTime + 0.05, gain = starts.length > 1 ? 0.75 : 1;
    const len = ctx.sampleRate * (W + 0.5), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    starts.forEach(st => {
      const f0 = Math.round(st * BF);
      for (let b = 0; b < F.nb; b++) {
        const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = buf; bp.type = "bandpass"; bp.frequency.value = F.hz[b]; bp.Q.value = 2.2;
        g.gain.setValueAtTime(0, t0);
        for (let i = 0; i < W * BF; i++) { const v = band(f0 + i, b); const a = Math.pow(10, ((v / 255) * 104 - 104) / 20) * 6 * gain; g.gain.linearRampToValueAtTime(Math.min(0.5, a), t0 + i / BF); }
        g.gain.linearRampToValueAtTime(0, t0 + W + 0.05);
        src.connect(bp).connect(g).connect(out); src.start(t0); src.stop(t0 + W + 0.1); nodes.push(src);
      }
    });
    return true;
  }

  window.COMPARE = { W, PRE, BF, load, compare, hear, draw, play, stop };
})();
