/* Interface sounds, synthesized with Web Audio (no audio files).
   Every event has several presets plus Off; choices are kept in this browser. */
(() => {
  "use strict";
  let ctx = null, master = null;
  const KEY = "toc-sfx";
  const EVENTS = {
    click:     { label: "Click a dot", opts: ["Data voice", "Film snippet", "Soft tick", "Glass ping", "Wood knock", "Bubble pop", "Off"], def: "Data voice" },
    hover:     { label: "Hover a dot", opts: ["Off", "Faint tick", "Air", "Soft blip"], def: "Off" },
    pickup:    { label: "Pick up", opts: ["Lift", "Pluck", "Grab", "Off"], def: "Lift" },
    drop:      { label: "Drop in a circle", opts: ["Thud", "Chime", "Snap", "Clay", "Off"], def: "Chime" },
    highlight: { label: "Highlight a colour", opts: ["Shimmer", "Low swell", "Bell", "Off"], def: "Shimmer" },
    toggle:    { label: "Checkboxes", opts: ["Click", "Pop", "Tap", "Off"], def: "Tap" },
    compare:   { label: "Compare", opts: ["Rise", "Gong", "Two notes", "Off"], def: "Rise" },
    clear:     { label: "Clear a circle", opts: ["Pop out", "Tick down", "Off"], def: "Pop out" },
  };
  let cfg = { vol: 0.6, mute: false, ev: {} };
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* storage unavailable */ }
  for (const k in EVENTS) if (!EVENTS[k].opts.includes(cfg.ev[k])) cfg.ev[k] = EVENTS[k].def;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ } };

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      ctx = new C(); master = ctx.createGain(); master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    master.gain.value = cfg.mute ? 0 : cfg.vol;
    return ctx;
  }
  // ---------- primitives ----------
  function env(g, t, a, peak, d, end = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d); }
  function tone(type, f, t, a, d, peak, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, a, peak, d); o.connect(g).connect(master); o.start(t); o.stop(t + a + d + 0.05); return o;
  }
  let nbuf = null;
  function noise(t, a, d, peak, ftype, f, q = 1, f2) {
    if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const x = nbuf.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nbuf; fl.type = ftype; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d); fl.Q.value = q;
    env(g, t, a, peak, d); s.connect(fl).connect(g).connect(master); s.start(t); s.stop(t + a + d + 0.05);
  }
  function fm(fc, ratio, index, t, d, peak) {
    const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    c.frequency.value = fc; m.frequency.value = fc * ratio; mg.gain.setValueAtTime(fc * index, t); mg.gain.exponentialRampToValueAtTime(1, t + d);
    m.connect(mg).connect(c.frequency); env(g, t, 0.002, peak, d); c.connect(g).connect(master);
    c.start(t); m.start(t); c.stop(t + d + 0.05); m.stop(t + d + 0.05);
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- data voice: a short sound shaped by the dot's own measurements ----------
  function dataVoice(p, t) {
    const vol = clamp((p.loud + 70) / 55, 0.25, 1);
    const pitch = 140 + clamp(p.bright, 150, 4500) / 4500 * 900;
    const g = p.group;
    if (g === "tool") { fm(pitch * 1.6, 3.5, 2.2, t, 0.28, 0.32 * vol); noise(t, 0.001, 0.05, 0.12 * vol, "highpass", 3000); }
    else if (g === "engine") { tone("sawtooth", 48 + p.weight * 40, t, 0.03, 0.45, 0.12 * vol); noise(t, 0.04, 0.4, 0.08 * vol, "lowpass", 500); }
    else if (g === "bomb") { tone("sine", 70, t, 0.005, 0.7, 0.5 * vol, 32); noise(t, 0.004, 1.1, 0.35 * vol, "lowpass", 900, 0.7, 120); }
    else if (g === "both") { tone("sine", 65, t, 0.005, 0.6, 0.42 * vol, 34); fm(pitch * 1.4, 3.5, 1.5, t + 0.02, 0.25, 0.18 * vol); noise(t, 0.004, 0.7, 0.2 * vol, "lowpass", 700, 0.7, 150); }
    else { tone("sine", 220 + pitch / 3, t, 0.02, 0.22, 0.16 * vol); }
  }

  const SYN = {
    "Soft tick":  t => { tone("sine", 1800, t, 0.001, 0.04, 0.18); },
    "Glass ping": t => { fm(1320, 2.76, 1.2, t, 0.5, 0.2); },
    "Wood knock": t => { tone("triangle", 420, t, 0.001, 0.09, 0.35, 260); noise(t, 0.001, 0.03, 0.15, "bandpass", 1800, 3); },
    "Bubble pop": t => { tone("sine", 300, t, 0.002, 0.11, 0.3, 900); },
    "Faint tick": t => { tone("sine", 2600, t, 0.001, 0.02, 0.05); },
    "Air":        t => { noise(t, 0.01, 0.06, 0.05, "highpass", 4000); },
    "Soft blip":  t => { tone("sine", 880, t, 0.003, 0.05, 0.06); },
    "Lift":       t => { noise(t, 0.08, 0.18, 0.12, "bandpass", 500, 2, 3000); tone("sine", 330, t, 0.02, 0.2, 0.08, 660); },
    "Pluck":      t => { tone("triangle", 660, t, 0.001, 0.25, 0.25, 640); },
    "Grab":       t => { noise(t, 0.001, 0.04, 0.2, "bandpass", 1200, 4); tone("sine", 200, t, 0.001, 0.06, 0.2); },
    "Thud":       t => { tone("sine", 90, t, 0.003, 0.25, 0.5, 45); noise(t, 0.002, 0.08, 0.15, "lowpass", 600); },
    "Chime":      t => { fm(784, 3, 0.8, t, 0.7, 0.18); fm(1175, 3, 0.6, t + 0.07, 0.8, 0.12); },
    "Snap":       t => { noise(t, 0.001, 0.035, 0.4, "highpass", 2000); tone("square", 1400, t, 0.001, 0.02, 0.05); },
    "Clay":       t => { tone("sine", 150, t, 0.005, 0.18, 0.4, 90); noise(t, 0.005, 0.12, 0.12, "bandpass", 400, 1.5); },
    "Shimmer":    t => { [1047, 1319, 1568, 2093].forEach((f, i) => tone("sine", f, t + i * 0.035, 0.005, 0.35, 0.06)); },
    "Low swell":  t => { tone("sine", 110, t, 0.15, 0.35, 0.22, 165); },
    "Bell":       t => { fm(523, 1.4, 2.5, t, 1.1, 0.2); },
    "Click":      t => { noise(t, 0.0005, 0.015, 0.3, "highpass", 3500); },
    "Pop":        t => { tone("sine", 520, t, 0.002, 0.06, 0.25, 1040); },
    "Tap":        t => { tone("triangle", 1200, t, 0.001, 0.03, 0.15); },
    "Rise":       t => { tone("sine", 262, t, 0.03, 0.5, 0.16, 784); tone("sine", 392, t + 0.08, 0.03, 0.5, 0.1, 1175); noise(t, 0.2, 0.3, 0.06, "bandpass", 800, 1.5, 5000); },
    "Gong":       t => { fm(110, 1.41, 3, t, 2.2, 0.3); tone("sine", 55, t, 0.01, 1.8, 0.2); },
    "Two notes":  t => { tone("triangle", 523, t, 0.005, 0.16, 0.2); tone("triangle", 784, t + 0.14, 0.005, 0.3, 0.2); },
    "Pop out":    t => { tone("sine", 900, t, 0.002, 0.08, 0.2, 300); },
    "Tick down":  t => { tone("sine", 1400, t, 0.001, 0.03, 0.15); tone("sine", 900, t + 0.06, 0.001, 0.04, 0.12); },
  };

  let lastHover = 0;
  function play(ev, data) {
    const opt = cfg.ev[ev];
    if (!opt || opt === "Off" || cfg.mute) return;
    if (ev === "hover") { const n = performance.now(); if (n - lastHover < 70) return; lastHover = n; }
    if (opt === "Film snippet") { if (data && window.TOC && window.TOC.snippet && window.TOC.snippet(data.t)) return; }
    if (!ac()) return;
    const t = ctx.currentTime + 0.005;
    if (opt === "Data voice" || opt === "Film snippet") { if (data) dataVoice(data, t); else SYN["Soft tick"](t); return; }
    (SYN[opt] || (() => {}))(t);
  }
  function preview(ev, opt) {
    const keep = cfg.ev[ev]; cfg.ev[ev] = opt;
    play(ev, { group: "bomb", loud: -20, bright: 600, weight: 0.8, t: 0 });
    cfg.ev[ev] = keep;
  }

  // ---------- settings menu ----------
  function renderMenu(el) {
    el.innerHTML = `<div class="sfx-row top"><label class="chk"><input type="checkbox" id="sfxOn" ${cfg.mute ? "" : "checked"}> Sound on</label>
      <input type="range" id="sfxVol" min="0" max="1" step="0.01" value="${cfg.vol}" aria-label="Volume"></div>` +
      Object.entries(EVENTS).map(([k, e]) => `<div class="sfx-row"><span>${e.label}</span>
        <select data-ev="${k}" aria-label="${e.label} sound">${e.opts.map(o => `<option${o === cfg.ev[k] ? " selected" : ""}>${o}</option>`).join("")}</select>
        <button class="btn icon" data-try="${k}" aria-label="Try ${e.label} sound"><svg viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5Z" fill="currentColor"/></svg></button></div>`).join("");
    el.querySelector("#sfxOn").onchange = e => { cfg.mute = !e.target.checked; save(); ac(); updateIcon(); };
    el.querySelector("#sfxVol").oninput = e => { cfg.vol = +e.target.value; save(); if (master) master.gain.value = cfg.mute ? 0 : cfg.vol; };
    el.querySelectorAll("select[data-ev]").forEach(s => s.onchange = () => { cfg.ev[s.dataset.ev] = s.value; save(); preview(s.dataset.ev, s.value); });
    el.querySelectorAll("[data-try]").forEach(b => b.onclick = () => preview(b.dataset.try, cfg.ev[b.dataset.try]));
  }
  function updateIcon() { const w = document.getElementById("sfxWaves"); if (w) w.style.opacity = cfg.mute ? 0 : 1; }

  window.SFX = { play, renderMenu, ac: () => ac(), get ctx() { return ac(); }, get out() { ac(); return master; }, updateIcon };
  document.addEventListener("DOMContentLoaded", updateIcon);
})();
