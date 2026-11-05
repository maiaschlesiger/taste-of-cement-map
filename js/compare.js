/* Comparison page: two sounds overlapped, lined up where they are most alike, with labels on the overlap.
   Uses data/fine.json (50 fps loudness envelope, 20 fps 12-band spectrum). Plays the viewer's own film file
   when loaded, otherwise a rough sketch rebuilt from the measurements. */
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const W = 6, PRE = 2, LAGMAX = 2;           // window length, seconds before the chosen moment, max shift (s)
  const BF = 20, EF = 50;                      // band and envelope frame rates
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let F = null, loading = null, meanBand = null;
  let cur = null;                              // current comparison
  const BANDS = [[0, 3, "bass"], [4, 7, "body"], [8, 11, "edge"]];
  const LABEL = {
    bass: ["Same deep thud", "Felt in the chest alike"],
    body: ["Same body", "Same weight and texture"],
    edge: ["Same sharp edge", "Same metallic crack"],
    hits: ["Hits land together", "Same attack, hard to tell apart"],
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

  // ---------- similarity ----------
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
  function analyse(a0, b0, lag) {
    const n = W * BF, sims = [];
    let sum = 0, k = 0;
    for (let i = 0; i < n; i++) { const r = frameSim(a0 + i, b0 + lag + i); sims.push(r.active ? r.s : null); if (r.active) { sum += r.s; k++; } }
    const ws = windowStats(a0, b0 + lag);
    const raw = 0.5 * (ws.tim + 1) / 2 + 0.3 * (Math.max(-1, ws.corr) + 1) / 2 + 0.2 * ws.lvl;
    const score = Math.round(100 * Math.max(0, Math.min(1, (raw - 0.2) / 0.7)));
    // smoothed similarity and overlap regions
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
    const top = regs.slice(0, 3).map(r => ({ ...r, kind: regionKind(a0, b0 + lag, r) })).sort((x, y) => x.a - y.a);
    // spectrum profiles over active frames
    const prof = off => { const p = new Float32Array(F.nb); let c = 0; for (let i = 0; i < n; i++) { if (sims[i] == null) continue; for (let b = 0; b < F.nb; b++) p[b] += band(off + i, b); c++; } for (let b = 0; b < F.nb; b++) p[b] /= c || 1; return p; };
    const pa = prof(a0), pb = prof(b0 + lag);
    return { score, sims: sm, regs: score >= 30 ? top : [], pa, pb };
  }
  function regionKind(fa, fb, r) {
    // hits that start together?
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

  // ---------- words (kept short) ----------
  function verdict(A, B, r) {
    const fam = g => (g === "tool" || g === "engine" ? "build" : g === "bomb" || g === "both" ? "bomb" : "env");
    const fa = fam(A.g), fb = fam(B.g), s = r.score;
    const top = r.regs.length ? LABEL[r.regs[0].kind][0].toLowerCase() : "little";
    const centroid = p => { let a = 0, w = 0; for (let b = 0; b < p.length; b++) { const e = Math.pow(10, p[b] / 60); a += e * b; w += e; } return a / w; };
    const darker = centroid(r.pa) < centroid(r.pb) ? A : B;
    if ((fa === "build" && fb === "bomb") || (fa === "bomb" && fb === "build")) {
      if (s >= 65) return "Building and bombing, nearly the same sound";
      if (s >= 45) return `Partly alike: ${top}`;
      return `Different here: ${darker.label.toLowerCase()} is more muffled`;
    }
    if (s >= 65) return "A close match";
    if (s >= 45) return `Alike in parts: ${top}`;
    return "Mostly different";
  }

  // ---------- drawing ----------
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  function sizeCanvas(c) { if (!c.dataset.h) c.dataset.h = c.getAttribute("height"); const w = c.parentElement.clientWidth, h = +c.dataset.h; if (!w) return { g: c.getContext("2d"), w: 1, h }; c.width = w * dpr(); c.height = h * dpr(); c.style.height = h + "px"; const g = c.getContext("2d"); g.setTransform(dpr(), 0, 0, dpr(), 0, 0); return { g, w, h }; }
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function drawWave(progress, shift, playT) {
    const c = $("#cmpWave"), { g, w, h } = sizeCanvas(c);
    const { A, B, a0, b0, lag, res } = cur;
    const padL = 76, padR = 16, top = 46, bot = 28, mid = top + (h - top - bot) / 2, amp = (h - top - bot) / 2;
    const X = s => padL + s / W * (w - padL - padR);
    g.clearRect(0, 0, w, h);
    g.font = `12px ${css("--font")}`; g.textBaseline = "middle";
    // overlap regions with labels
    res.regs.forEach((r, i) => {
      const x0 = X(r.a / BF), x1 = X(r.b / BF), k = Math.min(1, Math.max(0, progress * 3 - i * 0.4));
      g.globalAlpha = k; g.fillStyle = css("--canvas"); g.fillRect(x0, top - 6, x1 - x0, h - top - bot + 12);
      const [t1, t2] = LABEL[r.kind];
      g.fillStyle = css("--ink"); g.font = `600 12.5px ${css("--font")}`; g.fillText(t1, x0 + 2, 12 + (1 - k) * 6);
      g.fillStyle = css("--mute"); g.font = `12px ${css("--font")}`; g.fillText(t2, x0 + 2, 28 + (1 - k) * 6);
      g.globalAlpha = 1;
    });
    // centre line + seconds
    g.strokeStyle = css("--line"); g.lineWidth = 1; g.beginPath(); g.moveTo(padL, mid); g.lineTo(w - padR, mid); g.stroke();
    g.fillStyle = css("--mute"); g.textAlign = "center";
    for (let s = 0; s <= W; s++) g.fillText(`${s} s`, X(s), h - 10);
    g.textAlign = "left";
    // envelopes, mirrored: each sound's extra in its own colour, the shared part in ink
    const N = Math.floor(W * EF * progress);
    const va = i => Math.max(0, envAt(a0 / BF + i / EF) - 60) / 195, vb = i => Math.max(0, envAt((b0 + lag * shift) / BF + i / EF) - 60) / 195;
    const band2 = (f, color, alpha) => {
      g.fillStyle = color; g.globalAlpha = alpha; g.beginPath(); g.moveTo(X(0), mid);
      for (let i = 0; i <= N; i++) g.lineTo(X(i / EF), mid - f(i) * amp);
      for (let i = N; i >= 0; i--) g.lineTo(X(i / EF), mid + f(i) * amp);
      g.closePath(); g.fill(); g.globalAlpha = 1;
    };
    band2(va, A.color, 0.9); band2(vb, B.color, 0.9);
    band2(i => Math.min(va(i), vb(i)), css("--ink"), 1);
    // legend
    [[A.color, "A"], [B.color, "B"], [css("--ink"), "Shared"]].forEach(([col, s], i) => { g.fillStyle = col; g.beginPath(); g.arc(14, mid - 28 + i * 28, 6, 0, 7); g.fill(); g.fillStyle = css("--ink"); g.font = `600 12px ${css("--font")}`; g.fillText(s, 24, mid - 28 + i * 28); });
    if (playT != null) { g.strokeStyle = css("--ink"); g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(playT), top - 8); g.lineTo(X(playT), h - bot + 4); g.stroke(); }
  }
  // ---------- short description ----------
  function describe(A, B, r) {
    const fmt = window.TOC.fmt, when = it => it.n > 1 ? `${it.n} seconds around ${fmt(it.rep)}` : fmt(it.rep);
    const fam = g => (g === "tool" || g === "engine" ? "build" : g === "bomb" || g === "both" ? "bomb" : "env");
    const fa = fam(A.g), fb = fam(B.g), s = r.score;
    let out = `${A.label} (${when(A)}) and ${B.label.toLowerCase()} (${when(B)}) overlap by ${s}% once lined up.`;
    if (r.regs.length) {
      const g = r.regs[0], [t1, t2] = LABEL[g.kind];
      out += ` They match most from ${(g.a / BF).toFixed(1)} to ${(g.b / BF).toFixed(1)} s: ${t1.toLowerCase()}, ${t2.toLowerCase()}.`;
    }
    if ((fa === "build" && fb === "bomb") || (fa === "bomb" && fb === "build")) {
      out += s >= 65 ? " Here the sound of building carries the sound of the war."
        : s >= 45 ? " Part of the work still echoes the war."
        : " Here the two worlds stay apart.";
    } else if (fa === fb && fa !== "env") out += " Two moments from the same sound-world, heard side by side.";
    return out;
  }

  function animate(dur, fn, done) {
    if (reduce || dur <= 0) { fn(1); if (done) done(); return; }
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / dur); fn(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  }
  function countUp(to) {
    const ring = $("#cmpRing"), C = 2 * Math.PI * 52;
    ring.style.strokeDasharray = C;
    animate(900, k => { $("#cmpPct").textContent = Math.round(to * k) + "%"; ring.style.strokeDashoffset = C * (1 - to / 100 * k); });
  }

  // ---------- playback ----------
  let players = [], playRAF = 0, sketchNodes = [];
  function stop() {
    players.forEach(p => { p.pause(); }); cancelAnimationFrame(playRAF);
    sketchNodes.forEach(n => { try { n.stop(); } catch (e) { /* already stopped */ } }); sketchNodes = [];
    if (cur) drawWave(1, cur.shift, null);
  }
  function mixGains() { return [0.75, 0.75]; }
  function play(which) {
    stop();
    const media = window.TOC && window.TOC.media();
    const [ga, gb] = mixGains();
    const startA = cur.a0 / BF, startB = (cur.b0 + cur.lag * cur.shift) / BF;
    const want = which === "both" ? [["A", startA, ga], ["B", startB, gb]] : which === "A" ? [["A", startA, 1]] : [["B", startB, 1]];
    if (window.TOC) window.TOC.pauseMain();
    let t0 = null;
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      drawWave(1, cur.shift, Math.min(W, t));
      if (t < W) playRAF = requestAnimationFrame(tick); else stop();
    };
    if (media) {
      while (players.length < 2) { const a = new Audio(); a.preload = "auto"; players.push(a); }
      const ps = want.map(([, st, gain], i) => new Promise(res => {
        const a = players[i]; if (a.src !== media.src) a.src = media.src;
        a.volume = Math.max(0, Math.min(1, gain)); a.currentTime = st;
        const go = () => { a.removeEventListener("seeked", go); res(a); };
        a.addEventListener("seeked", go); setTimeout(go, 1500);
      }));
      Promise.all(ps).then(as => { as.forEach(a => a.play()); t0 = performance.now(); tick(); setTimeout(() => as.forEach(a => a.pause()), W * 1000); });
    } else {
      sketch(want); t0 = performance.now(); tick();
    }
  }
  // rough sketch: 12 band-limited noise voices following the measured band levels
  function sketch(want) {
    const ctx = window.SFX && window.SFX.ctx; if (!ctx) return;
    const out = window.SFX.out, t0 = ctx.currentTime + 0.05;
    const len = ctx.sampleRate * (W + 0.5), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    want.forEach(([, st, gain]) => {
      const f0 = Math.round(st * BF);
      for (let b = 0; b < F.nb; b++) {
        const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = buf; bp.type = "bandpass"; bp.frequency.value = F.hz[b]; bp.Q.value = 2.2;
        g.gain.setValueAtTime(0, t0);
        for (let i = 0; i < W * BF; i++) { const v = band(f0 + i, b); const amp = Math.pow(10, ((v / 255) * 104 - 66 - 38) / 20) * 6 * gain; g.gain.linearRampToValueAtTime(Math.min(0.5, amp), t0 + i / BF); }
        g.gain.linearRampToValueAtTime(0, t0 + W + 0.05);
        src.connect(bp).connect(g).connect(out); src.start(t0); src.stop(t0 + W + 0.1); sketchNodes.push(src);
      }
    });
  }


  // ---------- open ----------
  function chip(it, s) { return `<span class="chip-pill" style="--c:${it.color}"><i></i><b>${s}</b> ${it.label} · ${it.n > 1 ? it.n + " s" : window.TOC.fmt(it.rep)}</span>`; }
  function open(A, B) {
    if (A.color === B.color) B = { ...B, color: getComputedStyle(document.documentElement).getPropertyValue("--c-maroon").trim() || "#932a10" };
    window.TOC.showTab("compare");
    const pane = $("#pane-compare"); pane.classList.remove("enter"); void pane.offsetWidth; pane.classList.add("enter");
    $("#cmpChips").innerHTML = chip(A, "A") + `<span class="vs-word">vs</span>` + chip(B, "B");
    $("#cmpTitle").textContent = `${A.label} vs ${B.label}`;
    $("#cmpSay").textContent = "Lining them up…"; $("#cmpPct").textContent = "0%"; $("#cmpDesc").textContent = "";
    if (window.SFX) window.SFX.startLoop("working");
    load().then(() => {
      if (window.SFX) { window.SFX.stopLoop("working"); setTimeout(() => window.SFX.play("done"), 380); }
      const a0 = Math.round((A.rep - PRE) * BF), b0 = Math.round((B.rep - PRE) * BF);
      const lag = align(a0, b0);
      const res = analyse(a0, b0, lag);
      cur = { A, B, a0, b0, lag, res, shift: 0 };
      $("#cmpAlign").checked = true;
      $("#cmpShift").textContent = lag ? `B moved ${(Math.abs(lag) / BF).toFixed(2)} s ${lag > 0 ? "earlier" : "later"}` : "already lined up";
      $("#cmpSay").textContent = verdict(A, B, res);
      countUp(res.score);
      animate(800, k => drawWave(k, 0, null), () => animate(600, k => { cur.shift = k; drawWave(1, k, null); }));
      $("#cmpDesc").textContent = describe(A, B, res);
    });
  }

  function setup() {
    const sfx = e => { if (window.SFX) window.SFX.play(e); };
    $("#cmpBack").onclick = () => { stop(); sfx("back"); window.TOC.showTab("space"); };
    $("#cmpPlayBoth").onclick = () => { sfx("play"); setTimeout(() => play("both"), 120); };
    $("#cmpPlayA").onclick = () => { sfx("play"); setTimeout(() => play("A"), 120); };
    $("#cmpPlayB").onclick = () => { sfx("play"); setTimeout(() => play("B"), 120); };
    $("#cmpAlign").onchange = e => {
      if (!cur) return; const from = cur.shift, to = e.target.checked ? 1 : 0;
      animate(500, k => { cur.shift = from + (to - from) * k; drawWave(1, cur.shift, null); });
    };
    window.addEventListener("resize", () => { if (cur && $("#pane-compare").classList.contains("on")) drawWave(1, cur.shift, null); });
  }
  window.COMPARE = { open, _test: { load, align, analyse, get F() { return F; } } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup); else setup();
})();
