/* Interface sounds from UI SFX (https://github.com/romainsimon/uisfx — MIT code, CC0 audio),
   vendored in js/vendor/uisfx.js. Sounds are synthesized in the browser; nothing is downloaded.
   Pick one of 12 sound packs, then a cue for each event. "Data voice" (click) is this site's own
   sonification of the dot you clicked. */
(() => {
  "use strict";
  const KEY = "toc-sfx2";
  const LIB = new URL("vendor/uisfx.js", document.currentScript.src).href;
  const PACKS = [["minimal", "Minimal"], ["soft", "Soft"], ["glass", "Glass"], ["arcade", "Arcade"], ["mechanical", "Mechanical"], ["organic", "Organic"],
                 ["dreamy", "Dreamy"], ["scifi", "Sci-fi"], ["rubber", "Rubber"], ["cinematic", "Cinematic"], ["studio", "Studio"], ["zen", "Zen"]];
  const EVENTS = {
    click:     { label: "Click a dot", opts: ["select", "press", "double-click", "check", "Data voice", "Off"], def: "select" },
    hover:     { label: "Hover a dot", opts: ["hover", "focus", "Off"], def: "hover" },
    pickup:    { label: "Pick up", opts: ["drag-start", "long-press", "press", "Off"], def: "drag-start" },
    drop:      { label: "Drop in a circle", opts: ["drop", "snap", "check", "add-to-cart", "Off"], def: "drop" },
    miss:      { label: "Drop outside", opts: ["invalid-drop", "cancel", "release", "Off"], def: "invalid-drop" },
    highlight: { label: "Highlight a colour", opts: ["focus", "toggle-on", "select", "badge", "Off"], def: "focus" },
    toggle:    { label: "Checkboxes and pills", opts: ["toggle-on", "check", "press", "select", "Off"], def: "toggle-on" },
    compare:   { label: "Compare sounds", opts: ["open", "start", "level-up", "achievement", "Off"], def: "open" },
    working:   { label: "While comparing", opts: ["processing", "loading", "scanning", "Off"], def: "processing" },
    done:      { label: "Comparison ready", opts: ["complete", "success", "reward", "Off"], def: "complete" },
    play:      { label: "Play audio", opts: ["play", "start", "Off"], def: "play" },
    back:      { label: "Back to map", opts: ["back", "close", "Off"], def: "back" },
    clear:     { label: "Clear a circle", opts: ["delete", "remove-from-cart", "undo", "Off"], def: "remove-from-cart" },
    menu:      { label: "Open a menu", opts: ["expand", "open", "Off"], def: "expand" },
  };
  let cfg = { pack: "soft", vol: 0.6, mute: false, ev: {} };
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* storage unavailable */ }
  for (const k in EVENTS) if (!EVENTS[k].opts.includes(cfg.ev[k])) cfg.ev[k] = EVENTS[k].def;
  if (!PACKS.some(p => p[0] === cfg.pack)) cfg.pack = "soft";
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ } };

  // one shared AudioContext for UI SFX, the data voice, and the comparison sketch
  let ctx = null, master = null, ui = null, uiLoading = null;
  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      ctx = new C(); master = ctx.createGain(); master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    master.gain.value = cfg.mute ? 0 : cfg.vol;
    return ctx;
  }
  function lib() {
    if (ui) return Promise.resolve(ui);
    if (!uiLoading) uiLoading = import(LIB).then(m => {
      ui = m.createUISFX({ pack: cfg.pack, volume: cfg.vol, enabled: !cfg.mute, context: ac() || undefined });
      return ui.unlock().then(() => ui);
    }).catch(() => null);
    return uiLoading;
  }
  // unlock on the first trusted gesture (browsers block audio before that)
  const first = () => { ac(); lib(); window.removeEventListener("pointerdown", first, true); window.removeEventListener("keydown", first, true); };
  window.addEventListener("pointerdown", first, true); window.addEventListener("keydown", first, true);

  // ---------- data voice: a short sound shaped by the dot's own measurements ----------
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(type, f, t, a, d, peak, f2) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d); env(g, t, a, peak, d); o.connect(g).connect(master); o.start(t); o.stop(t + a + d + 0.05); }
  let nbuf = null;
  function noise(t, a, d, peak, type, f, f2) {
    if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const x = nbuf.getChannelData(0); for (let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = nbuf; fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, a, peak, d); s.connect(fl).connect(g).connect(master); s.start(t); s.stop(t + a + d + 0.05);
  }
  function fm(fc, ratio, index, t, d, peak) {
    const c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    c.frequency.value = fc; m.frequency.value = fc * ratio; mg.gain.setValueAtTime(fc * index, t); mg.gain.exponentialRampToValueAtTime(1, t + d);
    m.connect(mg).connect(c.frequency); env(g, t, 0.002, peak, d); c.connect(g).connect(master); c.start(t); m.start(t); c.stop(t + d + 0.05); m.stop(t + d + 0.05);
  }
  function dataVoice(p) {
    if (!ac()) return;
    const t = ctx.currentTime + 0.005, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const vol = clamp((p.loud + 70) / 55, 0.25, 1), pitch = 140 + clamp(p.bright || 600, 150, 4500) / 4500 * 900, g = p.group;
    if (g === "tool") { fm(pitch * 1.6, 3.5, 2.2, t, 0.28, 0.32 * vol); noise(t, 0.001, 0.05, 0.12 * vol, "highpass", 3000); }
    else if (g === "engine") { tone("sawtooth", 48 + (p.weight || 0.5) * 40, t, 0.03, 0.45, 0.12 * vol); noise(t, 0.04, 0.4, 0.08 * vol, "lowpass", 500); }
    else if (g === "bomb") { tone("sine", 70, t, 0.005, 0.7, 0.5 * vol, 32); noise(t, 0.004, 1.1, 0.35 * vol, "lowpass", 900, 120); }
    else if (g === "both") { tone("sine", 65, t, 0.005, 0.6, 0.42 * vol, 34); fm(pitch * 1.4, 3.5, 1.5, t + 0.02, 0.25, 0.18 * vol); noise(t, 0.004, 0.7, 0.2 * vol, "lowpass", 700, 150); }
    else tone("sine", 220 + pitch / 3, t, 0.02, 0.22, 0.16 * vol);
  }

  // ---------- public API ----------
  const loops = {};
  function cue(name) { if (!name || name === "Off" || cfg.mute) return null; return lib().then(u => (u ? u.play(name) : null)); }
  function play(ev, data) {
    const opt = cfg.ev[ev]; if (!opt || opt === "Off" || cfg.mute) return;
    if (opt === "Data voice") { dataVoice(data || { group: "other", loud: -30 }); return; }
    if (ev === "toggle" && data === false) { cue(opt === "toggle-on" ? "toggle-off" : opt === "check" ? "uncheck" : opt); return; }
    cue(opt);
  }
  function startLoop(ev) {
    stopLoop(ev);
    const p = cue(cfg.ev[ev]);
    if (p) loops[ev] = p;
  }
  function stopLoop(ev) { const p = loops[ev]; delete loops[ev]; if (p) p.then(h => h && h.stop && h.stop()); }

  function renderMenu(el) {
    el.innerHTML = `<div class="sfx-row top"><label class="chk"><input type="checkbox" id="sfxOn" ${cfg.mute ? "" : "checked"}> Sound on</label>
        <input type="range" id="sfxVol" min="0" max="1" step="0.01" value="${cfg.vol}" aria-label="Volume"></div>
      <div class="sfx-row pack"><span>Sound pack</span><select id="sfxPack" aria-label="Sound pack">${PACKS.map(([v, l]) => `<option value="${v}"${v === cfg.pack ? " selected" : ""}>${l}</option>`).join("")}</select>
        <button class="btn icon" id="sfxPackTry" aria-label="Try this pack"><svg viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5Z" fill="currentColor"/></svg></button></div>` +
      Object.entries(EVENTS).map(([k, e]) => `<div class="sfx-row"><span>${e.label}</span>
        <select data-ev="${k}" aria-label="${e.label} sound">${e.opts.map(o => `<option value="${o}"${o === cfg.ev[k] ? " selected" : ""}>${o === "Off" || o === "Data voice" ? o : o.replace(/-/g, " ")}</option>`).join("")}</select>
        <button class="btn icon" data-try="${k}" aria-label="Try ${e.label} sound"><svg viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5Z" fill="currentColor"/></svg></button></div>`).join("") +
      `<p class="sfx-credit">Sounds: <a href="https://github.com/romainsimon/uisfx" target="_blank" rel="noopener">UI SFX</a> (CC0)</p>`;
    el.querySelector("#sfxOn").onchange = e => { cfg.mute = !e.target.checked; save(); ac(); if (ui) ui.setEnabled(!cfg.mute); updateIcon(); };
    el.querySelector("#sfxVol").oninput = e => { cfg.vol = +e.target.value; save(); if (master) master.gain.value = cfg.mute ? 0 : cfg.vol; if (ui) ui.setVolume(cfg.vol); };
    const tryPack = () => { const seq = ["select", "drop", "complete"]; seq.forEach((c, i) => setTimeout(() => cue(c), i * 260)); };
    el.querySelector("#sfxPack").onchange = e => { cfg.pack = e.target.value; save(); lib().then(u => { if (u) { u.setPack(cfg.pack); tryPack(); } }); };
    el.querySelector("#sfxPackTry").onclick = tryPack;
    el.querySelectorAll("select[data-ev]").forEach(s => s.onchange = () => { cfg.ev[s.dataset.ev] = s.value; save(); preview(s.dataset.ev); });
    el.querySelectorAll("[data-try]").forEach(b => b.onclick = () => preview(b.dataset.try));
  }
  function preview(ev) {
    const opt = cfg.ev[ev]; if (opt === "Off") return;
    if (opt === "Data voice") { dataVoice({ group: "bomb", loud: -20, bright: 600, weight: 0.8 }); return; }
    lib().then(u => { if (!u) return; const h = u.play(opt); if (h && h.stop && ["processing", "loading", "scanning"].includes(opt)) setTimeout(() => h.stop(), 1600); });
  }
  function updateIcon() { const w = document.getElementById("sfxWaves"); if (w) w.style.opacity = cfg.mute ? 0 : 1; }

  window.SFX = { play, startLoop, stopLoop, renderMenu, updateIcon, get ctx() { return ac(); }, get out() { ac(); return master; } };
  document.addEventListener("DOMContentLoaded", updateIcon);
})();
