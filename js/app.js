/* Sound map of Taste of Cement — interactive viewer.
   Data: data/data.json (per-second points, rhymes, regions), impacts.json, cuts.json, places.json */
(() => {
  "use strict";

  // ---------------- palette & live tokens ----------------
  const C = { blue: "#1f63ad", lblue: "#8fb8e3", orange: "#ff6a1f", pink: "#ff85b8", yellow: "#fbbf00", maroon: "#932a10",
              green: "#3a7d3e", olive: "#9b9a00", cream: "#e6d6c4", grey: "#c4bcb2", ink: "#1d1b19", mute: "#7a736b" };
  const root = document.documentElement;
  const tok = (n, d) => { const v = getComputedStyle(root).getPropertyValue(n).trim(); return v || d; };
  const num = (n, d) => { const v = parseFloat(tok(n, "")); return isNaN(v) ? d : v; };
  let TH = {}, LIGHT = {};
  const light = () => ({ paper_bgcolor: LIGHT.paper_bgcolor, plot_bgcolor: LIGHT.plot_bgcolor, font: { ...LIGHT.font } });
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // sound groups: two building groups, bombs, both, and six environmental groups
  const G = {
    tool:    { c: "#1f63ad", label: "Tools and metal", fam: "build" },
    engine:  { c: "#8fb8e3", label: "Engines and machines", fam: "build" },
    bomb:    { c: "#ff6a1f", label: "Bombs", fam: "bomb" },
    both:    { c: "#ff85b8", label: "Heard as both", fam: "both" },
    voice:   { c: "#5f6b7a", label: "Voices", fam: "env" },
    music:   { c: "#7b8697", label: "Music", fam: "env" },
    water:   { c: "#98a2b1", label: "Water and sea", fam: "env" },
    air:     { c: "#b3bbc7", label: "Wind and noise", fam: "env" },
    silence: { c: "#e0e4ea", label: "Silence", fam: "env" },
    ambient: { c: "#c9cfd8", label: "Other ambience", fam: "env" },
  };
  // sub-types shown as nested checkboxes
  const KIND_OF_LABEL = {
    "Hammer": "Hammering and drilling", "Jackhammer": "Hammering and drilling", "Tools": "Hammering and drilling", "Power tool": "Hammering and drilling",
    "Drill": "Hammering and drilling", "Sawing": "Hammering and drilling", "Filing (rasp)": "Hammering and drilling", "Sanding": "Hammering and drilling",
    "Clang": "Metal and clatter", "Clatter": "Metal and clatter", "Chink, clink": "Metal and clatter", "Glass": "Metal and clatter", "Mechanisms": "Metal and clatter", "Ratchet, pawl": "Metal and clatter",
    "Engine": "Engines", "Heavy engine (low frequency)": "Engines", "Idling": "Engines", "Medium engine (mid frequency)": "Engines", "Mechanical fan": "Engines", "Steam": "Engines", "Hiss": "Engines",
    "Vehicle": "Vehicles", "Truck": "Vehicles", "Air brake": "Vehicles", "Motor vehicle (road)": "Vehicles", "Car": "Vehicles", "Bus": "Vehicles", "Rail transport": "Vehicles", "Train": "Vehicles", "Railroad car, train wagon": "Vehicles",
    "Rumble": "Rumble",
    "Explosion": "Explosions", "Eruption": "Explosions", "Burst, pop": "Explosions", "Bang": "Explosions", "Boom": "Booms",
    "Gunshot, gunfire": "Gunfire", "Machine gun": "Gunfire", "Artillery fire": "Gunfire", "Fusillade": "Gunfire", "Cap gun": "Gunfire", "Fireworks": "Gunfire", "Firecracker": "Gunfire",
    "Thunder": "Thunder", "Thunderstorm": "Thunder",
  };
  const FACETS = {
    build: { label: "Construction sounds", kinds: ["Hammering and drilling", "Metal and clatter", "Engines", "Vehicles", "Rumble"] },
    bomb:  { label: "Bomb sounds", kinds: ["Explosions", "Booms", "Gunfire", "Thunder"] },
    both:  { label: "Heard as both", kinds: [] },
    env:   { label: "Environment", kinds: ["voice", "music", "water", "air", "silence", "ambient"] },
  };

  function refreshTheme() {
    C.blue = tok("--c-tool", C.blue); C.lblue = tok("--c-engine", C.lblue); C.orange = tok("--c-bomb", C.orange); C.pink = tok("--c-both", C.pink);
    C.cream = tok("--c-other", C.cream); C.maroon = tok("--c-maroon", C.maroon); C.green = tok("--c-green", C.green);
    C.ink = tok("--ink", C.ink); C.mute = tok("--mute", C.mute);
    G.tool.c = C.blue; G.engine.c = C.lblue; G.bomb.c = C.orange; G.both.c = C.pink; G.silence.c = C.cream;
    G.voice.c = tok("--c-voice", G.voice.c); G.music.c = tok("--c-music", G.music.c); G.water.c = tok("--c-water", G.water.c);
    G.air.c = tok("--c-wind", G.air.c); G.ambient.c = tok("--c-ambient", G.ambient.c);
    TH = { card: tok("--card", "#fff"), grid: tok("--grid", "#ececef"), line: tok("--line", "#e8e8eb"),
           font: tok("--font", "sans-serif").replace(/"/g, ""), dot: num("--dot-scale", 1), dotOp: num("--dot-op", 1), envOp: num("--other-op", 1),
           rim: num("--dot-rim", 0.6), noteA: num("--note-a", 1), bubble: num("--bubble-k", 1), dim: num("--dim-op", 0.12),
           anim: reduceMotion ? 0 : num("--anim-ms", 320), spin: num("--spin", 0.5) };
    FAM.machine.c = C.blue; FAM.war.c = C.orange; FAM.voice.c = G.voice.c; FAM.music.c = G.music.c; FAM.water.c = G.water.c;
    FAM.silence.c = C.cream; FAM.air.c = G.air.c; FAM.ambient.c = G.ambient.c;
    READ.war.c = C.orange; READ.machine.c = C.blue; READ.both.c = C.pink;
    LIGHT = { paper_bgcolor: TH.card, plot_bgcolor: TH.card, font: { color: C.ink, family: TH.font, size: 12 } };
  }

  const FAM = {
    machine: { c: C.blue,   label: "Machines and tools" },
    war:     { c: C.orange, label: "Bombs" },
    voice:   { c: C.yellow, label: "Voices" },
    music:   { c: C.maroon, label: "Music" },
    water:   { c: C.green,  label: "Water" },
    silence: { c: C.cream,  label: "Silence" },
    air:     { c: C.olive,  label: "Wind and noise" },
    ambient: { c: C.grey,   label: "Ambience" },
    media:   { c: C.grey,   label: "TV and radio" },
  };
  const READ = {
    war:     { c: C.orange, label: "Heard as a bomb" },
    machine: { c: C.blue,   label: "Heard as a machine" },
    both:    { c: C.pink,   label: "Heard as both" },
    unclear: { c: C.grey,   label: "Neither" },
  };

  const pct = v => Math.round(v * 100) + "%";
  const AX = {
    weight:   { l: "Heaviness", t: "Heaviness: light → heavy", f: p => p.weight, lo: "light", hi: "heavy, felt in the chest", v: p => pct(p.weight) + " of its energy is deep bass",
                d: "Share of deep bass, the part you feel in your chest. Blasts and engines are heavy; hammer taps and voices are light." },
    bright:   { l: "Sharpness", t: "Sharpness: muffled → sharp (Hz)", f: p => p.bright, lo: "muffled, dull", hi: "sharp, metallic", v: p => Math.round(p.bright) + " Hz",
                d: "Where the sound sits in pitch. Metal on metal is sharp; a distant blast loses its high tones and sounds muffled." },
    loud:     { l: "Loudness", t: "Loudness: quiet → loud (dB)", f: p => Math.max(-90, p.loud), lo: "quiet", hi: "loud", v: p => p.loud <= -120 ? "total silence" : p.loud + " dB",
                d: "Level in decibels. 0 is the loudest the recording allows; −60 is near silence." },
    thud:     { l: "Jolt", t: "Jolt: soft → jolting (dB)", f: p => p.thud, lo: "soft onset", hi: "jolting", v: p => p.thud + " dB jump",
                d: "The biggest sudden jump in bass within the second, like a dropped slab or a shell landing." },
    dens:     { l: "Pace", t: "Pace: sparse → rapid (hits per second)", f: p => p.dens, lo: "sparse", hi: "rapid", v: p => p.dens + " hits/s",
                d: "Separate hits per second: the rhythm of hammering, or of gunfire." },
    perc:     { l: "Hits vs. hum", t: "Hits vs. hum: steady → percussive", f: p => p.perc, lo: "steady hum", hi: "sharp hits", v: p => pct(p.perc) + " in hits",
                d: "Short hits, like hammering, or a continuous hum, like an engine." },
    noisy:    { l: "Noisiness", t: "Noisiness: tonal → noisy", f: p => p.noisy, lo: "tonal (a note, a hum)", hi: "noise-like (debris, wind)", v: p => p.noisy.toFixed(3),
                d: "A clear tone or hum at 0; pure noise, like wind or debris, at 1." },
    t:        { l: "Film time", t: "Film time: start → end (min)", f: p => p.t / 60, lo: "early in the film", hi: "late in the film", v: p => fmt(p.t),
                d: "When the second happens in the film." },
    p_build:  { l: "Sounds like building", t: "Sounds like building work (computer's confidence)", f: p => p.p_build, lo: "not like building", hi: "clearly building work", v: p => pct(p.p_build),
                d: "How sure Google's sound-recognition model is that the second contains tools, metal or engines." },
    p_bomb:   { l: "Sounds like bombs", t: "Sounds like bombs (computer's confidence)", f: p => p.p_bomb, lo: "not like a blast", hi: "clearly a blast", v: p => pct(p.p_bomb),
                d: "How sure the model is that the second contains an explosion, gunfire or thunder." },
    p_tool:   { l: "Sounds like tools", t: "Sounds like tools & metal (confidence)", f: p => p.p_tool, lo: "no tools", hi: "clearly tools", v: p => pct(p.p_tool),
                d: "How sure the model is that it hears hammers, drills or metal." },
    p_engine: { l: "Sounds like engines", t: "Sounds like engines (confidence)", f: p => p.p_engine, lo: "no engines", hi: "clearly engines", v: p => pct(p.p_engine),
                d: "How sure the model is that it hears engines or heavy machinery." },
    echo:     { l: "Building ↔ bombing", t: "Resembles: building ← → bombing", f: p => p.echo, lo: "resembles building work", hi: "resembles bombing", v: p => (p.echo > 0 ? "+" : "") + p.echo.toFixed(2),
                d: "Whether the model's overall impression of the second is closer to a typical building sound (negative) or a typical bomb sound (positive)." },
  };
  const NOTES = [
    { t: 110, short: "1:50 · hammer heard as gunfire", text: "Between hammer blows at 1:48–1:52, the model hears one second as gunfire (81%)" },
    { t: 776, short: "12:56 · engine rumble", text: "An engine rumble whose closest bomb match is thunder at 70:23, 57 minutes later" },
    { t: 1806, short: "30:06 · after total silence", text: "A blast heard as explosion and breaking glass, right after the film's only two seconds of total silence" },
    { t: 3292, short: "54:52 · loudest stretch", text: "The loudest stretch of the film: engine noise on a 2-second beat, heard again and again as a boom" },
    { t: 4223, short: "70:23 · thunder", text: "The thunder that the 12:56 engine rumble most resembles" },
  ];

  const PRESETS = [
    { id: "overlap", name: "Overlap", x: "p_build", y: "p_bomb", z: "t", rh: false,
      say: s => `<b>${s.n.both}</b> seconds are heard as building and bombing at once` },
    { id: "body", name: "In the body", x: "weight", y: "bright", z: "loud", rh: false,
      say: s => `Same bass as engines (<b>${pct(s.med.bomb.weight)}</b> vs <b>${pct(s.med.engine.weight)}</b>), far more muffled (<b>${s.med.bomb.bright}</b> vs <b>${s.med.tool.bright} Hz</b>)` },
    { id: "rhythm", name: "Rhythm", x: "dens", y: "perc", z: "thud", rh: false,
      say: s => `Tools hit <b>${s.med.tool.dens}×</b> a second; bombs jolt harder (<b>${s.med.bomb.thud}</b> vs <b>${s.med.tool.thud} dB</b>)` },
    { id: "echo", name: "Echoes", x: "t", y: "echo", z: "weight", rh: true,
      say: () => `Lines join each building sound to the bomb it most resembles` },
  ];

  const $ = s => document.querySelector(s);
  const wrap = (txt, n) => { const out = []; let line = ""; for (const w of txt.split(" ")) { if ((line + " " + w).trim().length > n) { out.push(line.trim()); line = w; } else line += " " + w; } out.push(line.trim()); return out.join("<br>"); };
  const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const sceneAxis = title => ({ title: { text: title, font: { size: 12 } }, gridcolor: TH.grid, zerolinecolor: TH.line, showbackground: false, color: C.mute, showspikes: false });
  const sfx = (e, d) => { if (window.SFX) window.SFX.play(e, d); };

  let P = [], RH = [], REG = [], IMP = [], CUTS = [], PLACES = [], STATS = null;
  const state = { x: "p_build", y: "p_bomb", z: "t", rh: false, notes: true, path: false, rhN: 40, t0: 0, t1: 85, l0: -90, l1: 0,
                  cluster: true, clusterN: 14, spin: true, hl: null, on: new Set(), preset: 0 };
  let traceInfo = { playhead: -1 }, impPlayhead = -1;
  let cur = 0, stopAt = null;
  const media = $("#media");
  let hasMedia = false;
  const slots = { A: null, B: null };

  // ---------------- load ----------------
  Promise.all(["data/data.json", "data/impacts.json", "data/cuts.json", "data/places.json"].map(u => fetch(u).then(r => r.json())))
    .then(([d, imp, cuts, places]) => {
      P = d.points; RH = d.rhymes; REG = d.regions; IMP = imp; CUTS = cuts;
      PLACES = loadPlaces(places);
      init();
    })
    .catch(e => { document.body.insertAdjacentHTML("afterbegin", `<p style="padding:20px;color:#e0301e">Could not load data (${e}). Open the site through a local server (see README).</p>`); });

  function loadPlaces(fromFile) {
    try { const s = localStorage.getItem("toc-places"); if (s) return JSON.parse(s); } catch (e) { /* storage unavailable */ }
    return fromFile || [];
  }
  function savePlaces() { try { localStorage.setItem("toc-places", JSON.stringify(PLACES)); } catch (e) { /* ignore */ } }

  // ---------------- classify each second ----------------
  function classify(p) {
    if (p.cat === "tool" || p.cat === "engine") {
      p.kind = KIND_OF_LABEL[p.p_tool >= p.p_engine ? p.lab.tool : p.lab.engine] || (p.cat === "tool" ? "Hammering and drilling" : "Engines");
      p.group = p.kind === "Hammering and drilling" || p.kind === "Metal and clatter" ? "tool" : "engine";
    } else if (p.cat === "bomb") { p.group = "bomb"; p.kind = KIND_OF_LABEL[p.lab.bomb] || "Explosions"; }
    else if (p.cat === "both") { p.group = "both"; p.kind = "both"; }
    else {
      const f = p.fam;
      p.group = f === "voice" ? "voice" : f === "music" ? "music" : f === "water" ? "water" : f === "air" ? "air" : f === "silence" || p.loud < -55 ? "silence" : "ambient";
      p.kind = p.group;
    }
    p.score = p.group === "bomb" || p.group === "both" ? p.p_bomb : p.group === "tool" ? p.p_tool : p.group === "engine" ? p.p_engine : (p.top[0] ? p.top[0][1] : 0);
  }

  // ---------------- statistics used in short captions ----------------
  function computeStats() {
    const med = arr => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
    const n = {}, m = {};
    for (const k of ["tool", "engine", "bomb", "both"]) {
      const g = P.filter(p => p.cat === k); n[k] = g.length;
      m[k] = { weight: med(g.map(p => p.weight)), bright: Math.round(med(g.map(p => p.bright))), loud: Math.round(med(g.map(p => p.loud))),
               dens: med(g.map(p => p.dens)), thud: med(g.map(p => p.thud)).toFixed(1) };
    }
    const ranks = {}, range = {};
    for (const k in AX) {
      const v = P.map(p => AX[k].f(p)).sort((a, b) => a - b); ranks[k] = v;
      range[k] = [v[Math.floor(v.length * 0.005)], v[Math.ceil(v.length * 0.995) - 1]];
    }
    return { n, med: m, N: P.length, ranks, range };
  }
  function rankOf(k, v) {
    const r = STATS.ranks[k]; let lo = 0, hi = r.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (r[mid] < v) lo = mid + 1; else hi = mid; }
    return lo / r.length;
  }
  function qualify(k, v) {
    const q = rankOf(k, v);
    if (k === "t") return q < 0.33 ? "early" : q < 0.66 ? "middle" : "late";
    const hi = AX[k].hi.split(",")[0], lo = AX[k].lo.split(",")[0];
    const very = w => (w.includes(" ") ? w : `very ${w}`);
    return q > 0.8 ? very(hi) : q > 0.6 ? hi : q < 0.2 ? very(lo) : q < 0.4 ? lo : "middling";
  }

  // ---------------- init ----------------
  function init() {
    refreshTheme();
    P.forEach(classify);
    STATS = computeStats();
    // default: building, bombs and both on; environment off
    for (const f of ["build", "bomb"]) FACETS[f].kinds.forEach(k => state.on.add(k));
    state.on.add("both");

    for (const id of ["#ax-x", "#ax-y", "#ax-z"]) { const s = $(id); for (const k in AX) s.add(new Option(AX[k].l, k)); s.title = ""; }
    PRESETS.forEach((p, i) => {
      const b = document.createElement("button");
      b.className = "qpill"; b.textContent = p.name; b.setAttribute("role", "tab");
      b.onclick = () => { applyPreset(i); sfx("toggle"); };
      $("#presets").appendChild(b);
    });
    renderFacets();
    dualRange($("#rangeTime"), { min: 0, max: 85, step: 1, from: 0, to: 85, fmt: v => `${v} min`, onchange: (a, b) => { state.t0 = a; state.t1 = b; draw3d(); } });
    if ($("#legend")) $("#legend").innerHTML = Object.entries(FAM).filter(([k]) => k !== "media").map(([, v]) => `<span style="--c:${v.c}">${v.label}</span>`).join("");

    const onAx = () => { document.querySelectorAll(".qpill").forEach(b => b.classList.remove("on")); $("#finding").innerHTML = ""; draw3d(); };
    $("#ax-x").onchange = e => { state.x = e.target.value; onAx(); };
    $("#ax-y").onchange = e => { state.y = e.target.value; onAx(); };
    $("#ax-z").onchange = e => { state.z = e.target.value; onAx(); };
    const chk = (id, key) => { $(id).onchange = e => { state[key] = e.target.checked; sfx("toggle", e.target.checked); draw3d(); }; };
    chk("#showRhymes", "rh"); chk("#showNotes", "notes"); chk("#optCluster", "cluster");
    $("#optSpin").onchange = e => { state.spin = e.target.checked; sfx("toggle"); if (state.spin) startSpin(); };
    $("#clusterN").oninput = e => { $("#clusterNo").value = e.target.value; state.clusterN = +e.target.value; draw3d(true); };
    $("#fReset").onclick = () => { state.on.clear(); for (const f of ["build", "bomb"]) FACETS[f].kinds.forEach(k => state.on.add(k)); state.on.add("both"); state.hl = null; renderFacets(); sfx("toggle"); draw3d(); };

    document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); closeMenus(); showTab(b.dataset.tab); }));
    const menu = (btnId, menuId, onOpen) => {
      const bt = $(btnId), m = $(menuId);
      bt.onclick = e => { e.stopPropagation(); const open = !m.classList.contains("open"); closeMenus(); if (open && onOpen) onOpen(m); if (open) sfx("menu"); m.classList.toggle("open", open); bt.setAttribute("aria-expanded", open); };
      m.addEventListener("click", e => e.stopPropagation());
      m.addEventListener("mousedown", e => e.stopPropagation(), true);
    };
    menu("#sfxBtn", "#sfxMenu", m => window.SFX && window.SFX.renderMenu(m));
    menu("#viewBtn", "#viewMenu");
    document.addEventListener("click", e => { if (!e.target.closest(".dd")) closeMenus(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeMenus(); if (state.hl) setHighlight(null); } });

    setupPlot();
    setupDock();
    setupPlayer();
    setupPlaces();
    applyPreset(0, true);
    drawStrata();
    setTime(0);
    if (state.spin) startSpin();
    window.TOC = {
      retheme() { refreshTheme(); renderFacets(); draw3d(true); drawStrata(); ["plot3d", "plotStrata"].forEach(id => { const d = document.getElementById(id); if (d && d.offsetParent) Plotly.Plots.resize(d); }); },
      P: () => P, G, fmt, showTab, slots: () => slots, media: () => (hasMedia ? media : null),
      snippet(t) { if (!hasMedia) return false; playClip(t, 1.6); return true; },
      pauseMain() { if (hasMedia) media.pause(); },
    };
    document.dispatchEvent(new Event("toc-ready"));
  }

  function closeMenus() {
    [["#viewMenu", "#viewBtn"], ["#sfxMenu", "#sfxBtn"]].forEach(([m, b]) => { const el = $(m); if (el) { el.classList.remove("open"); $(b).setAttribute("aria-expanded", "false"); } });
  }
  function showTab(name) {
    document.querySelectorAll(".pillnav > button[data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    document.querySelectorAll(".pane").forEach(p => p.classList.toggle("on", p.id === "pane-" + name));
    $(".pillnav").classList.toggle("dim", name === "compare");
    const id = { space: "plot3d", strata: "plotStrata" }[name];
    if (id) { Plotly.Plots.resize(id); updatePlayhead(); }
    if (name === "space" && state.spin) startSpin();
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function applyPreset(i, quiet) {
    const p = PRESETS[i]; state.preset = i;
    Object.assign(state, { x: p.x, y: p.y, z: p.z, rh: p.rh });
    $("#ax-x").value = p.x; $("#ax-y").value = p.y; $("#ax-z").value = p.z; $("#showRhymes").checked = p.rh;
    document.querySelectorAll(".qpill").forEach((b, j) => { b.classList.toggle("on", j === i); b.setAttribute("aria-selected", j === i); });
    $("#finding").innerHTML = p.say(STATS);
    draw3d();
    if (!quiet) Plotly.relayout("plot3d", { "scene.camera": cameraFor() });
  }

  // ---------------- Amazon-style facet sidebar ----------------
  function counts() {
    const c = {};
    for (const p of P) { if (p.t < state.t0 * 60 || p.t > state.t1 * 60) continue; c[p.kind] = (c[p.kind] || 0) + 1; }
    return c;
  }
  const openFacets = new Set();
  function renderFacets() {
    const c = counts();
    const groups = [
      { id: "build", label: "Construction", sw: ["tool", "engine"], kinds: FACETS.build.kinds, name: k => k },
      { id: "bomb", label: "Bombs", sw: ["bomb"], kinds: FACETS.bomb.kinds, name: k => k },
      { id: "both", label: "Both at once", sw: ["both"], kinds: ["both"], name: () => "" },
      { id: "env", label: "Environment", sw: ["voice", "water", "air", "silence"], kinds: FACETS.env.kinds, name: k => G[k].label },
    ];
    $("#facets").innerHTML = groups.map(gr => {
      const on = gr.kinds.filter(k => state.on.has(k)).length, n = gr.kinds.reduce((a, k) => a + (c[k] || 0), 0);
      const expandable = gr.kinds.length > 1, open = openFacets.has(gr.id);
      const sw = gr.sw.map(g => `<span class="swatch" data-hl="${g}" style="background:${G[g].c}" title="Highlight ${G[g].label}"></span>`).join("");
      const kids = expandable && open ? `<div class="fc-kids">${gr.kinds.map(k => `<label class="fc"><input type="checkbox" data-k="${k}" ${state.on.has(k) ? "checked" : ""}>${gr.id === "env" ? `<span class="swatch" data-hl="${k}" style="background:${G[k].c}"></span>` : "<span></span>"}<span class="fc-l">${gr.name(k)}</span><span class="fc-n">${(c[k] || 0).toLocaleString()}</span></label>`).join("")}</div>` : "";
      return `<div class="fg"><label class="fc master"><input type="checkbox" data-master="${gr.id}" ${on === gr.kinds.length ? "checked" : ""} ${on > 0 && on < gr.kinds.length ? 'data-ind="1"' : ""}>
        <span class="swatches">${sw}</span><span class="fc-l">${gr.label}</span><span class="fc-n">${n.toLocaleString()}</span>
        ${expandable ? `<button class="fc-more ${open ? "open" : ""}" data-open="${gr.id}" aria-label="Show types" aria-expanded="${open}"><svg viewBox="0 0 12 12"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : "<span></span>"}</label>${kids}</div>`;
    }).join("");
    const G2K = { build: FACETS.build.kinds, bomb: FACETS.bomb.kinds, both: ["both"], env: FACETS.env.kinds };
    document.querySelectorAll("#facets [data-ind]").forEach(i => { i.indeterminate = true; });
    document.querySelectorAll("#facets input[data-k]").forEach(i => i.onchange = () => { i.checked ? state.on.add(i.dataset.k) : state.on.delete(i.dataset.k); sfx("toggle", i.checked); renderFacets(); draw3d(); });
    document.querySelectorAll("#facets input[data-master]").forEach(i => i.onchange = () => { G2K[i.dataset.master].forEach(k => i.checked ? state.on.add(k) : state.on.delete(k)); sfx("toggle", i.checked); renderFacets(); draw3d(); });
    document.querySelectorAll("#facets [data-open]").forEach(bt => bt.onclick = e => { e.preventDefault(); e.stopPropagation(); const id = bt.dataset.open; openFacets.has(id) ? openFacets.delete(id) : openFacets.add(id); sfx("toggle"); renderFacets(); });
    document.querySelectorAll("#facets [data-hl]").forEach(sw => {
      sw.onclick = e => { e.preventDefault(); e.stopPropagation(); setHighlight(state.hl === sw.dataset.hl ? null : sw.dataset.hl); };
      sw.classList.toggle("hl", state.hl === sw.dataset.hl);
    });
  }

  function dualRange(el, o) {
    el.innerHTML = `<div class="dr-track"><i></i></div><input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.from}" aria-label="From">
      <input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.to}" aria-label="To"><div class="dr-vals"><span></span><span></span></div>`;
    const [a, b] = el.querySelectorAll("input"), fill = el.querySelector(".dr-track i"), [va, vb] = el.querySelectorAll(".dr-vals span");
    let tm = null;
    const upd = fire => {
      let x = +a.value, y = +b.value; if (x > y) { [x, y] = [y, x]; }
      const L = (x - o.min) / (o.max - o.min) * 100, R = (y - o.min) / (o.max - o.min) * 100;
      fill.style.left = L + "%"; fill.style.width = (R - L) + "%"; va.textContent = o.fmt(x); vb.textContent = o.fmt(y);
      if (fire) { clearTimeout(tm); tm = setTimeout(() => { o.onchange(x, y); renderFacets(); }, 90); }
    };
    a.oninput = b.oninput = () => upd(true); upd(false);
  }

  // ---------------- 3D sound space with population-style grouping ----------------
  let traceMeta = [], groupTrace = {}, lastDrawKey = "";
  function takenSet() {
    const t = new Set();
    for (const it of [slots.A, slots.B, drag.active ? itemFrom(drag.item) : null]) if (it) it.ts.forEach(x => t.add(x));
    return t;
  }
  function visible() {
    const taken = takenSet();
    return P.filter(p => !taken.has(p.t) && state.on.has(p.kind) && p.t >= state.t0 * 60 && p.t <= state.t1 * 60 && Math.max(-90, p.loud) >= state.l0 && Math.max(-90, p.loud) <= state.l1);
  }
  function clusterize(pts) {
    const fx = AX[state.x].f, fy = AX[state.y].f, fz = AX[state.z].f;
    const [rx, ry, rz] = [state.x, state.y, state.z].map(k => STATS.range[k]);
    const N = state.cluster ? state.clusterN : 0;
    const cell = (v, r) => Math.max(0, Math.min(N - 1, Math.floor((v - r[0]) / ((r[1] - r[0]) || 1) * N)));
    const bins = new Map();
    for (const p of pts) {
      const x = fx(p), y = fy(p), z = fz(p);
      const key = N ? `${p.group}|${cell(x, rx)}|${cell(y, ry)}|${cell(z, rz)}` : `${p.group}|${p.t}`;
      let b = bins.get(key);
      if (!b) { b = { g: p.group, ts: [], x: 0, y: 0, z: 0, loud: 0, rep: p, kinds: {} }; bins.set(key, b); }
      b.ts.push(p.t); b.x += x; b.y += y; b.z += z; b.loud += Math.max(-90, p.loud); b.kinds[p.kind] = (b.kinds[p.kind] || 0) + 1;
      if (p.score > b.rep.score) b.rep = p;
    }
    const out = [];
    for (const b of bins.values()) { const n = b.ts.length; b.n = n; b.x /= n; b.y /= n; b.z /= n; b.loud /= n; out.push(b); }
    return out;
  }
  const dotSize = b => b.n > 1 ? TH.dot * (3 + TH.bubble * 2.6 * Math.sqrt(b.n)) : TH.dot * (G[b.g].fam === "env" ? 2.2 : 2.6) * (1 + Math.max(0, (b.loud + 65) / 45));
  const opFor = g => state.hl ? (g === state.hl ? 1 : TH.dim) : (G[g].fam === "env" ? TH.envOp : TH.dotOp);

  function cameraFor() {
    return state.z === "t" ? { eye: { x: 1.5, y: 1.5, z: 0.68 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 } } : { eye: { x: 1.55, y: -1.5, z: 0.76 }, up: { x: 0, y: 0, z: 1 }, center: { x: 0, y: 0, z: 0 } };
  }

  function draw3d(quick) {
    const div = $("#plot3d");
    const fx = AX[state.x].f, fy = AX[state.y].f, fz = AX[state.z].f;
    const pts = visible();
    const clusters = clusterize(pts);
    const traces = []; traceMeta = []; groupTrace = {};
    const order = ["silence", "ambient", "air", "water", "music", "voice", "engine", "tool", "bomb", "both"];
    for (const g of order) {
      const cs = clusters.filter(b => b.g === g); if (!cs.length) continue;
      groupTrace[g] = traces.length;
      traces.push({ type: "scatter3d", mode: "markers", name: G[g].label, hoverinfo: "none",
        x: cs.map(b => b.x), y: cs.map(b => b.y), z: cs.map(b => b.z),
        marker: { size: cs.map(dotSize), color: G[g].c, opacity: opFor(g), line: { width: TH.rim, color: TH.card }, sizemode: "diameter" } });
      traceMeta.push(cs);
    }
    if (state.path && pts.length) {
      const k = 3, sorted = [...pts].sort((a, b) => a.t - b.t);
      const sm = f => sorted.map((_, i) => { let a = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(sorted.length - 1, i + k); j++) { a += f(sorted[j]); n++; } return a / n; });
      traces.push({ type: "scatter3d", mode: "lines", name: "Path", hoverinfo: "skip", x: sm(fx), y: sm(fy), z: sm(fz), line: { color: C.mute, width: 1.5 } });
      traceMeta.push(null);
    }
    if (state.rh) {
      const vis = new Set(pts.map(p => p.t)); const xs = [], ys = [], zs = []; let n = 0;
      for (const [a, b] of RH) { if (n >= state.rhN) break; if (!vis.has(a) || !vis.has(b)) continue; xs.push(fx(P[a]), fx(P[b]), null); ys.push(fy(P[a]), fy(P[b]), null); zs.push(fz(P[a]), fz(P[b]), null); n++; }
      traces.push({ type: "scatter3d", mode: "lines", name: "Echo lines", hoverinfo: "skip", x: xs, y: ys, z: zs, line: { color: C.maroon, width: 1.5 } });
      traceMeta.push(null);
    }
    const holes = [slots.A, slots.B, drag.active ? itemFrom(drag.item) : null].filter(Boolean);
    if (holes.length) {
      const pos = it => { const ps = it.ts.map(t => P[t]); const m = f => ps.reduce((a, p) => a + f(p), 0) / ps.length; return [m(fx), m(fy), m(fz)]; };
      const xyz = holes.map(pos);
      traces.push({ type: "scatter3d", mode: "markers+text", name: "Moved out", hoverinfo: "skip", x: xyz.map(v => v[0]), y: xyz.map(v => v[1]), z: xyz.map(v => v[2]),
        text: holes.map(it => it === slots.A ? "A" : it === slots.B ? "B" : ""), textposition: "middle center", textfont: { size: 12, color: C.ink, family: TH.font },
        marker: { size: holes.map(it => Math.max(30, Math.min(56, dotSize({ n: it.n, g: it.g, loud: -30 }) * 1.3))), color: holes.map(it => it.color), symbol: "circle-open", line: { width: 3 }, opacity: 1 } });
      traceMeta.push(null);
    }
    traces.push({ type: "scatter3d", mode: "markers", name: "Now", hoverinfo: "skip", showlegend: false, x: [null], y: [null], z: [null], marker: { size: 8, color: C.ink, line: { color: TH.card, width: 1 }, symbol: "diamond" } });
    traceMeta.push(null); traceInfo.playhead = traces.length - 1;

    const vis = new Set(pts.map(p => p.t));
    const annotations = state.notes ? NOTES.filter(nt => vis.has(nt.t)).map(nt => ({ x: fx(P[nt.t]), y: fy(P[nt.t]), z: fz(P[nt.t]), text: nt.short, showarrow: true, arrowhead: 0, arrowwidth: 1, arrowcolor: C.mute,
      ax: 36, ay: -34, bgcolor: `rgba(255,255,255,${TH.noteA})`, borderwidth: 0, borderpad: 3, font: { size: 11, color: C.ink } })) : [];
    const [rx, ry, rz] = [state.x, state.y, state.z].map(k => STATS.range[k]);
    const pad = r => { const d = (r[1] - r[0]) * 0.04; return [r[0] - d, r[1] + d]; };
    const layout = { ...light(), margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false, hovermode: "closest", dragmode: "turntable",
      scene: { xaxis: { ...sceneAxis(AX[state.x].t), range: pad(rx) }, yaxis: { ...sceneAxis(AX[state.y].t), range: pad(ry) }, zaxis: { ...sceneAxis(AX[state.z].t), range: pad(rz) },
        aspectmode: "manual", aspectratio: { x: 1, y: 1, z: 0.95 }, camera: (div.layout && div.layout.scene && div.layout.scene.camera) || cameraFor(), annotations },
      uirevision: state.x + state.y + state.z };
    Plotly.react(div, traces, layout, { displaylogo: false, responsive: true, displayModeBar: false });
    hovered = null;
    const key = state.x + state.y + state.z;
    if (!quick && TH.anim > 0) growIn(key !== lastDrawKey ? 0.05 : 0.6);
    lastDrawKey = key;
    updatePlayhead();
  }

  // animations: dots grow in; highlight fades evenly
  let animId = 0;
  function growIn(from) {
    const div = $("#plot3d"), id = ++animId, t0 = performance.now();
    const finals = traceMeta.map(cs => cs ? cs.map(dotSize) : null);
    const idx = finals.map((f, i) => (f ? i : -1)).filter(i => i >= 0);
    const step = now => {
      if (id !== animId) return;
      const k = Math.min(1, (now - t0) / TH.anim), e = 1 - Math.pow(1 - k, 3);
      const sc = from + (1 - from) * e;
      Plotly.restyle(div, { "marker.size": idx.map(i => finals[i].map(s => s * sc)) }, idx);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  let hlAnim = 0;
  function setHighlight(g) {
    state.hl = g; sfx(g ? "highlight" : "toggle", !!g);
    document.querySelectorAll("#pane-space .filters [data-hl]").forEach(s => s.classList.toggle("hl", !!g && s.dataset.hl === g));
    const div = $("#plot3d"), ids = Object.values(groupTrace), groups = Object.keys(groupTrace);
    const start = groups.map(k => div.data[groupTrace[k]].marker.opacity), end = groups.map(opFor);
    const t0 = performance.now(), id = ++hlAnim, dur = Math.max(1, TH.anim * 0.7);
    const step = now => {
      if (id !== hlAnim) return;
      const k = Math.min(1, (now - t0) / dur), e = k * (2 - k);
      Plotly.restyle(div, { "marker.opacity": start.map((s, i) => s + (end[i] - s) * e) }, ids);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    $("#plotbox").classList.toggle("hl-on", !!g);
  }

  // slow spin until the viewer takes over
  let spinId = 0, spinAngle = null;
  function startSpin() {
    if (reduceMotion || TH.spin <= 0) return;
    const div = $("#plot3d"), id = ++spinId; let last = performance.now();
    const step = now => {
      if (id !== spinId || !state.spin || !$("#pane-space").classList.contains("on") || drag.active) return;
      if (now - last > 50) {
        const cam = (div.layout && div.layout.scene && div.layout.scene.camera) || cameraFor();
        const e = cam.eye, r = Math.hypot(e.x, e.y); let a = Math.atan2(e.y, e.x);
        a += 0.0035 * TH.spin * (now - last) / 16;
        Plotly.relayout(div, { "scene.camera.eye": { x: r * Math.cos(a), y: r * Math.sin(a), z: e.z } });
        last = now;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function stopSpin() { spinId++; }

  // ---------------- hover, click, hold-and-drag ----------------
  let lastPointer = "mouse", inClick = false;
  let hovered = null, mouse = { x: 0, y: 0 }, pinned = false, lastHover = null, lastClient = { x: 0, y: 0 }, unhoverT = 0;
  const drag = { active: false, pending: false, item: null, sx: 0, sy: 0, t: 0 };
  function itemFrom(b) {
    const kindsTop = Object.entries(b.kinds).sort((x, y) => y[1] - x[1])[0][0];
    const label = G[b.g].fam === "env" || b.g === "both" ? G[b.g].label : kindsTop;
    return { g: b.g, n: b.n, ts: [...b.ts].sort((x, y) => x - y), rep: b.rep.t, label, color: G[b.g].c };
  }
  function setupPlot() {
    const div = $("#plot3d"), box = $("#plotbox"), card = $("#hovercard");
    box.addEventListener("mousemove", e => { const r = box.getBoundingClientRect(); mouse = { x: e.clientX - r.left, y: e.clientY - r.top }; lastClient = { x: e.clientX, y: e.clientY }; }, true);
    const bind = () => {
      div.on("plotly_hover", ev => {
        const pt = ev.points && ev.points[0]; if (!pt) return;
        const cs = traceMeta[pt.curveNumber]; if (!cs) return;
        const b = cs[pt.pointNumber]; if (!b) return;
        if (hovered !== b) sfx("hover");
        hovered = b; lastHover = { b, x: lastClient.x, y: lastClient.y, t: performance.now() }; clearTimeout(unhoverT);
        if (!pinned && !drag.active) showCard(b);
      });
      div.on("plotly_unhover", () => {
        clearTimeout(unhoverT);
        unhoverT = setTimeout(() => { hovered = null; if (!pinned && !drag.active) card.classList.remove("on"); }, 140);
      });
      div.on("plotly_click", ev => {   // touch path only: pin the card with buttons (mouse clicks are handled below)
        if (lastPointer === "mouse" || inClick) return;
        const pt = ev.points && ev.points[0]; if (!pt) return;
        const cs = traceMeta[pt.curveNumber]; if (!cs) return;
        const b = cs[pt.pointNumber]; if (b) { inClick = true; try { clickItem(b); pinned = true; showCard(b, true); } finally { setTimeout(() => { inClick = false; }, 0); } }
      });
    };
    const wait = setInterval(() => { if (div.on) { clearInterval(wait); bind(); } }, 50);

    // capture mousedown on a hovered dot so the camera doesn't rotate; decide click vs hold-drag
    const down = e => {
      stopSpin();
      if (e.button && e.button !== 0) return;
      const near = lastHover && performance.now() - lastHover.t < 600 && Math.hypot(e.clientX - lastHover.x, e.clientY - lastHover.y) < 18 ? lastHover.b : null;
      const target = hovered || near;
      if (!target) { if (pinned) { pinned = false; card.classList.remove("on"); } return; }
      e.preventDefault(); e.stopPropagation();
      Object.assign(drag, { pending: true, active: false, item: target, sx: e.clientX, sy: e.clientY, t: performance.now() });
      drag.timer = setTimeout(() => { if (drag.pending) beginDrag(lastClient.x, lastClient.y); }, 170);
    };
    box.addEventListener("mousedown", down, true);
    box.addEventListener("pointerdown", e => { lastPointer = e.pointerType; }, true);
    box.addEventListener("pointerdown", e => { if (e.pointerType === "mouse" && (hovered || (lastHover && performance.now() - lastHover.t < 600 && Math.hypot(e.clientX - lastHover.x, e.clientY - lastHover.y) < 18))) { e.stopPropagation(); } }, true);
    box.addEventListener("wheel", stopSpin, { passive: true });
    window.addEventListener("mousemove", e => {
      if (drag.pending && !drag.active && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) beginDrag(e.clientX, e.clientY);
      if (drag.active) { e.preventDefault(); moveGhost(e.clientX, e.clientY); }
    });
    window.addEventListener("mouseup", e => {
      clearTimeout(drag.timer);
      if (drag.active) { endDrag(e.clientX, e.clientY); return; }
      if (drag.pending) { drag.pending = false; clickItem(drag.item); }
    });
    box.addEventListener("click", e => { if (e.target.closest("[data-put]")) { const b = pinnedItem; if (b) { putInSlot(e.target.closest("[data-put]").dataset.put, itemFrom(b)); pinned = false; card.classList.remove("on"); } } });
  }
  let pinnedItem = null;
  function clickItem(b) {
    sfx("click", { ...b.rep, group: b.g, loud: b.loud, t: b.rep.t });
    setHighlight(state.hl === b.g ? null : b.g);
    seek(b.rep.t, true);
  }
  function showCard(b, pin) {
    const card = $("#hovercard"), box = card.parentElement; pinnedItem = b;
    const it = itemFrom(b), p = b.rep;
    const span = b.n > 1 ? `${b.n} seconds · ${fmt(it.ts[0])}–${fmt(it.ts[it.ts.length - 1])}` : fmt(p.t);
    const heard = (G[b.g].fam === "env" ? p.top.slice(0, 1).map(x => x[0]) : [p.p_tool > 0.1 && p.lab.tool, p.p_engine > 0.1 && p.lab.engine, p.p_bomb > 0.1 && p.lab.bomb].filter(Boolean)).join(" · ") || p.top[0][0];
    const vals = { x: b.x, y: b.y, z: b.z };
    const rows = ["x", "y", "z"].filter((k, i, a) => a.findIndex(j => state[j] === state[k]) === i).map(k => `<li><span>${AX[state[k]].l}</span><b>${qualify(state[k], vals[k])}</b></li>`).join("");
    const note = NOTES.find(n => b.ts.includes(n.t));
    card.innerHTML = `<div class="hc-head"><i style="background:${it.color}"></i><b>${it.label}</b></div>
      <p class="hc-sub">${span}</p><p class="hc-sub">${heard}</p><ul class="hc-rows">${rows}</ul>
      ${note ? `<p class="hc-note">${note.text}</p>` : ""}
      ${pin ? `<div class="hc-btns"><button class="btn" data-put="A">Put in A</button><button class="btn" data-put="B">Put in B</button></div>` : `<p class="hc-hint">Hold and drag to compare</p>`}`;
    card.classList.toggle("pinned", !!pin);
    card.classList.add("on");
    const bw = box.clientWidth, bh = box.clientHeight, cw = card.offsetWidth, ch = card.offsetHeight;
    let x = mouse.x + 18, y = mouse.y + 14;
    if (x + cw > bw - 8) x = mouse.x - cw - 18;
    if (y + ch > bh - 8) y = Math.max(8, bh - ch - 8);
    card.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
  }
  function beginDrag(x, y) {
    drag.pending = false; drag.active = true; stopSpin();
    $("#hovercard").classList.remove("on");
    const g = $("#ghost"), it = itemFrom(drag.item), size = Math.min(64, 18 + Math.sqrt(it.n) * 5);
    g.style.setProperty("--sz", size + "px"); g.style.background = it.color;
    g.innerHTML = it.n > 1 ? `<span>${it.n}</span>` : "";
    g.classList.add("on"); document.body.classList.add("dragging");
    moveGhost(x, y);
    sfx("pickup");
    draw3d(true);
  }
  function zoneAt(x, y) {
    for (const z of document.querySelectorAll(".vs-slot")) { const r = z.getBoundingClientRect(); const pad = 24; if (x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad) return z; }
    return null;
  }
  function moveGhost(x, y) {
    const g = $("#ghost"); g.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    document.querySelectorAll(".vs-slot").forEach(z => z.classList.toggle("over", z === zoneAt(x, y)));
  }
  function endDrag(x, y) {
    const item = itemFrom(drag.item);
    drag.active = false; document.body.classList.remove("dragging");
    const z = zoneAt(x, y), g = $("#ghost");
    document.querySelectorAll(".vs-slot").forEach(s => s.classList.remove("over"));
    if (z) {
      const r = z.getBoundingClientRect();
      g.style.transition = "transform .18s ease-in, width .18s, height .18s, opacity .18s";
      g.style.transform = `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -50%) scale(.4)`;
      g.style.opacity = "0";
      setTimeout(() => { g.classList.remove("on"); g.style.transition = ""; g.style.opacity = ""; }, 190);
      putInSlot(z.dataset.slot, item);
    } else {
      g.style.transition = "opacity .2s"; g.style.opacity = "0";
      setTimeout(() => { g.classList.remove("on"); g.style.transition = ""; g.style.opacity = ""; }, 200);
      draw3d(true); sfx("miss");   // dropped outside: the dot goes back
    }
  }

  // ---------------- comparison dock ----------------
  function setupDock() {
    document.querySelectorAll(".vs-slot .vs-x").forEach(b => b.onclick = e => { e.stopPropagation(); const s = b.closest(".vs-slot").dataset.slot; slots[s] = null; renderSlot(s); sfx("clear"); draw3d(true); });
    $("#compareBtn").onclick = () => { if (slots.A && slots.B && window.COMPARE) { sfx("compare"); window.COMPARE.open(slots.A, slots.B); } };
    ["A", "B"].forEach(renderSlot);
  }
  function putInSlot(s, it) {
    const other = s === "A" ? "B" : "A";
    if (slots[other] && slots[other].ts.some(t => it.ts.includes(t))) slots[other] = null, renderSlot(other);   // same dot can't be in both
    slots[s] = it; renderSlot(s, true); sfx("drop"); draw3d(true);
  }
  function renderSlot(s, anim) {
    const el = $("#slot" + s), it = slots[s];
    el.classList.toggle("full", !!it);
    el.style.setProperty("--fill", it ? it.color : "transparent");
    el.querySelector(".vs-text").innerHTML = it ? `<b>${it.n > 1 ? it.n + " s" : fmt(it.rep)}</b><small>${it.label}</small>` : `<b>${s}</b><small>Drop a dot</small>`;
    el.setAttribute("aria-label", `Comparison slot ${s}, ${it ? it.label : "empty"}`);
    if (anim) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
    const ready = !!(slots.A && slots.B);
    $("#compareBtn").disabled = !ready; $("#compareBtn").classList.toggle("ready", ready);
  }

  const PLACE_C = { "Beirut: construction site": C.blue, "Beirut: barracks / underground": C.maroon, "Beirut: city / sea": C.lblue, "Syria: war footage": C.orange, "Black screen / title": C.ink, "Other": C.green, "unmarked": "#ece3d8" };

  // ---------------- timeline / strata ----------------
  function drawStrata() {
    const T = P.map(p => p.t / 60);
    const shapes = [];
    for (const r of REG) shapes.push({ type: "rect", xref: "x", yref: "paper", x0: r.a / 60, x1: r.b / 60, y0: 0.9, y1: 0.98, fillcolor: FAM[r.fam].c, line: { width: 0 } });
    for (const r of PLACES) shapes.push({ type: "rect", xref: "x", yref: "paper", x0: r.a / 60, x1: r.b / 60, y0: 0.985, y1: 1.0, fillcolor: PLACE_C[r.kind] || "#888", line: { width: 0 } });
    for (const c of CUTS.filter(c => c.kind === "scene")) shapes.push({ type: "line", xref: "x", yref: "paper", x0: c.t / 60, x1: c.t / 60, y0: 0, y1: 0.88, line: { color: c.kind === "scene" ? C.ink : C.grey, width: 1, dash: c.kind === "scene" ? "solid" : "dot" } });
    shapes.push({ type: "line", xref: "x", yref: "paper", x0: 0, x1: 0, y0: 0, y1: 1, line: { color: C.ink, width: 1.5 } });

    const sm = (arr, k) => arr.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(arr.length - 1, i + k); j++) { s += arr[j]; n++; } return s / n; });
    const echo = sm(P.map(p => p.echo), 3);
    const traces = [
      { type: "scattergl", mode: "lines", x: T, y: P.map(p => Math.max(-90, p.loud)), name: "Loudness (dB)", yaxis: "y3", line: { color: C.mute, width: 1 }, hovertemplate: "%{y:.0f} dB<extra></extra>" },
      { type: "scattergl", mode: "lines", x: T, y: echo.map(v => Math.max(0, v)), name: "Resembles bombing", yaxis: "y2", fill: "tozeroy", line: { color: C.orange, width: 0.5 }, fillcolor: C.orange, hoverinfo: "skip" },
      { type: "scattergl", mode: "lines", x: T, y: echo.map(v => Math.min(0, v)), name: "Resembles building", yaxis: "y2", fill: "tozeroy", line: { color: C.blue, width: 0.5 }, fillcolor: C.blue, hoverinfo: "skip" },
    ];
    for (const k of ["war", "machine", "both", "unclear"]) {
      const g = IMP.filter(i => i.reading === k);
      traces.push({ type: "scatter", mode: "markers", x: g.map(i => i.t / 60), y: g.map(i => i.decay), yaxis: "y", name: "Impact · " + READ[k].label.replace(/Computer( hears)?: /, ""),
        marker: { color: READ[k].c, size: g.map(i => 5 + Math.max(0, (i.peak + 40) / 3)), line: { width: 1, color: TH.card } },
        text: g.map(i => `${fmt(i.t)} · ${i.label}<br>rings for ${i.decay}s · bass ${pct(i.weight)}`), hoverinfo: "text" });
    }
    const layout = { ...light(), margin: { l: 78, r: 20, t: 10, b: 70 }, shapes, hovermode: "closest",
      legend: { orientation: "h", y: -0.13, font: { size: 11 } },
      xaxis: { title: { text: "Film time (minutes)", standoff: 6 }, range: [0, 85], gridcolor: TH.grid, dtick: 5, zeroline: false },
      yaxis3: { domain: [0.62, 0.88], title: { text: "Loudness", font: { size: 11 } }, gridcolor: TH.grid, range: [-80, -5] },
      yaxis2: { domain: [0.32, 0.58], title: { text: "Building ↔ bombing", font: { size: 11 } }, gridcolor: TH.grid, range: [-0.6, 0.6], zerolinecolor: C.grey },
      yaxis: { domain: [0, 0.28], title: { text: "Hit rings for (s)", font: { size: 11 } }, gridcolor: TH.grid, range: [0, 4.2] },
      annotations: [] };
    Plotly.react("plotStrata", traces, layout, { displaylogo: false, responsive: true });
    const div = $("#plotStrata");
    div.removeAllListeners && div.removeAllListeners("plotly_click");
    div.on("plotly_click", ev => { const p = ev.points && ev.points[0]; if (p) seek(p.x * 60); });
    div.onclick = e => {
      if (e.target.closest(".modebar")) return;
      const xa = div._fullLayout && div._fullLayout.xaxis; if (!xa) return;
      const bb = div.getBoundingClientRect();
      const px = e.clientX - bb.left - div._fullLayout._size.l;
      if (px < 0 || px > xa._length) return;
      seek(xa.p2l(px) * 60);
    };
  }

  // ---------------- impacts ----------------
  function drawImpacts() {
    const traces = [];
    for (const k of ["war", "machine", "both", "unclear"]) {
      const g = IMP.filter(i => i.reading === k);
      traces.push({ type: "scatter3d", mode: "markers", name: `${READ[k].label} (${g.length})`, x: g.map(i => i.decay), y: g.map(i => i.weight), z: g.map(i => Math.log10(Math.max(60, i.bright))),
        customdata: g.map(i => i.t), text: g.map(i => `<b>${fmt(i.t)}</b> · ${i.label}<br>rings for ${i.decay}s · bass ${pct(i.weight)} · ${Math.round(i.bright)} Hz<br>bomb ${pct(i.war)} · machine ${pct(i.machine)}`),
        hoverinfo: "text", hoverlabel: { bgcolor: TH.card, bordercolor: TH.card, font: { color: C.ink, family: TH.font } },
        marker: { size: g.map(i => 4 + Math.max(0, (i.peak + 40) / 2.5)), color: READ[k].c, opacity: 1, line: { width: 1, color: TH.card } } });
    }
    traces.push({ type: "scatter3d", mode: "markers", hoverinfo: "skip", showlegend: false, x: [null], y: [null], z: [null], marker: { size: 10, color: C.ink, symbol: "diamond" } });
    impPlayhead = traces.length - 1;
    const layout = { ...light(), margin: { l: 0, r: 0, t: 10, b: 0 }, legend: { x: 0, y: 1, bgcolor: TH.card, font: { size: 12 } },
      scene: { xaxis: sceneAxis("Rings for: short → long (s)"), yaxis: sceneAxis("Heaviness: light → heavy"),
        zaxis: { ...sceneAxis("Sharpness: muffled → sharp (Hz)"), tickvals: [2, 2.5, 3, 3.5], ticktext: ["100", "316", "1k", "3.2k"] }, aspectmode: "manual", aspectratio: { x: 1, y: 1, z: 0.95 }, camera: { eye: { x: 1.7, y: -1.5, z: 0.8 } } } };
    Plotly.react("plotImp", traces, layout, { displaylogo: false, responsive: true });
    $("#plotImp").on("plotly_click", ev => { const p = ev.points && ev.points[0]; if (p && p.customdata != null) seek(p.customdata); });

    const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
    let rows = "";
    for (const k of ["war", "machine", "both", "unclear"]) {
      const g = IMP.filter(i => i.reading === k);
      rows += `<tr><td><span style="color:${READ[k].c}">●</span> ${{ war: "Bomb", machine: "Machine", both: "Both", unclear: "Neither" }[k]}</td><td>${g.length}</td><td>${med(g.map(i => i.decay)).toFixed(1)} s</td><td>${med(g.map(i => i.weight)).toFixed(2)}</td><td>${Math.round(med(g.map(i => i.bright)))} Hz</td></tr>`;
    }
    $("#impStats").innerHTML = `<table><tr><th>Heard as</th><th>Hits</th><th>Rings</th><th>Bass</th><th>Pitch</th></tr>${rows}</table><p>Medians. Bombs ring nearly twice as long and sound far more muffled than machines, which is the sound of distance. Their heaviness overlaps.</p>`;
  }

  // ---------------- player ----------------
  function setupPlayer() {
    $("#file").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      media.src = URL.createObjectURL(f);
      media.classList.toggle("has", f.type.startsWith("video") || /\.(mp4|mov|m4v|webm|mkv)$/i.test(f.name));
      hasMedia = true;
      $("#play").disabled = false;
      $("#mediaHint").textContent = "Film loaded"; document.body.classList.add("has-film");
      media.currentTime = cur;
      document.dispatchEvent(new Event("toc-media"));
    };
    $("#play").onclick = () => media.paused ? media.play() : media.pause();
    media.onplay = () => $("#play").innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3.5h2.5v9H4.5zM9 3.5h2.5v9H9z" fill="currentColor"/></svg>';
    media.onpause = () => $("#play").innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.5v9l7-4.5Z" fill="currentColor"/></svg>';
    let last = 0;
    media.ontimeupdate = () => {
      if (stopAt != null && media.currentTime >= stopAt.t) { const n = stopAt.next; stopAt = null; media.pause(); if (n) n(); }
      const now = performance.now();
      if (now - last > 220) { last = now; setTime(media.currentTime, true); }
    };
    $("#scrub").oninput = e => seek(+e.target.value);
    document.addEventListener("keydown", e => {
      if (e.target.matches("input,select,textarea")) return;
      if (e.code === "Space" && hasMedia && !$("#pane-compare").classList.contains("on")) { e.preventDefault(); $("#play").click(); }
    });
  }
  function playClip(t, len, next) {
    if (t == null || !hasMedia) return;
    media.currentTime = Math.max(0, t - 0.5);
    stopAt = { t: t + len, next };
    media.play();
  }
  function seek(t, keepAudio) {
    t = Math.max(0, Math.min(P.length - 1, t));
    if (hasMedia && !keepAudio) media.currentTime = t;
    setTime(t);
  }
  function setTime(t, fromMedia) {
    cur = t;
    $("#clock").textContent = fmt(t);
    if (!fromMedia || document.activeElement !== $("#scrub")) $("#scrub").value = Math.round(t);
    const p = P[Math.min(P.length - 1, Math.floor(t))];
    if (p) {
      const pl = PLACES.find(r => t >= r.a && t < r.b);
      if ($("#now")) $("#now").innerHTML = `<span class="chip" style="background:${G[p.group].c}"></span><b>${G[p.group].label}</b> · heard as ${p.top[0][0]} ${pct(p.top[0][1])}<br>` +
        `${p.loud <= -120 ? "Total silence" : p.loud + " dB"} · heaviness ${pct(p.weight)} · sharpness ${Math.round(p.bright)} Hz` + (pl ? ` · <b>${pl.kind}</b>` : "");
    }
    updatePlayhead();
  }
  function updatePlayhead() {
    const p = P[Math.min(P.length - 1, Math.floor(cur))];
    if (!p) return;
    const d3 = $("#plot3d");
    if (d3.data && traceInfo.playhead >= 0 && $("#pane-space").classList.contains("on")) {
      const inR = p.t >= state.t0 * 60 && p.t <= state.t1 * 60;
      Plotly.restyle(d3, { x: [[inR ? AX[state.x].f(p) : null]], y: [[inR ? AX[state.y].f(p) : null]], z: [[inR ? AX[state.z].f(p) : null]] }, [traceInfo.playhead]);
    }
    const ds = $("#plotStrata");
    if (ds.layout && $("#pane-strata").classList.contains("on")) {
      const n = ds.layout.shapes.length - 1;
      Plotly.relayout(ds, { [`shapes[${n}].x0`]: cur / 60, [`shapes[${n}].x1`]: cur / 60 });
    }
    const di = $("#plotImp");
    if (di && di.data && impPlayhead >= 0 && $("#pane-impacts").classList.contains("on")) {
      const near = IMP.find(i => Math.abs(i.t - cur) < 1.5);
      Plotly.restyle(di, { x: [[near ? near.decay : null]], y: [[near ? near.weight : null]], z: [[near ? Math.log10(Math.max(60, near.bright)) : null]] }, [impPlayhead]);
    }
  }

  // ---------------- places ----------------
  let markA = null;
  function setupPlaces() {
    $("#markIn").onclick = () => { markA = Math.round(cur); $("#markIn").textContent = `Start ${fmt(markA)} ✓`; };
    $("#markOut").onclick = () => {
      if (markA == null) return;
      const b = Math.round(cur);
      if (b <= markA) { alert("Move the playhead past the start first."); return; }
      PLACES.push({ a: markA, b, kind: $("#placeKind").value });
      PLACES.sort((x, y) => x.a - y.a);
      markA = null; $("#markIn").textContent = "Mark start";
      savePlaces(); renderPlaces();
    };
    $("#exportPlaces").onclick = () => {
      const blob = new Blob([JSON.stringify(PLACES, null, 1)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "places.json"; a.click();
    };
    $("#importPlaces").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(s => { PLACES = JSON.parse(s); savePlaces(); renderPlaces(); });
    };
    renderPlaces();
  }
  function renderPlaces() {
    $("#placeList").innerHTML = PLACES.length ? PLACES.map((r, i) => `<li><span style="color:${PLACE_C[r.kind]}">■</span> <span class="num">${fmt(r.a)}–${fmt(r.b)}</span> <span>${r.kind}</span> <button data-go="${r.a}">go</button><button data-del="${i}">×</button></li>`).join("")
      : `<li style="color:var(--mute)">No places marked yet. Play the film, pick a place, then Mark start and Mark end.</li>`;
    $("#placeList").querySelectorAll("[data-go]").forEach(b => b.onclick = () => seek(+b.dataset.go));
    $("#placeList").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { PLACES.splice(+b.dataset.del, 1); savePlaces(); renderPlaces(); });
    if ($("#plotStrata").layout) drawStrata();
  }
})();
