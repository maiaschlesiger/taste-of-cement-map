/* Sound map of Taste of Cement — interactive viewer.
   Data: data/data.json (per-second points, rhymes, regions), impacts.json, cuts.json, places.json */
(() => {
  "use strict";

  const FAM = {
    machine: { c: "#c9b79c", label: "Machine / tools / engines" },
    war:     { c: "#ff5a36", label: "Detonation / gunfire / thunder" },
    voice:   { c: "#7fb7ff", label: "Voice" },
    music:   { c: "#b58cff", label: "Music / score" },
    water:   { c: "#3fd0c9", label: "Water / sea" },
    silence: { c: "#565c66", label: "Silence" },
    air:     { c: "#8f9aa6", label: "Wind / rustle / noise" },
    ambient: { c: "#6c727b", label: "Unclassified ambience" },
    media:   { c: "#ffd23f", label: "TV / radio" },
  };
  const READ = {
    war:     { c: "#ff5a36", label: "Classifier hears: detonation" },
    machine: { c: "#c9b79c", label: "Classifier hears: machine" },
    both:    { c: "#ffd23f", label: "Classifier hears: both at once" },
    unclear: { c: "#6c727b", label: "Classifier: neither" },
  };

  const AX = {
    t:         { l: "Film time (min)", f: p => p.t / 60, d: "Where in the film this second falls." },
    loud:      { l: "Loudness (dB)", f: p => Math.max(-90, p.loud), d: "Average level of the second (RMS, dB full scale). 0 is the maximum; −60 is near silence." },
    weight:    { l: "Low-frequency weight", f: p => p.weight, d: "Share of the energy below 250 Hz: the part of a sound you feel in your body. Engines, explosions and the cement mixer sit high; voices and birds sit low." },
    sub:       { l: "Sub-bass share (<80 Hz)", f: p => p.sub, d: "Share of the energy below 80 Hz: the rumble you feel more than hear." },
    bright:    { l: "Brightness (Hz)", f: p => p.bright, d: "Spectral centroid: the 'centre of gravity' of the frequencies. Metal-on-metal and hiss are bright; distant booms and drones are dark." },
    noisy:     { l: "Noisiness", f: p => p.noisy, d: "Spectral flatness: 0 = tonal (a note, a hum), 1 = pure noise (wind, debris, static)." },
    perc:      { l: "Percussiveness", f: p => p.perc, d: "Share of energy in short transients rather than sustained tones (harmonic/percussive separation)." },
    dens:      { l: "Event density (hits/s)", f: p => p.dens, d: "How many distinct sound onsets per second: the rhythm of labour or of fire." },
    thud:      { l: "Thud strength (dB)", f: p => p.thud, d: "Largest sudden jump in low-frequency energy within the second: a slam, a drop, a shell." },
    crest:     { l: "Impulsiveness (dB)", f: p => p.crest, d: "Peak-to-average ratio. High = sharp spikes over quiet; low = a continuous wall of sound." },
    p_war:     { l: "Classifier: detonation", f: p => p.p_war, d: "YAMNet's probability that this second contains Explosion, Boom, Gunshot, Artillery, Thunder or similar." },
    p_machine: { l: "Classifier: machine", f: p => p.p_machine, d: "YAMNet's probability of Hammer, Jackhammer, Drill, Engine, Vehicle, Truck, Rumble and similar." },
    p_voice:   { l: "Classifier: voice", f: p => p.p_voice, d: "Probability of speech, narration, crowd or shouting." },
    p_music:   { l: "Classifier: music", f: p => p.p_music, d: "Probability of music or score." },
    p_water:   { l: "Classifier: water", f: p => p.p_water, d: "Probability of water, waves or sea." },
    p_silence: { l: "Classifier: silence", f: p => p.p_silence, d: "Probability of silence." },
    echo:      { l: "Echo index (machine ← → war)", f: p => p.echo, d: "Compares the classifier's internal 'hearing' (a 1,024-number embedding) of this second with the average war second and the average machine second. −1 sounds like the building site; +1 sounds like the bombardment; around 0 it could be either." },
  };
  const COLOR_OPTS = { fam: "Sound family", t: "Film time", echo: "Echo index", loud: "Loudness", place: "Places (your annotations)" };

  const PRESETS = [
    { name: "Two cities, one space", note: "Machine vs detonation probability, rising through film time. Where do the two worlds overlap?", x: "p_machine", y: "p_war", z: "t", c: "fam", path: false, rh: true },
    { name: "The body of sound", note: "Weight × brightness × loudness: how each sound would land on a body.", x: "weight", y: "bright", z: "loud", c: "fam", path: false, rh: true },
    { name: "Rhythms: labour and fire", note: "Hits per second × percussiveness × thud: the rhythm of hammering next to the rhythm of shelling.", x: "dens", y: "perc", z: "thud", c: "fam", path: false, rh: false },
    { name: "The film as a journey", note: "Time × echo index × loudness, joined as a path: the film's route between the two sound-worlds.", x: "t", y: "echo", z: "loud", c: "echo", path: true, rh: false },
  ];

  const $ = s => document.querySelector(s);
  const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const DARK = { paper_bgcolor: "#121315", plot_bgcolor: "#121315", font: { color: "#e6e2da", family: "IBM Plex Sans, sans-serif", size: 12 } };
  const sceneAxis = title => ({ title: { text: title, font: { size: 12 } }, gridcolor: "#2b2e33", zerolinecolor: "#3a3e44", backgroundcolor: "#16181b", showbackground: true, color: "#9a968e" });

  let P = [], RH = [], REG = [], IMP = [], CUTS = [], PLACES = [];
  let state = { x: "p_machine", y: "p_war", z: "t", c: "fam", path: false, rh: true, rhN: 60, t0: 0, t1: 85 };
  let playheadIdx = { space: -1, imp: -1 };
  let cur = 0, A = null, B = null, stopAt = null;
  const media = $("#media");
  let hasMedia = false;

  // ---------------- load ----------------
  Promise.all(["data/data.json", "data/impacts.json", "data/cuts.json", "data/places.json"].map(u => fetch(u).then(r => r.json())))
    .then(([d, imp, cuts, places]) => {
      P = d.points; RH = d.rhymes; REG = d.regions; IMP = imp; CUTS = cuts;
      PLACES = loadPlaces(places);
      init();
    })
    .catch(e => { document.body.insertAdjacentHTML("afterbegin", `<p style="padding:20px;color:#ff5a36">Could not load data (${e}). If you opened index.html straight from disk, run a local server instead (see README).</p>`); });

  function loadPlaces(fromFile) {
    try { const s = localStorage.getItem("toc-places"); if (s) return JSON.parse(s); } catch (e) { /* storage unavailable */ }
    return fromFile || [];
  }
  function savePlaces() { try { localStorage.setItem("toc-places", JSON.stringify(PLACES)); } catch (e) { /* ignore */ } }

  function init() {
    // selects
    for (const id of ["#ax-x", "#ax-y", "#ax-z"]) {
      const s = $(id);
      for (const k in AX) s.add(new Option(AX[k].l, k));
    }
    for (const k in COLOR_OPTS) $("#ax-c").add(new Option(COLOR_OPTS[k], k));
    // presets
    PRESETS.forEach((p, i) => {
      const b = document.createElement("button");
      b.innerHTML = `${p.name}<small>${p.note}</small>`;
      b.onclick = () => applyPreset(i);
      $("#presets").appendChild(b);
    });
    // legend
    $("#legend").innerHTML = Object.entries(FAM).filter(([k]) => k !== "media").map(([, v]) => `<span style="--c:${v.c}">${v.label}</span>`).join("");

    $("#ax-x").onchange = e => { state.x = e.target.value; clearPreset(); draw3d(); };
    $("#ax-y").onchange = e => { state.y = e.target.value; clearPreset(); draw3d(); };
    $("#ax-z").onchange = e => { state.z = e.target.value; clearPreset(); draw3d(); };
    $("#ax-c").onchange = e => { state.c = e.target.value; clearPreset(); draw3d(); };
    $("#showPath").onchange = e => { state.path = e.target.checked; draw3d(); };
    $("#showRhymes").onchange = e => { state.rh = e.target.checked; draw3d(); };
    $("#rhymeN").oninput = e => { state.rhN = +e.target.value; $("#rhymeNo").value = e.target.value; };
    $("#rhymeN").onchange = () => draw3d();
    $("#t0").onchange = e => { state.t0 = +e.target.value; draw3d(); };
    $("#t1").onchange = e => { state.t1 = +e.target.value; draw3d(); };

    document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));

    setupPlayer();
    setupPlaces();
    applyPreset(0);
    drawStrata();
    drawImpacts();
    setTime(0);
  }

  function showTab(name) {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    document.querySelectorAll(".pane").forEach(p => p.classList.toggle("on", p.id === "pane-" + name));
    const id = { space: "plot3d", strata: "plotStrata", impacts: "plotImp" }[name];
    if (id) { Plotly.Plots.resize(id); updatePlayhead(); }
  }

  function applyPreset(i) {
    const p = PRESETS[i];
    Object.assign(state, { x: p.x, y: p.y, z: p.z, c: p.c, path: p.path, rh: p.rh });
    $("#ax-x").value = p.x; $("#ax-y").value = p.y; $("#ax-z").value = p.z; $("#ax-c").value = p.c;
    $("#showPath").checked = p.path; $("#showRhymes").checked = p.rh;
    document.querySelectorAll(".presets button").forEach((b, j) => b.classList.toggle("on", j === i));
    draw3d();
  }
  function clearPreset() { document.querySelectorAll(".presets button").forEach(b => b.classList.remove("on")); }

  // ---------------- 3D sound space ----------------
  function placeOf(t) {
    const hit = PLACES.find(r => t >= r.a && t < r.b);
    return hit ? hit.kind : "unmarked";
  }
  const PLACE_C = { "Beirut: construction site": "#c9b79c", "Beirut: barracks / underground": "#8a7f6e", "Beirut: city / sea": "#3fd0c9", "Syria: war footage": "#ff5a36", "Black screen / title": "#000000", "Other": "#b58cff", "unmarked": "#3a3e44" };

  function draw3d() {
    const fx = AX[state.x].f, fy = AX[state.y].f, fz = AX[state.z].f;
    const inRange = p => p.t >= state.t0 * 60 && p.t <= state.t1 * 60;
    const pts = P.filter(inRange);
    const hover = p => `<b>${fmt(p.t)}</b> · ${FAM[p.fam] ? FAM[p.fam].label : p.fam}<br>${p.top.map(t => `${t[0]} ${Math.round(t[1] * 100)}%`).join(" · ")}<br>loud ${p.loud} dB · echo ${p.echo}`;
    const traces = [];
    const base = { type: "scatter3d", mode: "markers", hoverinfo: "text" };

    if (state.c === "fam" || state.c === "place") {
      const key = state.c === "fam" ? (p => p.fam) : (p => placeOf(p.t));
      const groups = {};
      for (const p of pts) (groups[key(p)] = groups[key(p)] || []).push(p);
      const order = state.c === "fam" ? Object.keys(FAM) : Object.keys(PLACE_C);
      for (const k of order) {
        const g = groups[k]; if (!g) continue;
        const col = state.c === "fam" ? FAM[k].c : PLACE_C[k];
        traces.push({ ...base, name: state.c === "fam" ? FAM[k].label : k, x: g.map(fx), y: g.map(fy), z: g.map(fz), text: g.map(hover), customdata: g.map(p => p.t),
          marker: { size: g.map(p => 1.6 + Math.max(0, (p.loud + 65) / 14)), color: col, opacity: k === "war" ? 0.95 : 0.7, line: { width: 0 } } });
      }
    } else {
      const cf = state.c === "t" ? (p => p.t / 60) : AX[state.c].f;
      const scale = state.c === "echo" ? [[0, "#c9b79c"], [0.5, "#55595f"], [1, "#ff5a36"]] : state.c === "t" ? "Cividis" : "Inferno";
      traces.push({ ...base, name: COLOR_OPTS[state.c], x: pts.map(fx), y: pts.map(fy), z: pts.map(fz), text: pts.map(hover), customdata: pts.map(p => p.t),
        marker: { size: pts.map(p => 1.6 + Math.max(0, (p.loud + 65) / 14)), color: pts.map(cf), colorscale: scale, cmid: state.c === "echo" ? 0 : undefined, opacity: 0.8, showscale: true,
          colorbar: { title: { text: COLOR_OPTS[state.c], side: "right" }, thickness: 10, len: 0.6, tickfont: { size: 10 } }, line: { width: 0 } } });
    }

    if (state.path) {
      // smoothed (7 s) route through the space, coloured by echo index
      const k = 3, sm = f => pts.map((_, i) => { let a = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(pts.length - 1, i + k); j++) { a += f(pts[j]); n++; } return a / n; });
      const ec = sm(p => p.echo);
      traces.push({ type: "scatter3d", mode: "lines", name: "Path through time (7 s smoothed)", hoverinfo: "skip", x: sm(fx), y: sm(fy), z: sm(fz),
        line: { color: ec, colorscale: [[0, "#c9b79c"], [0.5, "#55595f"], [1, "#ff5a36"]], cmin: -0.4, cmax: 0.4, width: 3.5 } });
      traces.forEach(tr => { if (tr.mode === "markers" && tr.marker) tr.marker.opacity = 0.25; });
    }
    if (state.rh) {
      const xs = [], ys = [], zs = [];
      let n = 0;
      for (const [a, b] of RH) {
        if (n >= state.rhN) break;
        const pa = P[a], pb = P[b];
        if (!inRange(pa) || !inRange(pb)) continue;
        xs.push(fx(pa), fx(pb), null); ys.push(fy(pa), fy(pb), null); zs.push(fz(pa), fz(pb), null); n++;
      }
      traces.push({ type: "scatter3d", mode: "lines", name: "Rhyme: machine ↔ war", hoverinfo: "skip", x: xs, y: ys, z: zs, line: { color: "rgba(255,210,63,0.55)", width: 2 } });
    }
    // playhead, A, B
    traces.push({ type: "scatter3d", mode: "markers", name: "Now", hoverinfo: "skip", showlegend: false, x: [null], y: [null], z: [null], marker: { size: 9, color: "#ffffff", line: { color: "#000", width: 1 }, symbol: "diamond" } });
    playheadIdx.space = traces.length - 1;
    traces.push({ type: "scatter3d", mode: "markers+text", name: "A/B", hoverinfo: "skip", showlegend: false, x: [], y: [], z: [], text: [], textfont: { color: "#fff", size: 13 },
      marker: { size: 8, color: [], symbol: "circle-open", line: { width: 3 } } });

    const layout = { ...DARK, margin: { l: 0, r: 0, t: 10, b: 0 }, showlegend: true,
      legend: { x: 0, y: 1, bgcolor: "rgba(18,19,21,0.7)", font: { size: 11 }, itemsizing: "constant" },
      scene: { xaxis: sceneAxis(AX[state.x].l), yaxis: sceneAxis(AX[state.y].l), zaxis: sceneAxis(AX[state.z].l), aspectmode: "cube",
        camera: { eye: { x: 1.6, y: 1.5, z: 0.9 } } },
      uirevision: state.x + state.y + state.z };
    Plotly.react("plot3d", traces, layout, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["toImage"] });
    const div = $("#plot3d");
    div.removeAllListeners && div.removeAllListeners("plotly_click");
    div.on("plotly_click", ev => {
      const pt = ev.points && ev.points[0];
      if (!pt || pt.customdata == null) return;
      const t = pt.customdata;
      const shift = ev.event && ev.event.shiftKey;
      if (shift) B = t; else A = t;
      seek(t);
      updateCompare();
    });
    $("#axdesc").innerHTML = ["x", "y", "z"].map(k => `<b>${AX[state[k]].l}</b>: ${AX[state[k]].d}`).join("<br><br>");
    updatePlayhead();
    updateCompare();
  }

  // ---------------- compare ----------------
  const CMP_KEYS = ["loud", "weight", "bright", "noisy", "perc", "dens", "thud", "p_war", "p_machine", "echo"];
  const RANGE = {};
  function rangeOf(k) {
    if (!RANGE[k]) {
      const v = P.map(p => AX[k].f(p)).sort((a, b) => a - b);
      RANGE[k] = [v[Math.floor(v.length * 0.01)], v[Math.floor(v.length * 0.99)]];
    }
    return RANGE[k];
  }
  const norm = (k, v) => { const [a, b] = rangeOf(k); return Math.min(1, Math.max(0, (v - a) / (b - a || 1))); };

  function updateCompare() {
    const desc = t => { const p = P[t]; return `${fmt(t)} · ${p.top[0][0]} ${Math.round(p.top[0][1] * 100)}%`; };
    $("#slotA span").textContent = A == null ? "click a point" : desc(A);
    $("#slotB span").textContent = B == null ? "shift-click a point" : desc(B);
    $("#playA").disabled = A == null || !hasMedia;
    $("#playB").disabled = B == null || !hasMedia;
    $("#playAB").disabled = A == null || B == null || !hasMedia;
    let html = "";
    if (A != null || B != null) {
      html += `<span></span><span style="color:#ffd23f">A</span><span style="color:#7fe3ff">B</span>`;
      for (const k of CMP_KEYS) {
        const bar = (t, c) => t == null ? "<span></span>" : `<div class="bar" title="${AX[k].f(P[t]).toFixed(2)}"><i style="width:${(norm(k, AX[k].f(P[t])) * 100).toFixed(0)}%;background:${c}"></i></div>`;
        html += `<span>${AX[k].l.replace(/ \(.*\)/, "").replace("Classifier: ", "≈ ")}</span>${bar(A, "#ffd23f")}${bar(B, "#7fe3ff")}`;
      }
      if (A != null && B != null) {
        const d = Math.sqrt(CMP_KEYS.reduce((s, k) => s + (norm(k, AX[k].f(P[A])) - norm(k, AX[k].f(P[B]))) ** 2, 0) / CMP_KEYS.length);
        html += `<span>difference</span><span style="grid-column:span 2">${(d * 100).toFixed(0)} / 100 · ${Math.abs(A - B) >= 60 ? (Math.abs(A - B) / 60).toFixed(1) + " min apart in the film" : Math.abs(A - B) + " s apart in the film"}</span>`;
      }
    }
    $("#cmpbars").innerHTML = html;
    // A/B markers in 3D
    const div = $("#plot3d");
    if (div && div.data && playheadIdx.space >= 0) {
      const fx = AX[state.x].f, fy = AX[state.y].f, fz = AX[state.z].f;
      const sel = [[A, "#ffd23f", "A"], [B, "#7fe3ff", "B"]].filter(s => s[0] != null);
      Plotly.restyle(div, { x: [sel.map(s => fx(P[s[0]]))], y: [sel.map(s => fy(P[s[0]]))], z: [sel.map(s => fz(P[s[0]]))], text: [sel.map(s => s[2])], "marker.line.color": [sel.map(s => s[1])], "marker.color": [sel.map(s => s[1])] }, [playheadIdx.space + 1]);
    }
  }

  // ---------------- timeline / strata ----------------
  function drawStrata() {
    const T = P.map(p => p.t / 60);
    const shapes = [];
    // region band (row 1)
    for (const r of REG) shapes.push({ type: "rect", xref: "x", yref: "paper", x0: r.a / 60, x1: r.b / 60, y0: 0.9, y1: 0.98, fillcolor: FAM[r.fam].c, line: { width: 0 }, opacity: 0.95 });
    // places band
    for (const r of PLACES) shapes.push({ type: "rect", xref: "x", yref: "paper", x0: r.a / 60, x1: r.b / 60, y0: 0.985, y1: 1.0, fillcolor: PLACE_C[r.kind] || "#888", line: { width: 0 } });
    // cuts
    for (const c of CUTS) shapes.push({ type: "line", xref: "x", yref: "paper", x0: c.t / 60, x1: c.t / 60, y0: 0, y1: 0.88, line: { color: c.kind === "scene" ? "rgba(255,255,255,0.35)" : "rgba(127,183,255,0.18)", width: 1, dash: c.kind === "scene" ? "solid" : "dot" } });
    // playhead
    shapes.push({ type: "line", xref: "x", yref: "paper", x0: 0, x1: 0, y0: 0, y1: 1, line: { color: "#fff", width: 1.5 } });

    // smoothed echo (5 s)
    const sm = (arr, k) => arr.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(arr.length - 1, i + k); j++) { s += arr[j]; n++; } return s / n; });
    const echo = sm(P.map(p => p.echo), 3);
    const loud = P.map(p => p.loud);

    const traces = [
      { type: "scattergl", mode: "lines", x: T, y: loud, name: "Loudness (dB)", yaxis: "y3", line: { color: "#9a968e", width: 1 }, hovertemplate: "%{y:.0f} dB<extra></extra>" },
      { type: "scattergl", mode: "lines", x: T, y: echo.map(v => Math.max(0, v)), name: "Echo → war", yaxis: "y2", fill: "tozeroy", line: { color: "#ff5a36", width: 0.5 }, fillcolor: "rgba(255,90,54,0.5)", hoverinfo: "skip" },
      { type: "scattergl", mode: "lines", x: T, y: echo.map(v => Math.min(0, v)), name: "Echo → machine", yaxis: "y2", fill: "tozeroy", line: { color: "#c9b79c", width: 0.5 }, fillcolor: "rgba(201,183,156,0.5)", hoverinfo: "skip" },
    ];
    for (const k of ["war", "machine", "both", "unclear"]) {
      const g = IMP.filter(i => i.reading === k);
      traces.push({ type: "scatter", mode: "markers", x: g.map(i => i.t / 60), y: g.map(i => i.decay), yaxis: "y", name: "Impact · " + READ[k].label.replace("Classifier hears: ", "").replace("Classifier: ", ""),
        marker: { color: READ[k].c, size: g.map(i => 5 + Math.max(0, (i.peak + 40) / 3)), line: { width: 0 } },
        text: g.map(i => `${fmt(i.t)} · ${i.label}<br>decay ${i.decay}s · weight ${i.weight}`), hoverinfo: "text" });
    }
    const layout = { ...DARK, margin: { l: 78, r: 20, t: 10, b: 70 }, shapes, hovermode: "closest",
      legend: { orientation: "h", y: -0.13, font: { size: 11 } },
      xaxis: { title: { text: "film time (minutes)", standoff: 6 }, range: [0, 85], gridcolor: "#2b2e33", dtick: 5, zeroline: false },
      yaxis3: { domain: [0.62, 0.88], title: { text: "loudness dB", font: { size: 11 } }, gridcolor: "#2b2e33", range: [-80, -5] },
      yaxis2: { domain: [0.32, 0.58], title: { text: "echo index", font: { size: 11 } }, gridcolor: "#2b2e33", range: [-0.6, 0.6], zerolinecolor: "#55595f" },
      yaxis: { domain: [0, 0.28], title: { text: "impact decay s", font: { size: 11 } }, gridcolor: "#2b2e33", range: [0, 4.2] },
      annotations: [{ xref: "paper", yref: "paper", x: 0, y: 0.99, xanchor: "right", text: "sound-world ", showarrow: false, font: { size: 10, color: "#9a968e" } }] };
    Plotly.react("plotStrata", traces, layout, { displaylogo: false, responsive: true });
    const div = $("#plotStrata");
    div.removeAllListeners && div.removeAllListeners("plotly_click");
    div.on("plotly_click", ev => { const p = ev.points && ev.points[0]; if (p) seek(p.x * 60); });
    // click on empty area
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
        customdata: g.map(i => i.t), text: g.map(i => `<b>${fmt(i.t)}</b> · ${i.label}<br>decay ${i.decay}s · weight ${i.weight} · ${Math.round(i.bright)} Hz<br>peak ${i.peak} dB · detonation ${Math.round(i.war * 100)}% · machine ${Math.round(i.machine * 100)}%`),
        hoverinfo: "text", marker: { size: g.map(i => 4 + Math.max(0, (i.peak + 40) / 2.5)), color: READ[k].c, opacity: 0.9, line: { width: 0 } } });
    }
    traces.push({ type: "scatter3d", mode: "markers", hoverinfo: "skip", showlegend: false, x: [null], y: [null], z: [null], marker: { size: 10, color: "#fff", symbol: "diamond" } });
    playheadIdx.imp = traces.length - 1;
    const layout = { ...DARK, margin: { l: 0, r: 0, t: 10, b: 0 }, legend: { x: 0, y: 1, bgcolor: "rgba(18,19,21,0.7)" },
      scene: { xaxis: sceneAxis("Decay: time to fade 12 dB (s)"), yaxis: sceneAxis("Low-frequency weight"),
        zaxis: { ...sceneAxis("Brightness (Hz, log)"), tickvals: [2, 2.5, 3, 3.5], ticktext: ["100", "316", "1k", "3.2k"] }, aspectmode: "cube", camera: { eye: { x: 1.7, y: -1.5, z: 0.8 } } } };
    Plotly.react("plotImp", traces, layout, { displaylogo: false, responsive: true });
    $("#plotImp").on("plotly_click", ev => { const p = ev.points && ev.points[0]; if (p && p.customdata != null) seek(p.customdata); });

    const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
    let rows = "";
    for (const k of ["war", "machine", "both", "unclear"]) {
      const g = IMP.filter(i => i.reading === k);
      rows += `<tr><td><span style="color:${READ[k].c}">●</span> ${k}</td><td>${g.length}</td><td>${med(g.map(i => i.decay)).toFixed(2)}</td><td>${med(g.map(i => i.weight)).toFixed(2)}</td><td>${Math.round(med(g.map(i => i.bright)))}</td></tr>`;
    }
    $("#impStats").innerHTML = `<table><tr><th>heard as</th><th>n</th><th>decay s</th><th>weight</th><th>Hz</th></tr>${rows}</table><p style="font-family:var(--sans);color:var(--mute)">Medians. Hits heard as detonations ring on for nearly twice as long, and are much darker, than hits heard as machines. That is the acoustics of distance and open space. Their low-frequency <i>weight</i> ranges overlap heavily: in the body, a slab and a shell can land the same way.</p>`;
  }

  // ---------------- player ----------------
  function setupPlayer() {
    $("#file").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      media.src = URL.createObjectURL(f);
      media.classList.toggle("has", f.type.startsWith("video") || /\.(mp4|mov|m4v|webm|mkv)$/i.test(f.name));
      hasMedia = true;
      $("#play").disabled = false;
      $("#mediaHint").textContent = `${f.name}: loaded locally. Press play, or click any point to hear that moment.`;
      media.currentTime = cur;
      updateCompare();
    };
    $("#play").onclick = () => media.paused ? media.play() : media.pause();
    media.onplay = () => $("#play").textContent = "❚❚";
    media.onpause = () => $("#play").textContent = "▶";
    let last = 0;
    media.ontimeupdate = () => {
      if (stopAt != null && media.currentTime >= stopAt.t) { const n = stopAt.next; stopAt = null; media.pause(); if (n) n(); }
      const now = performance.now();
      if (now - last > 220) { last = now; setTime(media.currentTime, true); }
    };
    $("#scrub").oninput = e => seek(+e.target.value);
    $("#playA").onclick = () => playClip(A, 4);
    $("#playB").onclick = () => playClip(B, 4);
    $("#playAB").onclick = () => playClip(A, 4, () => setTimeout(() => playClip(B, 4), 500));
    document.addEventListener("keydown", e => {
      if (e.target.matches("input,select,textarea")) return;
      if (e.code === "Space" && hasMedia) { e.preventDefault(); $("#play").click(); }
    });
  }
  function playClip(t, len, next) {
    if (t == null || !hasMedia) return;
    media.currentTime = Math.max(0, t - 0.5);
    stopAt = { t: t + len, next };
    media.play();
  }
  function seek(t) {
    t = Math.max(0, Math.min(P.length - 1, t));
    if (hasMedia) media.currentTime = t;
    setTime(t);
  }
  function setTime(t, fromMedia) {
    cur = t;
    $("#clock").textContent = fmt(t);
    if (!fromMedia || document.activeElement !== $("#scrub")) $("#scrub").value = Math.round(t);
    const p = P[Math.min(P.length - 1, Math.floor(t))];
    if (p) {
      const reg = REG.find(r => t >= r.a && t < r.b);
      const pl = PLACES.find(r => t >= r.a && t < r.b);
      $("#now").innerHTML = `<span class="chip" style="background:${FAM[p.fam].c}"></span><b>${FAM[p.fam].label}</b> · ${p.top.map(x => `${x[0]} ${Math.round(x[1] * 100)}%`).join(" · ")}<br>` +
        `loudness ${p.loud <= -120 ? "digital zero (absolute silence)" : p.loud + " dB"} · weight ${p.weight} · brightness ${Math.round(p.bright)} Hz · echo ${p.echo > 0 ? "+" : ""}${p.echo}` +
        (reg ? ` · stretch ${fmt(reg.a)}–${fmt(reg.b)}` : "") + (pl ? ` · <b>${pl.kind}</b>` : "");
    }
    updatePlayhead();
  }
  function updatePlayhead() {
    const p = P[Math.min(P.length - 1, Math.floor(cur))];
    if (!p) return;
    const d3 = $("#plot3d");
    if (d3.data && playheadIdx.space >= 0 && $("#pane-space").classList.contains("on")) {
      const inR = p.t >= state.t0 * 60 && p.t <= state.t1 * 60;
      Plotly.restyle(d3, { x: [[inR ? AX[state.x].f(p) : null]], y: [[inR ? AX[state.y].f(p) : null]], z: [[inR ? AX[state.z].f(p) : null]] }, [playheadIdx.space]);
    }
    const ds = $("#plotStrata");
    if (ds.layout && $("#pane-strata").classList.contains("on")) {
      const n = ds.layout.shapes.length - 1;
      Plotly.relayout(ds, { [`shapes[${n}].x0`]: cur / 60, [`shapes[${n}].x1`]: cur / 60 });
    }
    const di = $("#plotImp");
    if (di.data && playheadIdx.imp >= 0 && $("#pane-impacts").classList.contains("on")) {
      const near = IMP.find(i => Math.abs(i.t - cur) < 1.5);
      Plotly.restyle(di, { x: [[near ? near.decay : null]], y: [[near ? near.weight : null]], z: [[near ? Math.log10(Math.max(60, near.bright)) : null]] }, [playheadIdx.imp]);
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
    $("#placeList").innerHTML = PLACES.length ? PLACES.map((r, i) => `<li><span style="color:${PLACE_C[r.kind]}">■</span> ${fmt(r.a)}–${fmt(r.b)} <span>${r.kind}</span> <button data-go="${r.a}">go</button><button data-del="${i}">×</button></li>`).join("")
      : `<li style="color:var(--mute)">No places marked yet. Play the film, pick a place, then Mark start and Mark end.</li>`;
    $("#placeList").querySelectorAll("[data-go]").forEach(b => b.onclick = () => seek(+b.dataset.go));
    $("#placeList").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { PLACES.splice(+b.dataset.del, 1); savePlaces(); renderPlaces(); });
    if ($("#plotStrata").layout) drawStrata();
    if (state.c === "place" && $("#plot3d").data) draw3d();
  }
})();
