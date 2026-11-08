/* Sound map of Taste of Cement — interactive viewer.
   Map: a dot grid. Rows are stretches of the film, columns run from one sound quality to another,
   and each circle's size is how many seconds fall in that cell (like a population map).
   Timeline: one line with a dot per minute. Both are drawn here without a charting library. */
(() => {
  "use strict";

  // ---------------- palette & live tokens ----------------
  const root = document.documentElement;
  const tok = (n, d) => { const v = getComputedStyle(root).getPropertyValue(n).trim(); return v || d; };
  const num = (n, d) => { const v = parseFloat(tok(n, "")); return isNaN(v) ? d : v; };
  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let TH = {};

  const G = {
    tool:   { c: "#1f63ad", label: "Tools and metal", fam: "build" },
    engine: { c: "#8fb8e3", label: "Engines and machines", fam: "build" },
    bomb:   { c: "#ff6a1f", label: "Bombs", fam: "bomb" },
    both:   { c: "#ff85b8", label: "Heard as both", fam: "both" },
    env:    { c: "#a7b0bd", label: "Environment", fam: "env" },
  };
  const ORDER = ["env", "engine", "tool", "bomb", "both"];
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
    build: { kinds: ["Hammering and drilling", "Metal and clatter", "Engines", "Vehicles", "Rumble"] },
    bomb:  { kinds: ["Explosions", "Booms", "Gunfire", "Thunder"] },
    both:  { kinds: ["both"] },
    env:   { kinds: ["env"] },
  };
  // moments identified by watching the film (times in seconds; t2 = end of a stretch)
  const NOTES = [
    { t: 1733, text: "Seen in the film: bombs" },
    { t: 3098, text: "Seen in the film: a tank moving" },
    { t: 3162, text: "Seen in the film: a tank moving" },
    { t: 3197, text: "Seen in the film: construction machinery moving" },
    { t: 3210, text: "Seen in the film: a tank moving" },
    { t: 3254, text: "Seen in the film: a tank firing" },
    { t: 3267, text: "Seen in the film: drilling into a wall on the site" },
    { t: 3269, text: "Seen in the film: a tank firing" },
    { t: 3311, text: "Seen in the film: a tank moving" },
    { t: 3736, text: "Seen in the film: footsteps through tunnels" },
    { t: 3808, text: "Seen in the film: panicked clamour" },
    { t: 3875, t2: 4064, text: "Seen in the film: shovelling gravel to dig people out of the rubble" },
    { t: 4067, text: "Seen in the film: a helicopter approaching" },
    { t: 4584, t2: 4641, text: "Seen in the film: the construction lift rising" },
  ];
  const noteAt = t => NOTES.find(n => t >= n.t - 1 && t <= (n.t2 || n.t + 1));
  // war sounds seen in the film, each paired with a building sound. Pairs 2, 3 and 7 were matched by watching;
  // 1, 4, 5 and 6 by searching every construction second (outside the war stretches) for the closest sound
  // in timbre, loudness shape and level.
  const PAIRS = [
    { a: [1733, "Bombs"], b: [601, null] },
    { a: [3098, "Tank moving"], b: [3197, "Construction moving"] },
    { a: [3254, "Tank firing"], b: [3267, "Drilling a wall"] },
    { a: [3736, "Footsteps in tunnels"], b: [866, null] },
    { a: [3808, "Panicked clamour"], b: [2636, null] },
    { a: [3875, "Shovelling rubble"], b: [638, null] },
    { a: [4067, "Helicopter"], b: [4641, "Construction lift"] },
  ];

  const pct = v => Math.round(v * 100) + "%";
  // what runs left to right in the grid
  const METRICS = [
    { id: "bb", name: "Building ↔ bombs", f: p => p.p_bomb - p.p_build, range: [-1, 1], lo: "Sounds like building", hi: "Sounds like bombs",
      say: s => `<b>${s.n.both}</b> seconds are heard as building and bombing at once` },
    { id: "weight", name: "Heaviness", f: p => p.weight, range: null, lo: "Light", hi: "Heavy, felt in the chest",
      say: s => `Bombs and engines are equally heavy: <b>${pct(s.med.bomb.weight)}</b> and <b>${pct(s.med.engine.weight)}</b> deep bass` },
    { id: "bright", name: "Sharpness", f: p => Math.log10(Math.max(80, p.bright)), range: null, lo: "Muffled", hi: "Sharp, metallic",
      say: s => `Bombs are muffled (<b>${s.med.bomb.bright} Hz</b>); tools are sharp (<b>${s.med.tool.bright} Hz</b>)` },
    { id: "dens", name: "Pace", f: p => p.dens, range: null, lo: "Sparse", hi: "Rapid hits",
      say: s => `Tools hit <b>${s.med.tool.dens}</b> times a second; bombs land alone` },
  ];

  const $ = s => document.querySelector(s);
  const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const sfx = (e, d) => { if (window.SFX) window.SFX.play(e, d); };

  let P = [], STATS = null;
  const state = { t0: 0, t1: 85, hl: null, on: new Set(), metric: 0 };
  const slots = { A: null, B: null };

  function refreshTheme() {
    G.tool.c = tok("--c-tool", G.tool.c); G.engine.c = tok("--c-engine", G.engine.c); G.bomb.c = tok("--c-bomb", G.bomb.c);
    G.both.c = tok("--c-both", G.both.c); G.env.c = tok("--c-env", G.env.c);
    TH = { ink: tok("--ink", "#1f1f23"), mute: tok("--mute", "#7c7c85"), card: tok("--card", "#fff"), canvas: tok("--canvas", "#f4f4f5"), line: tok("--line", "#e4e4e7"),
           dim: num("--dim-op", 0.12), anim: reduceMotion ? 0 : num("--anim-ms", 320), size: num("--dot-scale", 1.2) / 1.2, font: tok("--font", "sans-serif") };
  }

  // ---------------- load ----------------
  fetch("data/data.json").then(r => r.json()).then(d => { P = d.points; init(); })
    .catch(e => { document.body.insertAdjacentHTML("afterbegin", `<p style="padding:20px;color:#e0301e">Could not load data (${e}). Open the site through a local server (see README).</p>`); });

  function classify(p) {
    if (p.cat === "tool" || p.cat === "engine") {
      p.kind = KIND_OF_LABEL[p.p_tool >= p.p_engine ? p.lab.tool : p.lab.engine] || (p.cat === "tool" ? "Hammering and drilling" : "Engines");
      p.group = p.kind === "Hammering and drilling" || p.kind === "Metal and clatter" ? "tool" : "engine";
    } else if (p.cat === "bomb") { p.group = "bomb"; p.kind = KIND_OF_LABEL[p.lab.bomb] || "Explosions"; }
    else if (p.cat === "both") { p.group = "both"; p.kind = "both"; }
    else { p.group = "env"; p.kind = "env"; }
    p.score = p.group === "bomb" || p.group === "both" ? p.p_bomb : p.group === "tool" ? p.p_tool : p.group === "engine" ? p.p_engine : 0;
  }
  function computeStats() {
    const med = arr => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
    const n = {}, m = {};
    for (const k of ["tool", "engine", "bomb", "both"]) {
      const g = P.filter(p => p.cat === k); n[k] = g.length;
      m[k] = { weight: med(g.map(p => p.weight)), bright: Math.round(med(g.map(p => p.bright))), dens: med(g.map(p => p.dens)) };
    }
    for (const M of METRICS) if (!M.range) { const v = P.map(M.f).sort((a, b) => a - b); M.range = [v[Math.floor(v.length * 0.01)], v[Math.ceil(v.length * 0.99) - 1]]; }
    return { n, med: m };
  }

  // ---------------- init ----------------
  function init() {
    refreshTheme();
    P.forEach(classify);
    STATS = computeStats();
    for (const f of ["build", "bomb", "both"]) FACETS[f].kinds.forEach(k => state.on.add(k));

    METRICS.forEach((m, i) => {
      const b = document.createElement("button");
      b.className = "qpill"; b.textContent = m.name; b.setAttribute("role", "tab");
      b.onclick = () => { setMetric(i); sfx("toggle"); };
      $("#presets").appendChild(b);
    });
    renderFacets();
    dualRange($("#rangeTime"), { min: 0, max: 85, step: 1, from: 0, to: 85, fmt: v => `${v} min`, onchange: (a, b) => { state.t0 = a; state.t1 = b; rebuild(); } });
    $("#fReset").onclick = () => { state.on.clear(); for (const f of ["build", "bomb", "both"]) FACETS[f].kinds.forEach(k => state.on.add(k)); setHighlight(null, true); renderFacets(); sfx("toggle"); rebuild(); };

    document.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); closeMenus(); showTab(b.dataset.tab); }));
    const bt = $("#sfxBtn"), m = $("#sfxMenu");
    bt.onclick = e => { e.stopPropagation(); const open = !m.classList.contains("open"); closeMenus(); if (open && window.SFX) { window.SFX.renderMenu(m); sfx("menu"); } m.classList.toggle("open", open); bt.setAttribute("aria-expanded", open); };
    m.addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", e => {
      if (!e.target.closest(".dd")) closeMenus();
      if (state.hl && !e.target.closest("#field, .swatch, .dd, .vs-slot, #compareBtn, #facets input")) setHighlight(null);
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeMenus(); if (state.hl) setHighlight(null); } });

    setupField();
    setupDock();
    setupPairs();
    setMetric(0, true);
    buildTimeline();
    window.addEventListener("resize", () => { layout(); draw(); });
    window.TOC = {
      retheme() { refreshTheme(); renderFacets(); rebuild(true); buildTimeline(); },
      P: () => P, G, fmt, showTab, slots: () => slots, media: () => null, pauseMain() {},
    };
    document.dispatchEvent(new Event("toc-ready"));
  }

  function closeMenus() { const m = $("#sfxMenu"); if (m) { m.classList.remove("open"); $("#sfxBtn").setAttribute("aria-expanded", "false"); } }
  function showTab(name) {
    document.querySelectorAll(".pillnav > button[data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    document.querySelectorAll(".pane").forEach(p => p.classList.toggle("on", p.id === "pane-" + name));
    $(".pillnav").classList.toggle("dim", name === "compare");
    if (name === "space") { layout(); draw(); }
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }
  function setMetric(i, quiet) {
    state.metric = i;
    document.querySelectorAll(".qpill").forEach((b, j) => { b.classList.toggle("on", j === i); b.setAttribute("aria-selected", j === i); });
    const M = METRICS[i];
    $("#finding").innerHTML = M.say(STATS);
    $("#axLo").textContent = "← " + M.lo; $("#axHi").textContent = M.hi + " →";
    rebuild(quiet);
  }

  // ---------------- filter sidebar ----------------
  function counts() {
    const c = {};
    for (const p of P) { if (p.t < state.t0 * 60 || p.t > state.t1 * 60) continue; c[p.kind] = (c[p.kind] || 0) + 1; }
    return c;
  }
  const openFacets = new Set();
  function renderFacets() {
    const c = counts();
    const groups = [
      { id: "build", label: "Construction", sw: ["tool", "engine"], kinds: FACETS.build.kinds },
      { id: "bomb", label: "Bombs", sw: ["bomb"], kinds: FACETS.bomb.kinds },
      { id: "both", label: "Both at once", sw: ["both"], kinds: FACETS.both.kinds },
      { id: "env", label: "Environment", sw: ["env"], kinds: FACETS.env.kinds },
    ];
    $("#facets").innerHTML = groups.map(gr => {
      const on = gr.kinds.filter(k => state.on.has(k)).length, n = gr.kinds.reduce((a, k) => a + (c[k] || 0), 0);
      const expandable = gr.kinds.length > 1, open = openFacets.has(gr.id);
      const sw = gr.sw.map(g => `<span class="swatch" data-hl="${g}" style="background:${G[g].c}" title="Highlight ${G[g].label}"></span>`).join("");
      const kids = expandable && open ? `<div class="fc-kids">${gr.kinds.map(k => `<label class="fc"><input type="checkbox" data-k="${k}" ${state.on.has(k) ? "checked" : ""}><span></span><span class="fc-l">${k}</span><span class="fc-n">${(c[k] || 0).toLocaleString()}</span></label>`).join("")}</div>` : "";
      return `<div class="fg"><label class="fc master"><input type="checkbox" data-master="${gr.id}" ${on === gr.kinds.length ? "checked" : ""} ${on > 0 && on < gr.kinds.length ? 'data-ind="1"' : ""}>
        <span class="swatches">${sw}</span><span class="fc-l">${gr.label}</span><span class="fc-n">${n.toLocaleString()}</span>
        ${expandable ? `<button class="fc-more ${open ? "open" : ""}" data-open="${gr.id}" aria-label="Show types" aria-expanded="${open}"><svg viewBox="0 0 12 12"><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>` : "<span></span>"}</label>${kids}</div>`;
    }).join("");
    document.querySelectorAll("#facets [data-ind]").forEach(i => { i.indeterminate = true; });
    document.querySelectorAll("#facets input[data-k]").forEach(i => i.onchange = () => { i.checked ? state.on.add(i.dataset.k) : state.on.delete(i.dataset.k); sfx("toggle", i.checked); renderFacets(); rebuild(); });
    document.querySelectorAll("#facets input[data-master]").forEach(i => i.onchange = () => { FACETS[i.dataset.master].kinds.forEach(k => i.checked ? state.on.add(k) : state.on.delete(k)); sfx("toggle", i.checked); renderFacets(); rebuild(); });
    document.querySelectorAll("#facets [data-open]").forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); const id = b.dataset.open; openFacets.has(id) ? openFacets.delete(id) : openFacets.add(id); sfx("toggle"); renderFacets(); });
    document.querySelectorAll("#facets [data-hl]").forEach(s => s.onclick = e => { e.preventDefault(); e.stopPropagation(); setHighlight(state.hl === s.dataset.hl ? null : s.dataset.hl); });
  }
  function dualRange(el, o) {
    el.innerHTML = `<div class="dr-track"><i></i></div><input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.from}" aria-label="From">
      <input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${o.to}" aria-label="To"><div class="dr-vals"><span></span><span></span></div>`;
    const [a, b] = el.querySelectorAll("input"), fill = el.querySelector(".dr-track i"), [va, vb] = el.querySelectorAll(".dr-vals span");
    let tm = null;
    const upd = fire => {
      let x = +a.value, y = +b.value; if (x > y) [x, y] = [y, x];
      const L = (x - o.min) / (o.max - o.min) * 100, R = (y - o.min) / (o.max - o.min) * 100;
      fill.style.left = L + "%"; fill.style.width = (R - L) + "%"; va.textContent = o.fmt(x); vb.textContent = o.fmt(y);
      if (fire) { clearTimeout(tm); tm = setTimeout(() => { o.onchange(x, y); renderFacets(); }, 90); }
    };
    el.set = (x, y) => { a.value = x; b.value = y; upd(true); };
    a.oninput = b.oninput = () => upd(true); upd(false);
  }

  // ---------------- the dot grid ----------------
  const cv = () => $("#field");
  let W = 0, H = 0, cell = 20, NC = 30, NR = 26, padL = 0, padT = 0;
  let cells = [], cellMap = new Map(), anims = new Map(), hlAlpha = {}, raf = 0, hoverKey = null;
  function layout() {
    const c = cv(), box = c.parentElement, dpr = Math.min(2, window.devicePixelRatio || 1);
    W = box.clientWidth; H = box.clientHeight; if (!W || !H) return;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); c.style.width = W + "px"; c.style.height = H + "px";
    c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    const innerH = H - 28, innerW = W - 84;
    NR = Math.max(12, Math.min(34, Math.floor(innerH / 20)));
    cell = innerH / NR;
    NC = Math.max(10, Math.min(60, Math.floor(innerW / cell)));
    padL = 64 + (innerW - NC * cell) / 2; padT = 12;
  }
  function takenSet() {
    const t = new Set();
    for (const it of [slots.A, slots.B, drag.active ? drag.item : null]) if (it) it.ts.forEach(x => t.add(x));
    return t;
  }
  function cellOf(xv, t) {
    const M = METRICS[state.metric], [a, b] = M.range, span = (state.t1 - state.t0) * 60 || 1;
    const c = Math.max(0, Math.min(NC - 1, Math.floor((xv - a) / (b - a) * NC)));
    const r = Math.max(0, Math.min(NR - 1, Math.floor((t - state.t0 * 60) / span * NR)));
    return [c, r];
  }
  function rebuild(quick) {
    if (!W) layout();
    const M = METRICS[state.metric], taken = takenSet();
    const map = new Map();
    for (const p of P) {
      if (p.t < state.t0 * 60 || p.t > state.t1 * 60 || !state.on.has(p.kind) || taken.has(p.t)) continue;
      const [c, r] = cellOf(M.f(p), p.t), key = c + "," + r;
      let e = map.get(key); if (!e) { e = { key, c, r, n: 0, by: {}, ts: {}, rep: {} }; map.set(key, e); }
      e.n++; e.by[p.group] = (e.by[p.group] || 0) + 1; (e.ts[p.group] = e.ts[p.group] || []).push(p.t);
      if (!e.rep[p.group] || p.score > e.rep[p.group].score) e.rep[p.group] = p;
    }
    let nMax = 1;
    for (const e of map.values()) {
      const gs = Object.entries(e.by).sort((x, y) => (y[1] - x[1]) || (ORDER.indexOf(y[0]) - ORDER.indexOf(x[0])));
      e.g = gs[0][0]; e.g2 = gs[1] ? gs[1][0] : null; e.n2 = gs[1] ? gs[1][1] : 0; nMax = Math.max(nMax, e.n);
    }
    const maxR = cell * 0.47;
    const old = cellMap;
    cells = [...map.values()];
    cells.forEach(e => {
      e.R = Math.max(2.6, maxR * Math.min(1, TH.size * (0.3 + 0.7 * Math.sqrt(e.n / nMax))));
      e.R2 = e.g2 ? e.R * Math.sqrt(e.n2 / e.n) * 0.85 : 0;
      const prev = old.get(e.key);
      e.from = quick || !TH.anim ? e.R : prev ? prev.cur || prev.R : 0; e.cur = e.from;
    });
    cellMap = map;
    animate();
  }
  function animate() {
    cancelAnimationFrame(raf);
    const t0 = performance.now(), dur = TH.anim || 1;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      for (const c of cells) c.cur = c.from + (c.R - c.from) * e;
      for (const g in G) { const target = state.hl ? (g === state.hl ? 1 : TH.dim) : 1; const a = hlAlpha[g] == null ? 1 : hlAlpha[g]; hlAlpha[g] = a + (target - a) * Math.min(1, e + 0.15); }
      draw();
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  const cx = c => padL + (c + 0.5) * cell, cy = r => padT + (r + 0.5) * cell;
  function draw() {
    const c = cv(); if (!c || !W) return;
    const g = c.getContext("2d");
    g.clearRect(0, 0, W, H);
    // the grid itself: faint dots everywhere, like an empty map
    g.fillStyle = TH.line;
    for (let r = 0; r < NR; r++) for (let k = 0; k < NC; k++) { g.beginPath(); g.arc(cx(k), cy(r), 1.6, 0, 7); g.fill(); }
    // time marks on the left
    g.fillStyle = TH.mute; g.font = `12px ${TH.font}`; g.textAlign = "right"; g.textBaseline = "middle";
    const span = state.t1 - state.t0;
    for (let r = 0; r < NR; r += Math.max(1, Math.round(NR / 6))) g.fillText(`${Math.round(state.t0 + r / NR * span)} min`, padL - 10, cy(r));
    // circles
    for (const e of cells) {
      const R = e.cur * (e.key === hoverKey ? 1.18 : 1); if (R < 0.4) continue;
      g.globalAlpha = hlAlpha[e.g] == null ? 1 : hlAlpha[e.g];
      g.fillStyle = G[e.g].c; g.beginPath(); g.arc(cx(e.c), cy(e.r), R, 0, 7); g.fill();
      if (e.g2 && e.R2 > 1.2) {
        g.globalAlpha = hlAlpha[e.g2] == null ? 1 : Math.max(hlAlpha[e.g2], g.globalAlpha);
        g.fillStyle = TH.card; g.beginPath(); g.arc(cx(e.c), cy(e.r), e.R2 * (e.cur / e.R) + 1.4, 0, 7); g.fill();
        g.fillStyle = G[e.g2].c; g.beginPath(); g.arc(cx(e.c), cy(e.r), e.R2 * (e.cur / e.R), 0, 7); g.fill();
      }
    }
    g.globalAlpha = 1;
    drawPairs(g);
    // where dots in A and B came from
    for (const [s, it] of [["A", slots.A], ["B", slots.B]]) {
      if (!it) continue;
      const ps = it.ts.map(t => P[t]); const M = METRICS[state.metric];
      const [c, r] = cellOf(ps.reduce((a, p) => a + M.f(p), 0) / ps.length, ps.reduce((a, p) => a + p.t, 0) / ps.length);
      g.strokeStyle = it.color; g.lineWidth = 2; g.beginPath(); g.arc(cx(c), cy(r), cell * 0.42, 0, 7); g.stroke();
      g.fillStyle = TH.ink; g.font = `600 11px ${TH.font}`; g.textAlign = "center"; g.fillText(s, cx(c), cy(r));
    }
  }
  function hit(x, y) {
    const c = Math.floor((x - padL) / cell), r = Math.floor((y - padT) / cell);
    const e = cellMap.get(c + "," + r); if (!e) return null;
    return Math.hypot(x - cx(c), y - cy(r)) <= Math.max(e.R, 7) + 2 ? e : null;
  }

  // ---------------- hover, click, drag ----------------
  const drag = { active: false, pending: false, item: null, sx: 0, sy: 0, cell: null };
  let pinned = false;
  function itemFrom(e) {
    const g = e.g, ts = [...e.ts[g]].sort((a, b) => a - b), rep = e.rep[g];
    const kinds = {}; ts.forEach(t => { kinds[P[t].kind] = (kinds[P[t].kind] || 0) + 1; });
    const top = Object.entries(kinds).sort((a, b) => b[1] - a[1])[0][0];
    const label = g === "env" || g === "both" ? G[g].label : top;
    return { g, n: ts.length, ts, rep: rep.t, label, color: G[g].c };
  }
  function setupField() {
    const c = cv(), card = $("#hovercard");
    layout();
    const local = ev => { const b = c.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
    c.addEventListener("pointermove", ev => {
      if (drag.active) return;
      const [x0, y0] = local(ev), pi = pairHit(x0, y0);
      if (pi >= 0) { if (pairHover !== pi) { pairHover = pi; hoverKey = null; sfx("hover"); draw(); syncPairList(); } c.style.cursor = "pointer"; showPairCard(pi, x0, y0); return; }
      if (pairHover >= 0 && !pairListHover) { pairHover = -1; draw(); syncPairList(); }
      const [x, y] = [x0, y0], e = hit(x, y);
      if ((e && e.key) !== hoverKey) { hoverKey = e ? e.key : null; if (e) sfx("hover"); draw(); }
      c.style.cursor = e ? "grab" : "default";
      if (e && !pinned) showCard(e, x, y); else if (!e && !pinned) card.classList.remove("on");
    });
    c.addEventListener("pointerleave", () => { if (!drag.active) { hoverKey = null; draw(); if (!pinned) card.classList.remove("on"); } });
    c.addEventListener("pointerdown", ev => {
      const [x, y] = local(ev);
      const pi = pairHit(x, y); if (pi >= 0) { loadPair(pi); return; }
      const e = hit(x, y);
      if (pinned) { pinned = false; card.classList.remove("on"); }
      if (!e) { if (state.hl) setHighlight(null); return; }
      if (ev.pointerType === "touch") { hoverKey = e.key; draw(); click(e); pinned = true; showCard(e, x, y, true); return; }
      ev.preventDefault();
      Object.assign(drag, { pending: true, active: false, item: itemFrom(e), sx: ev.clientX, sy: ev.clientY, cell: e });
      drag.timer = setTimeout(() => { if (drag.pending) beginDrag(drag.sx, drag.sy); }, 170);
    });
    window.addEventListener("pointermove", ev => {
      if (drag.pending && !drag.active && Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 4) beginDrag(ev.clientX, ev.clientY);
      if (drag.active) moveGhost(ev.clientX, ev.clientY);
    });
    window.addEventListener("pointerup", ev => {
      clearTimeout(drag.timer);
      if (drag.active) { endDrag(ev.clientX, ev.clientY); return; }
      if (drag.pending) { drag.pending = false; click(drag.cell); }
    });
    $("#plotbox").addEventListener("click", ev => { const b = ev.target.closest("[data-put]"); if (b && pinnedCell) { putInSlot(b.dataset.put, itemFrom(pinnedCell)); pinned = false; card.classList.remove("on"); } });
    $("#plotbox").addEventListener("pointerdown", () => setTimeout(() => $("#plotHint").classList.add("gone"), 4000), { once: true });
  }
  function click(e) {
    const rep = e.rep[e.g];
    sfx("click", { group: e.g, loud: rep.loud, bright: rep.bright, weight: rep.weight });
    setHighlight(state.hl === e.g ? null : e.g);
  }
  let pinnedCell = null;
  function showCard(e, x, y, pin) {
    const card = $("#hovercard"); pinnedCell = e;
    const it = itemFrom(e), first = fmt(it.ts[0]), last = fmt(it.ts[it.ts.length - 1]);
    const p = P[it.rep];
    const heard = e.g === "env" ? "" : [p.p_tool > 0.1 && p.lab.tool, p.p_engine > 0.1 && p.lab.engine, p.p_bomb > 0.1 && p.lab.bomb].filter(Boolean).join(" · ");
    const also = e.g2 ? `<p class="hc-sub"><i class="mini-dot" style="background:${G[e.g2].c}"></i>${e.n2} s of ${G[e.g2].label.toLowerCase()} here too</p>` : "";
    const note = it.ts.map(noteAt).find(Boolean);
    card.innerHTML = `<div class="hc-head"><i style="background:${it.color}"></i><b>${it.label}</b></div>
      <p class="hc-sub">${it.n > 1 ? `${it.n} seconds · ${first}–${last}` : first}</p>
      ${heard ? `<p class="hc-sub">Heard as ${heard.toLowerCase()}</p>` : ""}${also}
      ${note ? `<p class="hc-note">${note.text}</p>` : ""}
      ${pin ? `<div class="hc-btns"><button class="btn" data-put="A">Put in A</button><button class="btn" data-put="B">Put in B</button></div>` : ""}`;
    card.classList.toggle("pinned", !!pin); card.classList.add("on");
    const bw = W, bh = H, cw = card.offsetWidth, ch = card.offsetHeight;
    let px = x + 18, py = y + 14;
    if (px + cw > bw - 8) px = x - cw - 18;
    if (py + ch > bh - 8) py = Math.max(8, bh - ch - 8);
    card.style.transform = `translate(${Math.max(8, px)}px, ${Math.max(8, py)}px)`;
  }
  function setHighlight(g, silent) {
    state.hl = g; if (!silent) sfx(g ? "highlight" : "toggle", !!g);
    animate();
  }
  function beginDrag(x, y) {
    drag.pending = false; drag.active = true;
    $("#hovercard").classList.remove("on");
    const gh = $("#ghost"), it = drag.item, size = Math.min(64, 18 + Math.sqrt(it.n) * 5);
    gh.style.setProperty("--sz", size + "px"); gh.style.background = it.color;
    gh.innerHTML = it.n > 1 ? `<span>${it.n}</span>` : "";
    gh.classList.add("on"); document.body.classList.add("dragging");
    moveGhost(x, y); sfx("pickup");
    rebuild(true);
  }
  function zoneAt(x, y) {
    for (const z of document.querySelectorAll(".vs-slot")) { const r = z.getBoundingClientRect(), p = 24; if (x > r.left - p && x < r.right + p && y > r.top - p && y < r.bottom + p) return z; }
    return null;
  }
  function moveGhost(x, y) {
    $("#ghost").style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    document.querySelectorAll(".vs-slot").forEach(z => z.classList.toggle("over", z === zoneAt(x, y)));
  }
  function endDrag(x, y) {
    const item = drag.item; drag.active = false; document.body.classList.remove("dragging");
    const z = zoneAt(x, y), gh = $("#ghost");
    document.querySelectorAll(".vs-slot").forEach(s => s.classList.remove("over"));
    const finish = () => { gh.classList.remove("on"); gh.style.transition = ""; gh.style.opacity = ""; };
    if (z) {
      const r = z.getBoundingClientRect();
      gh.style.transition = "transform .18s ease-in, opacity .18s";
      gh.style.transform = `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -50%) scale(.4)`; gh.style.opacity = "0";
      setTimeout(finish, 190);
      putInSlot(z.dataset.slot, item);
    } else { gh.style.transition = "opacity .2s"; gh.style.opacity = "0"; setTimeout(finish, 200); rebuild(); sfx("miss"); }
  }

  // ---------------- film pairs: drawn on the map and listed in the sidebar ----------------
  let pairHover = -1, pairListHover = false;
  const pairEnd = (pr, side) => {
    const [t, label] = pr[side], war = side === "a";
    return { t, label: label || `Closest building sound (${P[t].kind === "env" ? "ambience" : P[t].kind.toLowerCase()})`, g: war ? "bomb" : "engine", war };
  };
  function pairXY(t) { const M = METRICS[state.metric], [c, r] = cellOf(M.f(P[t]), t); return [cx(c), cy(r)]; }
  function drawPairs(g) {
    if (!P.length) return;
    PAIRS.forEach((pr, i) => {
      if ([pr.a[0], pr.b[0]].some(t => t < state.t0 * 60 || t > state.t1 * 60)) return;
      const [x1, y1] = pairXY(pr.a[0]), [x2, y2] = pairXY(pr.b[0]);
      const on = pairHover === i, faded = pairHover >= 0 && !on;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, bow = 0.18;
      g.globalAlpha = faded ? 0.25 : 1;
      g.strokeStyle = TH.ink; g.lineWidth = on ? 2.2 : 1.2;
      g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(mx - dy * bow, my + dx * bow, x2, y2); g.stroke();
      for (const [x, y, col] of [[x1, y1, G.bomb.c], [x2, y2, G.engine.c === "#8fb8e3" ? G.tool.c : G.tool.c]]) {
        g.fillStyle = TH.card; g.beginPath(); g.arc(x, y, on ? 11 : 9, 0, 7); g.fill();
        g.strokeStyle = col; g.lineWidth = 2.5; g.stroke();
        g.fillStyle = TH.ink; g.font = `600 ${on ? 11 : 10}px ${TH.font}`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(i + 1), x, y + 0.5);
      }
      if (on && pr.score != null) {
        const tx = mx - dy * bow * 0.5, ty = my + dx * bow * 0.5 - 14, txt = `${pr.score}%`;
        g.font = `600 12px ${TH.font}`; const w = g.measureText(txt).width + 12;
        g.fillStyle = TH.ink; g.beginPath(); g.roundRect ? g.roundRect(tx - w / 2, ty - 10, w, 20, 10) : g.rect(tx - w / 2, ty - 10, w, 20); g.fill();
        g.fillStyle = TH.card; g.fillText(txt, tx, ty + 0.5);
      }
      g.globalAlpha = 1;
    });
  }
  function pairHit(x, y) {
    for (let i = 0; i < PAIRS.length; i++) {
      const pr = PAIRS[i]; if ([pr.a[0], pr.b[0]].some(t => t < state.t0 * 60 || t > state.t1 * 60)) continue;
      for (const t of [pr.a[0], pr.b[0]]) { const [px, py] = pairXY(t); if (Math.hypot(x - px, y - py) <= 11) return i; }
    }
    return -1;
  }
  function showPairCard(i, x, y) {
    const pr = PAIRS[i], A = pairEnd(pr, "a"), B = pairEnd(pr, "b"), card = $("#hovercard");
    card.innerHTML = `<div class="hc-head"><i style="background:${G.bomb.c}"></i><b>${A.label}</b> <span class="mute">${fmt(A.t)}</span></div>
      <div class="hc-head"><i style="background:${G.tool.c}"></i><b>${B.label}</b> <span class="mute">${fmt(B.t)}</span></div>
      ${pr.score != null ? `<p class="hc-sub">${pr.score}% overlap once lined up</p>` : ""}
      <p class="hc-hint">Click to compare</p>`;
    card.classList.remove("pinned"); card.classList.add("on");
    const cw = card.offsetWidth, ch = card.offsetHeight;
    let px = x + 18, py = y + 14; if (px + cw > W - 8) px = x - cw - 18; if (py + ch > H - 8) py = Math.max(8, H - ch - 8);
    card.style.transform = `translate(${Math.max(8, px)}px, ${Math.max(8, py)}px)`;
  }
  function loadPair(i) {
    const pr = PAIRS[i], mk = side => { const e = pairEnd(pr, side); return { g: e.g, n: 1, ts: [e.t], rep: e.t, label: e.label, color: e.war ? G.bomb.c : G.tool.c }; };
    slots.A = mk("a"); slots.B = mk("b"); renderSlot("A", true); renderSlot("B", true); sfx("drop"); rebuild();
  }
  function syncPairList() { document.querySelectorAll("#pairs [data-pair]").forEach(b => b.classList.toggle("on", +b.dataset.pair === pairHover)); }
  function renderPairList() {
    $("#pairs").innerHTML = PAIRS.map((pr, i) => {
      const A = pairEnd(pr, "a"), B = pairEnd(pr, "b");
      return `<button class="pair-row" data-pair="${i}"><b>${i + 1}</b><span>${A.label} <i>↔</i> ${pr.b[1] || (P[pr.b[0]].kind === "env" ? "Ambience" : P[pr.b[0]].kind)}</span><em>${pr.score != null ? pr.score + "%" : ""}</em></button>`;
    }).join("");
    document.querySelectorAll("#pairs [data-pair]").forEach(b => {
      b.onmouseenter = () => { pairListHover = true; pairHover = +b.dataset.pair; draw(); syncPairList(); };
      b.onmouseleave = () => { pairListHover = false; pairHover = -1; draw(); syncPairList(); };
      b.onclick = () => loadPair(+b.dataset.pair);
    });
  }
  function setupPairs() {
    renderPairList();
    // overlap scores, using the comparison page's own measure
    const go = () => window.COMPARE.overlap(PAIRS.map(pr => [pr.a[0], pr.b[0]])).then(scores => { scores.forEach((s, i) => { PAIRS[i].score = s; }); renderPairList(); draw(); });
    if (window.COMPARE) go(); else document.addEventListener("DOMContentLoaded", () => window.COMPARE && go());
  }

  // ---------------- comparison dock ----------------
  function setupDock() {
    document.querySelectorAll(".vs-slot .vs-x").forEach(b => b.onclick = e => { e.stopPropagation(); const s = b.closest(".vs-slot").dataset.slot; slots[s] = null; renderSlot(s); sfx("clear"); rebuild(); });
    $("#compareBtn").onclick = () => { if (slots.A && slots.B && window.COMPARE) { sfx("compare"); window.COMPARE.open(slots.A, slots.B); } };
    ["A", "B"].forEach(s => renderSlot(s));
  }
  function putInSlot(s, it) {
    const other = s === "A" ? "B" : "A";
    if (slots[other] && slots[other].ts.some(t => it.ts.includes(t))) { slots[other] = null; renderSlot(other); }
    slots[s] = it; renderSlot(s, true); sfx("drop"); rebuild();
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

  // ---------------- timeline: one line, one dot per minute ----------------
  function buildTimeline() {
    const el = $("#tline"); if (!el || !P.length) return;
    const mins = [];
    for (let m = 0; m * 60 < P.length; m++) {
      const ps = P.slice(m * 60, m * 60 + 60), by = {};
      ps.forEach(p => { by[p.group] = (by[p.group] || 0) + 1; });
      const nonEnv = Object.entries(by).filter(([g]) => g !== "env").sort((a, b) => b[1] - a[1])[0];
      const g = nonEnv && nonEnv[1] >= 12 ? nonEnv[0] : "env";
      const loud = ps.reduce((a, p) => a + Math.max(-70, p.loud), 0) / ps.length;
      const note = NOTES.find(n => n.t < m * 60 + 60 && (n.t2 || n.t) >= m * 60);
      const kinds = {}; ps.filter(p => p.group === g).forEach(p => { kinds[p.kind] = (kinds[p.kind] || 0) + 1; });
      const kind = g === "env" || g === "both" ? G[g].label : Object.entries(kinds).sort((a, b) => b[1] - a[1])[0][0];
      mins.push({ m, g, loud, note, kind, n: by[g] || 0 });
    }
    const lo = Math.min(...mins.map(x => x.loud)), hi = Math.max(...mins.map(x => x.loud));
    el.innerHTML = `<div class="tl-line"></div>` + mins.map(x => {
      const s = 6 + 12 * (x.loud - lo) / (hi - lo || 1);
      const label = `<b>${x.m}:00</b> · ${x.kind}${x.note ? `<br><span>${x.note.text}</span>` : ""}`;
      return `<button class="tl-dot${x.note ? " key" : ""}" style="--c:${G[x.g].c};--s:${s.toFixed(1)}px" data-m="${x.m}" aria-label="Minute ${x.m}, ${x.kind}"><i></i><span class="tl-label">${label}</span></button>`;
    }).join("");
    $("#tticks").innerHTML = [0, 15, 30, 45, 60, 75, 85].map(m => `<span style="left:${m / 85 * 100}%">${m} min</span>`).join("");
    $("#legend").innerHTML = ["tool", "engine", "bomb", "both", "env"].map(g => `<span style="--c:${G[g].c}">${G[g].label}</span>`).join("");
    el.querySelectorAll(".tl-dot").forEach(b => {
      b.onmouseenter = () => sfx("hover");
      b.onclick = () => { const m = +b.dataset.m; const a = Math.max(0, m - 4), z = Math.min(85, m + 5); state.t0 = a; state.t1 = z; $("#rangeTime").set(a, z); sfx("toggle"); showTab("space"); };
    });
  }
})();
