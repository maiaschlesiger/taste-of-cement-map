/* Interface sounds from UI SFX (https://github.com/romainsimon/uisfx — MIT code, CC0 audio),
   vendored in js/vendor/uisfx.js. Sounds are synthesized in the browser; nothing is downloaded.
   Pick one of 12 sound packs, then a cue for each event. */
(() => {
  "use strict";
  const KEY = "toc-sfx2";
  const LIB = new URL("vendor/uisfx.js", document.currentScript.src).href;
  const PACKS = [["minimal", "Minimal"], ["soft", "Soft"], ["glass", "Glass"], ["arcade", "Arcade"], ["mechanical", "Mechanical"], ["organic", "Organic"],
                 ["dreamy", "Dreamy"], ["scifi", "Sci-fi"], ["rubber", "Rubber"], ["cinematic", "Cinematic"], ["studio", "Studio"], ["zen", "Zen"]];
  const EVENTS = {
    click: { label: "Choose a pair", opts: ["select", "press", "check", "Off"], def: "select" },
    hover: { label: "Hover a pair", opts: ["hover", "focus", "Off"], def: "hover" },
    play:  { label: "Play a sound", opts: ["play", "start", "Off"], def: "play" },
    menu:  { label: "Open a menu", opts: ["expand", "open", "Off"], def: "expand" },
  };
  let cfg = { pack: "soft", vol: 0.6, mute: false, ev: {} };
  try { cfg = Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* storage unavailable */ }
  for (const k in EVENTS) if (!EVENTS[k].opts.includes(cfg.ev[k])) cfg.ev[k] = EVENTS[k].def;
  if (!PACKS.some(p => p[0] === cfg.pack)) cfg.pack = "soft";
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ } };

  // one shared AudioContext for UI SFX and the film clips
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

  // ---------- public API ----------
  const loops = {};
  function cue(name) { if (!name || name === "Off" || cfg.mute) return null; return lib().then(u => (u ? u.play(name) : null)); }
  function play(ev, data) {
    const opt = cfg.ev[ev]; if (!opt || opt === "Off" || cfg.mute) return;
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
        <select data-ev="${k}" aria-label="${e.label} sound">${e.opts.map(o => `<option value="${o}"${o === cfg.ev[k] ? " selected" : ""}>${o === "Off" ? o : o.replace(/-/g, " ")}</option>`).join("")}</select>
        <button class="btn icon" data-try="${k}" aria-label="Try ${e.label} sound"><svg viewBox="0 0 16 16"><path d="M5 3.5v9l7-4.5Z" fill="currentColor"/></svg></button></div>`).join("") +
      `<p class="sfx-credit">Sounds: <a href="https://github.com/romainsimon/uisfx" target="_blank" rel="noopener">UI SFX</a> (CC0)</p>`;
    el.querySelector("#sfxOn").onchange = e => { cfg.mute = !e.target.checked; save(); ac(); if (ui) ui.setEnabled(!cfg.mute); updateIcon(); };
    el.querySelector("#sfxVol").oninput = e => { cfg.vol = +e.target.value; save(); if (master) master.gain.value = cfg.mute ? 0 : cfg.vol; if (ui) ui.setVolume(cfg.vol); };
    const tryPack = () => { const seq = ["select", "play", "expand"]; seq.forEach((c, i) => setTimeout(() => cue(c), i * 260)); };
    el.querySelector("#sfxPack").onchange = e => { cfg.pack = e.target.value; save(); lib().then(u => { if (u) { u.setPack(cfg.pack); tryPack(); } }); };
    el.querySelector("#sfxPackTry").onclick = tryPack;
    el.querySelectorAll("select[data-ev]").forEach(s => s.onchange = () => { cfg.ev[s.dataset.ev] = s.value; save(); preview(s.dataset.ev); });
    el.querySelectorAll("[data-try]").forEach(b => b.onclick = () => preview(b.dataset.try));
  }
  function preview(ev) {
    const opt = cfg.ev[ev]; if (opt === "Off") return;
    lib().then(u => { if (!u) return; const h = u.play(opt); if (h && h.stop && ["processing", "loading", "scanning"].includes(opt)) setTimeout(() => h.stop(), 1600); });
  }
  function updateIcon() { const w = document.getElementById("sfxWaves"); if (w) w.style.opacity = cfg.mute ? 0 : 1; }

  window.SFX = { play, startLoop, stopLoop, renderMenu, updateIcon, get ctx() { return ac(); }, get out() { ac(); return master; } };
  document.addEventListener("DOMContentLoaded", updateIcon);
})();
