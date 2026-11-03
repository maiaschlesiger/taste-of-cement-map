/* Sound map of Taste of Cement — interactive viewer.
   Data: data/data.json (per-second points, rhymes, regions), impacts.json, cuts.json, places.json */
(() => {
  "use strict";

  // ---------------- palette ----------------
  const C = { blue: "#1f63ad", lblue: "#8fb8e3", orange: "#ff6a1f", pink: "#ff85b8", yellow: "#fbbf00", maroon: "#932a10",
              green: "#3a7d3e", olive: "#9b9a00", cream: "#e6d6c4", grey: "#c4bcb2", ink: "#1d1b19", mute: "#7a736b" };

  // building-vs-bombing categories used by the 3D comparison
  const CAT = {
    tool:   { c: C.blue,   label: "Tools & metal", long: "hammers, jackhammers, drills, clanging metal", op: 0.9 },
    engine: { c: C.lblue,  label: "Engines & heavy machines", long: "cement mixers, trucks, cranes, rumbling motors (and, the computer can't tell, tanks)", op: 0.75 },
    bomb:   { c: C.orange, label: "Bombs, gunfire, thunder", long: "explosions, booms, gunshots, artillery, thunder", op: 1 },
    both:   { c: C.pink,   label: "Heard as both at once", long: "seconds where the computer hears building work and a blast together", op: 1 },
    other:  { c: C.cream,  label: "Everything else", long: "voices, music, wind, the sea, silence", op: 0.35 },
  };
  // sound-world families used by the timeline
  const FAM = {
    machine: { c: C.blue,   label: "Machines / tools / engines" },
    war:     { c: C.orange, label: "Bombs / gunfire / thunder" },
    voice:   { c: C.pink,   label: "Voice" },
    music:   { c: C.yellow, label: "Music / score" },
    water:   { c: C.lblue,  label: "Water / sea" },
    silence: { c: C.cream,  label: "Silence" },
    air:     { c: C.olive,  label: "Wind / rustle / noise" },
    ambient: { c: C.grey,   label: "Unclassified ambience" },
    media:   { c: C.green,  label: "TV / radio" },
  };
  const READ = {
    war:     { c: C.orange, label: "Computer hears: bomb" },
    machine: { c: C.blue,   label: "Computer hears: machine/tool" },
    both:    { c: C.pink,   label: "Computer hears: both at once" },
    unclear: { c: C.grey,   label: "Computer: neither" },
  };

  // ---------------- measurements (axes), in plain language ----------------
  const pct = v => Math.round(v * 100) + "%";
  const AX = {
    weight:   { l: "Heaviness", t: "Heaviness: light → heavy", f: p => p.weight, lo: "light", hi: "heavy, felt in the chest", v: p => pct(p.weight) + " of its energy is deep bass",
                d: "How much of the sound is deep bass (below 250 Hz), the part you feel in your chest as much as hear. Explosions, engines and the cement mixer are heavy; hammer taps and voices are light." },
    bright:   { l: "Sharpness", t: "Sharpness: muffled → sharp (Hz)", f: p => p.bright, lo: "muffled, dull", hi: "sharp, metallic", v: p => Math.round(p.bright) + " Hz",
                d: "Where the sound's energy sits in pitch. Metal striking metal is sharp; a blast heard from far away loses its high tones and becomes muffled. Measured as the spectral centroid." },
    loud:     { l: "Loudness", t: "Loudness: quiet → loud (dB)", f: p => Math.max(-90, p.loud), lo: "quiet", hi: "loud", v: p => p.loud <= -120 ? "total silence" : p.loud + " dB",
                d: "How loud the second is (decibels, 0 = the loudest the recording allows, −60 = near silence)." },
    thud:     { l: "Jolt", t: "Jolt: soft → jolting (dB)", f: p => p.thud, lo: "soft onset", hi: "jolting", v: p => p.thud + " dB jump",
                d: "The biggest sudden jump in bass within the second: a slab dropped, a door slammed, a shell landing." },
    dens:     { l: "Pace", t: "Pace: sparse → rapid (hits per second)", f: p => p.dens, lo: "sparse", hi: "rapid", v: p => p.dens + " hits/s",
                d: "How many separate hits or onsets happen in the second: the rhythm of hammering, or of gunfire." },
    perc:     { l: "Hits vs. hum", t: "Hits vs. hum: steady → percussive", f: p => p.perc, lo: "steady hum", hi: "sharp hits", v: p => pct(p.perc) + " in hits",
                d: "Is the sound made of short hits (hammering, gunfire) or a continuous hum (engines, wind, music)?" },
    noisy:    { l: "Noisiness", t: "Noisiness: tonal → noisy", f: p => p.noisy, lo: "tonal (a note, a hum)", hi: "noise-like (debris, wind)", v: p => p.noisy.toFixed(3),
                d: "0 = a clear tone or hum; 1 = pure noise like wind, static or falling debris." },
    t:        { l: "Film time", t: "Film time: start → end (min)", f: p => p.t / 60, lo: "early in the film", hi: "late in the film", v: p => fmt(p.t),
                d: "When in the film this second happens." },
    p_build:  { l: "Sounds like building", t: "Sounds like building work (computer's confidence)", f: p => p.p_build, lo: "not like building", hi: "clearly building work", v: p => pct(p.p_build),
                d: "How sure a sound-recognition program (Google's YAMNet, trained on 2 million clips) is that this second contains tools, metal or engines." },
    p_bomb:   { l: "Sounds like bombs", t: "Sounds like bombs (computer's confidence)", f: p => p.p_bomb, lo: "not like a blast", hi: "clearly a blast", v: p => pct(p.p_bomb),
                d: "How sure the same program is that this second contains an explosion, boom, gunshot, artillery or thunder." },
    p_tool:   { l: "Sounds like tools", t: "Sounds like tools & metal (confidence)", f: p => p.p_tool, lo: "no tools", hi: "clearly tools", v: p => pct(p.p_tool),
                d: "Confidence that this second contains hammers, drills, jackhammers or clanging metal." },
    p_engine: { l: "Sounds like engines", t: "Sounds like engines (confidence)", f: p => p.p_engine, lo: "no engines", hi: "clearly engines", v: p => pct(p.p_engine),
                d: "Confidence that this second contains engines, trucks, heavy machinery or rumble." },
    echo:     { l: "Building ↔ bombing", t: "Resembles: building ← → bombing", f: p => p.echo, lo: "resembles building work", hi: "resembles bombing", v: p => (p.echo > 0 ? "+" : "") + p.echo.toFixed(2),
                d: "Compares the program's whole 'impression' of this second (1,024 numbers) with its impression of a typical bomb second and a typical building second. Negative: closer to building. Positive: closer to bombing. Near zero: it could be either." },
  };
  const COLOR_OPTS = { cat: "Building vs. bombing", t: "Film time", echo: "Building ↔ bombing resemblance", loud: "Loudness", place: "Places (your annotations)" };

  // ---------------- key moments (verified from the data; places to confirm against the picture) ----------------
  const NOTES = [
    { t: 110, short: "1:50 · hammer → 'gunfire'", text: "In the middle of a run of hammering (1:48–1:52), the computer hears one second as <b>gunfire (81%)</b>. The film's first minutes already blur work and war." },
    { t: 776, short: "12:56 · engine rumble", text: "An engine rumble on the building site. Its closest match among all the bomb sounds is <b>thunder at 70:23, 57 minutes later</b>." },
    { t: 1806, short: "30:06 · after total silence", text: "Right after the film's <b>only moment of total digital silence</b> (30:05, two seconds), a blast heard as explosion <i>and</i> breaking glass." },
    { t: 3292, short: "54:52 · loudest stretch", text: "Inside the film's <b>loudest stretch</b> (48:49–55:40): engine noise on a steady 2-second beat that the computer keeps hearing as <b>'Boom'</b>." },
    { t: 4223, short: "70:23 · 'thunder'", text: "The thunder that the engine rumble at 12:56 most resembles. A sound from the Beirut site returns almost an hour later as war." },
  ];

  // ---------------- guided questions (presets) ----------------
  const PRESETS = [
    { id: "overlap", name: "Where do building and bombing overlap?", x: "p_build", y: "p_bomb", z: "t", c: "cat", path: false, rh: false,
      body: s => `Left to right: how sure the computer is that a second is <b>building work</b>. Front to back: how sure it is that it's a <b>bomb</b>. Up: film time. Most seconds are one or the other, but <b>${s.n.both} seconds (pink)</b> are heard as both at once, and they cluster around <b>${s.bothMin}</b>.` },
    { id: "body", name: "Do they hit the body the same way?", x: "weight", y: "bright", z: "loud", c: "cat", path: false, rh: false,
      body: s => `Bombs and engines are <b>equally heavy</b> (typically ${pct(s.med.bomb.weight)} vs ${pct(s.med.engine.weight)} of their energy is deep bass) and about as loud (${s.med.bomb.loud} vs ${s.med.engine.loud} dB). What sets bombs apart is that they are <b>muffled</b>: ${s.med.bomb.bright} Hz against ${s.med.tool.bright} Hz for tools. A blast reaches the camera from far away; a hammer is right there.` },
    { id: "rhythm", name: "Does the rhythm of work echo the rhythm of war?", x: "dens", y: "perc", z: "thud", c: "cat", path: false, rh: false,
      body: s => `Tools are fast and percussive (typically ${s.med.tool.dens} hits per second). Bombs are sparse (${s.med.bomb.dens}/s) but <b>jolt</b> a little harder (${s.med.bomb.thud} dB jumps vs ${s.med.tool.thud} for tools). Still, the blue and orange clouds overlap: by these measures, a lot of the work sounds like the war.` },
    { id: "echo", name: "Which building sounds echo which bombs?", x: "t", y: "echo", z: "weight", c: "cat", path: false, rh: true,
      body: s => `Each line joins a building sound to the bomb sound it <b>most resembles</b> anywhere in the film. Many partners are seconds apart, where the edit layers them. Others are <b>far apart</b>: the engine rumble at 12:56 matches thunder at 70:23. Sounds from Beirut return as Syria, the way memory works.` },
  ];

  // ---------------- tour ----------------
  const TOUR = [
    { title: "Every dot is one second of the film", preset: "overlap", only: null,
      body: () => `<i>Taste of Cement</i> follows Syrian men building a high-rise in Beirut while their own homes in Syria are being bombed. They barely speak on screen, so the film tells their story through <b>sound</b>. This map lays out all 5,098 seconds of its soundtrack. Dots are placed by what each second <i>sounds like</i>, not by where it was filmed.` },
    { title: "Blue: the sound of building", preset: "overlap", only: ["tool", "engine"],
      body: s => `Dark blue is <b>tools and metal</b> (${s.n.tool} seconds); light blue is <b>engines and heavy machines</b> (${s.n.engine} seconds). This is the work the men do in exile, and it fills about a quarter of the film.` },
    { title: "Orange: the sound of bombs", preset: "overlap", only: ["bomb"],
      body: s => `Explosions, booms, gunfire and thunder take up just <b>${s.n.bomb} seconds</b>, about ${Math.round(100 * s.n.bomb / s.N)}% of the film. Yet the war is felt throughout, because the film keeps letting us hear it <i>inside</i> the building sounds.` },
    { title: "Pink: heard as both at once", preset: "overlap", only: ["both"], focus: 3292,
      body: s => `In <b>${s.n.both} seconds</b> the computer hears building work and a blast together. About half of them fall in the film's loudest stretch (48:49–55:40), where engine noise beats every 2 seconds and is heard again and again as 'Boom'.` },
    { title: "A hammer mistaken for gunfire", preset: "overlap", only: ["tool", "bomb"], focus: 110,
      body: () => `At 1:48–1:52 the computer hears hammer, hammer, <b>gunfire (81%)</b>, jackhammer, jackhammer. A program trained on millions of clips cannot reliably separate the sound of building from the sound of shooting. The film works in exactly that gap.` },
    { title: "Same weight in the body", preset: "body", only: ["tool", "engine", "bomb", "both"],
      body: s => PRESETS[1].body(s) },
    { title: "Echoes across the film", preset: "echo", only: ["tool", "engine", "bomb", "both"], focus: 776,
      body: s => PRESETS[3].body(s) },
    { title: "Why this matters", preset: "overlap", only: null,
      body: () => `Maps of migration usually draw a line from home to destination. This one shows what that line leaves out: the men have arrived, but the war has come with them, in the noise of their own labour. Building one city and the destruction of another <b>sound alike</b>. The film turns that into an experience; the map makes it measurable. <b>Now explore:</b> hover over any dot, and load the film above to hear it.` },
  ];

  const $ = s => document.querySelector(s);
  const wrap = (txt, n) => { const out = []; let line = ""; for (const w of txt.split(" ")) { if ((line + " " + w).trim().length > n) { out.push(line.trim()); line = w; } else line += " " + w; } out.push(line.trim()); return out.join("<br>"); };
  const fmt = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const LIGHT = { paper_bgcolor: "#ffffff", plot_bgcolor: "#ffffff", font: { color: C.ink, family: "IBM Plex Sans, sans-serif", size: 12 } };
  const sceneAxis = title => ({ title: { text: title, font: { size: 12 } }, gridcolor: "#ece3d8", zerolinecolor: "#d9cdbf", backgroundcolor: "#fbf7f2", showbackground: true, color: C.mute, showspikes: false });

  let P = [], RH = [], REG = [], IMP = [], CUTS = [], PLACES = [], STATS = null;
  let state = { x: "p_build", y: "p_bomb", z: "t", c: "cat", path: false, rh: false, notes: true, rhN: 40, t0: 0, t1: 85, hidden: new Set(), only: null, focus: null };
  let traceInfo = { playhead: -1, ab: -1 }, impPlayhead = -1;
  let cur = 0, A = null, B = null, stopAt = null, tourStep = -1;
  const media = $("#media");
  let hasMedia = false;

  // ---------------- load ----------------
  Promise.all(["data/data.json", "data/impacts.json", "data/cuts.json", "data/places.json"].map(u => fetch(u).then(r => r.json())))
    .then(([d, imp, cuts, places]) => {
      P = d.points; RH = d.rhymes; REG = d.regions; IMP = imp; CUTS = cuts;
      PLACES = loadPlaces(places);
      init();
    })
    .catch(e => { document.body.insertAdjacentHTML("afterbegin", `<p style="padding:20px;color:#e0301e">Could not load data (${e}). If you opened index.html straight from disk, run a local server instead (see README).</p>`); });

  function loadPlaces(fromFile) {
    try { const s = localStorage.getItem("toc-places"); if (s) return JSON.parse(s); } catch (e) { /* storage unavailable */ }
    return fromFile || [];
  }
  function savePlaces() { try { localStorage.setItem("toc-places", JSON.stringify(PLACES)); } catch (e) { /* ignore */ } }

  // ---------------- statistics used in captions (computed live from the data) ----------------
  function computeStats() {
    const med = arr => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
    const n = {}, m = {};
    for (const k in CAT) {
      const g = P.filter(p => p.cat === k); n[k] = g.length;
      m[k] = { weight: med(g.map(p => p.weight)), bright: Math.round(med(g.map(p => p.bright))), loud: Math.round(med(g.map(p => p.loud))),
               dens: med(g.map(p => p.dens)), thud: med(g.map(p => p.thud)).toFixed(1), perc: med(g.map(p => p.perc)) };
    }
    // where do "both" seconds cluster? (5-minute bins)
    const bins = {};
    P.filter(p => p.cat === "both").forEach(p => { const b = Math.floor(p.t / 300); bins[b] = (bins[b] || 0) + 1; });
    const top = Object.entries(bins).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([b]) => `${b * 5}–${b * 5 + 5} min`);
    // percentile ranks for hover qualifiers
    const ranks = {};
    for (const k in AX) { ranks[k] = P.map(p => AX[k].f(p)).sort((a, b) => a - b); }
    return { n, med: m, N: P.length, bothMin: top.join(" and "), ranks };
  }
  function rankOf(k, v) {
    const r = STATS.ranks[k]; let lo = 0, hi = r.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (r[mid] < v) lo = mid + 1; else hi = mid; }
    return lo / r.length;
  }
  function qualify(k, p) {
    const q = rankOf(k, AX[k].f(p));
    if (k === "t") return { word: q < 0.33 ? "early in the film" : q < 0.66 ? "middle of the film" : "late in the film", q };
    const hi = AX[k].hi.split(",")[0], lo = AX[k].lo.split(",")[0];
    const very = w => (w.includes(" ") ? w : `very ${w}`);
    const word = q > 0.8 ? very(hi) : q > 0.6 ? hi : q < 0.2 ? very(lo) : q < 0.4 ? lo : "middling";
    return { word, q };
  }

  function init() {
    STATS = computeStats();
    for (const id of ["#ax-x", "#ax-y", "#ax-z"]) { const s = $(id); for (const k in AX) s.add(new Option(AX[k].l, k)); }
    for (const k in COLOR_OPTS) $("#ax-c").add(new Option(COLOR_OPTS[k], k));
    PRESETS.forEach((p, i) => {
      const b = document.createElement("button");
      b.textContent = p.name; b.dataset.preset = p.id;
      b.onclick = () => { endTour(); applyPreset(i); };
      $("#presets").appendChild(b);
    });
    renderCatLegend();
    $("#legend").innerHTML = Object.entries(FAM).filter(([k]) => k !== "media").map(([, v]) => `<span style="--c:${v.c}">${v.label}</span>`).join("");

    const onAx = () => { endTour(); clearPreset(); draw3d(); };
    $("#ax-x").onchange = e => { state.x = e.target.value; onAx(); };
    $("#ax-y").onchange = e => { state.y = e.target.value; onAx(); };
    $("#ax-z").onchange = e => { state.z = e.target.value; onAx(); };
    $("#ax-c").onchange = e => { state.c = e.target.value; onAx(); };
    $("#showPath").onchange = e => { state.path = e.target.checked; draw3d(); };
    $("#showRhymes").onchange = e => { state.rh = e.target.checked; draw3d(); };
    $("#showNotes").onchange = e => { state.notes = e.target.checked; draw3d(); };
    $("#rhymeN").oninput = e => { state.rhN = +e.target.value; $("#rhymeNo").value = e.target.value; };
    $("#rhymeN").onchange = () => draw3d();
    $("#t0").onchange = e => { state.t0 = +e.target.value; draw3d(); };
    $("#t1").onchange = e => { state.t1 = +e.target.value; draw3d(); };
    $("#storyNext").onclick = () => goTour(tourStep + 1);
    $("#storyPrev").onclick = () => goTour(tourStep - 1);
    document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => showTab(b.dataset.tab));

    setupHover();
    setupPlayer();
    setupPlaces();
    applyPreset(0, true);
    showIntro();
    drawStrata();
    drawImpacts();
    setTime(0);
  }

  function renderCatLegend() {
    $("#catlegend").innerHTML = Object.entries(CAT).map(([k, v]) =>
      `<button class="cat ${state.hidden.has(k) ? "off" : ""}" data-cat="${k}" aria-pressed="${!state.hidden.has(k)}">
        <i style="background:${v.c}"></i><span><b>${v.label}</b> <em>${STATS.n[k].toLocaleString()} s</em><br><small>${v.long}</small></span></button>`).join("");
    $("#catlegend").querySelectorAll("button").forEach(b => b.onclick = () => {
      const k = b.dataset.cat; state.hidden.has(k) ? state.hidden.delete(k) : state.hidden.add(k);
      state.only = null; renderCatLegend(); draw3d();
    });
  }

  function showTab(name) {
    document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    document.querySelectorAll(".pane").forEach(p => p.classList.toggle("on", p.id === "pane-" + name));
    const id = { space: "plot3d", strata: "plotStrata", impacts: "plotImp" }[name];
    if (id) { Plotly.Plots.resize(id); updatePlayhead(); }
  }

  function applyPreset(i, quiet) {
    const p = PRESETS[i];
    Object.assign(state, { x: p.x, y: p.y, z: p.z, c: p.c, path: p.path, rh: p.rh });
    $("#ax-x").value = p.x; $("#ax-y").value = p.y; $("#ax-z").value = p.z; $("#ax-c").value = p.c;
    $("#showPath").checked = p.path; $("#showRhymes").checked = p.rh;
    document.querySelectorAll(".presets button").forEach((b, j) => b.classList.toggle("on", j === i));
    if (!quiet && tourStep < 0) setStory("Question", p.name, p.body(STATS), false);
    draw3d();
  }
  function clearPreset() { document.querySelectorAll(".presets button").forEach(b => b.classList.remove("on")); }

  // ---------------- story / tour panel ----------------
  function setStory(step, title, body, inTour) {
    $("#storyStep").textContent = step; $("#storyTitle").innerHTML = title; $("#storyBody").innerHTML = body;
    $("#storyPrev").style.visibility = inTour && tourStep > 0 ? "visible" : "hidden";
    $("#storyNext").textContent = inTour ? (tourStep < TOUR.length - 1 ? "Next →" : "Finish") : "Start the tour →";
    $("#story").classList.toggle("touring", !!inTour);
  }
  function showIntro() {
    setStory("Start here", "How alike do building and bombing sound?",
      `Take the 2-minute tour, pick a question on the left, or just hover over the dots. Blue is building work, orange is bombs, pink is both at once.`, false);
  }
  function goTour(i) {
    if (i >= TOUR.length) { endTour(); showIntro(); return; }
    if (i < 0) return;
    tourStep = i;
    const s = TOUR[i];
    applyPreset(PRESETS.findIndex(p => p.id === s.preset), true);
    state.only = s.only; state.focus = s.focus != null ? s.focus : null;
    setStory(`Tour · ${i + 1} of ${TOUR.length}`, s.title, s.body(STATS), true);
    draw3d();
    if (s.focus != null) seek(s.focus);
  }
  function endTour() {
    if (tourStep < 0) return;
    tourStep = -1; state.only = null; state.focus = null;
    $("#story").classList.remove("touring");
  }

  // ---------------- 3D sound space ----------------
  function placeOf(t) { const hit = PLACES.find(r => t >= r.a && t < r.b); return hit ? hit.kind : "unmarked"; }
  const PLACE_C = { "Beirut: construction site": C.blue, "Beirut: barracks / underground": C.maroon, "Beirut: city / sea": C.lblue, "Syria: war footage": C.orange, "Black screen / title": C.ink, "Other": C.green, "unmarked": "#ece3d8" };

  let traceMeta = [];   // per trace: array of point times (for hover lookup)
  function draw3d() {
    const fx = AX[state.x].f, fy = AX[state.y].f, fz = AX[state.z].f;
    const inRange = p => p.t >= state.t0 * 60 && p.t <= state.t1 * 60;
    const pts = P.filter(p => inRange(p) && !state.hidden.has(p.cat));
    const traces = []; traceMeta = [];
    const size = (p, k) => (k === "other" ? 1.2 : 2.2) + Math.max(0, (p.loud + 65) / (k === "other" ? 22 : 11));
    const dim = k => state.only && !state.only.includes(k);

    if (state.c === "cat" || state.c === "place") {
      const key = state.c === "cat" ? (p => p.cat) : (p => placeOf(p.t));
      const groups = {};
      for (const p of pts) (groups[key(p)] = groups[key(p)] || []).push(p);
      const order = state.c === "cat" ? ["other", "engine", "tool", "bomb", "both"] : Object.keys(PLACE_C);
      for (const k of order) {
        const g = groups[k]; if (!g) continue;
        const col = state.c === "cat" ? CAT[k].c : PLACE_C[k];
        const op = state.c === "cat" ? (dim(k) ? 0.06 : CAT[k].op) : 0.85;
        traces.push({ type: "scatter3d", mode: "markers", name: state.c === "cat" ? CAT[k].label : k, hoverinfo: "none",
          x: g.map(fx), y: g.map(fy), z: g.map(fz),
          marker: { size: g.map(p => size(p, k)), color: col, opacity: op, line: { width: k === "other" ? 0 : 0.6, color: "#ffffff" } } });
        traceMeta.push(g.map(p => p.t));
      }
    } else {
      const cf = state.c === "t" ? (p => p.t / 60) : AX[state.c].f;
      const scale = state.c === "echo" ? [[0, C.blue], [0.5, C.cream], [1, C.orange]] : state.c === "t" ? [[0, C.lblue], [0.33, C.pink], [0.66, C.orange], [1, C.maroon]] : [[0, C.cream], [0.5, C.yellow], [1, C.maroon]];
      traces.push({ type: "scatter3d", mode: "markers", name: COLOR_OPTS[state.c], hoverinfo: "none", x: pts.map(fx), y: pts.map(fy), z: pts.map(fz),
        marker: { size: pts.map(p => size(p, p.cat)), color: pts.map(cf), colorscale: scale, cmid: state.c === "echo" ? 0 : undefined, opacity: 0.9, showscale: true,
          colorbar: { title: { text: COLOR_OPTS[state.c], side: "right" }, thickness: 10, len: 0.6, tickfont: { size: 10 } }, line: { width: 0 } } });
      traceMeta.push(pts.map(p => p.t));
    }

    if (state.path) {
      const k = 3, sm = f => pts.map((_, i) => { let a = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(pts.length - 1, i + k); j++) { a += f(pts[j]); n++; } return a / n; });
      traces.push({ type: "scatter3d", mode: "lines", name: "Path through film time", hoverinfo: "skip", x: sm(fx), y: sm(fy), z: sm(fz),
        line: { color: sm(p => p.echo), colorscale: [[0, C.blue], [0.5, C.cream], [1, C.orange]], cmin: -0.4, cmax: 0.4, width: 3 } });
      traceMeta.push(null);
    }
    if (state.rh) {
      const xs = [], ys = [], zs = []; let n = 0;
      for (const [a, b] of RH) {
        if (n >= state.rhN) break;
        const pa = P[a], pb = P[b];
        if (!inRange(pa) || !inRange(pb)) continue;
        xs.push(fx(pa), fx(pb), null); ys.push(fy(pa), fy(pb), null); zs.push(fz(pa), fz(pb), null); n++;
      }
      traces.push({ type: "scatter3d", mode: "lines", name: "Echo: building → resembling bomb", hoverinfo: "skip", x: xs, y: ys, z: zs, line: { color: "rgba(147,42,16,0.5)", width: 2.5 } });
      traceMeta.push(null);
    }
    traces.push({ type: "scatter3d", mode: "markers", name: "Now playing", hoverinfo: "skip", showlegend: false, x: [null], y: [null], z: [null], marker: { size: 9, color: C.ink, line: { color: "#fff", width: 1 }, symbol: "diamond" } });
    traceMeta.push(null); traceInfo.playhead = traces.length - 1;
    traces.push({ type: "scatter3d", mode: "markers+text", name: "A/B", hoverinfo: "skip", showlegend: false, x: [], y: [], z: [], text: [], textposition: "top center", textfont: { color: C.ink, size: 13 },
      marker: { size: 8, color: [], symbol: "circle-open", line: { width: 3 } } });
    traceMeta.push(null); traceInfo.ab = traces.length - 1;

    // notes anchored in 3D
    const annotations = [];
    if (state.notes) {
      for (const nt of NOTES) {
        const p = P[nt.t];
        if (!inRange(p) || state.hidden.has(p.cat)) continue;
        const focus = state.focus === nt.t;
        annotations.push({ x: fx(p), y: fy(p), z: fz(p), text: focus ? wrap(nt.text.replace(/<[^>]+>/g, ""), 46) : nt.short, showarrow: true, arrowhead: 0, arrowwidth: 1, arrowcolor: C.ink,
          ax: 40, ay: -40, bgcolor: focus ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.72)", bordercolor: focus ? C.ink : "rgba(29,27,25,0.25)", borderpad: 4,
          font: { size: focus ? 12 : 11, color: C.ink }, align: "left", opacity: 1 });
      }
    }

    const camera = state.z === "t" ? { eye: { x: 1.75, y: 1.75, z: 0.8 } } : { eye: { x: 1.8, y: -1.75, z: 0.9 } };
    const layout = { ...LIGHT, margin: { l: 0, r: 0, t: 0, b: 0 }, showlegend: false, hovermode: "closest",
      scene: { xaxis: sceneAxis(AX[state.x].t), yaxis: sceneAxis(AX[state.y].t), zaxis: sceneAxis(AX[state.z].t), aspectmode: "cube", camera, annotations },
      uirevision: state.x + state.y + state.z };
    Plotly.react("plot3d", traces, layout, { displaylogo: false, responsive: true, modeBarButtonsToRemove: ["toImage", "resetCameraLastSave3d"] });
    $("#axdesc").innerHTML = [["Left–right", "x"], ["Front–back", "y"], ["Up–down", "z"]].map(([n, k]) => `<p><b>${n}: ${AX[state[k]].l}.</b> ${AX[state[k]].d}</p>`).join("");
    updatePlayhead();
    updateCompare();
  }

  // ---------------- hover card ----------------
  let mouse = { x: 0, y: 0 };
  function setupHover() {
    const div = $("#plot3d"), card = $("#hovercard"), box = div.parentElement;
    box.addEventListener("mousemove", e => { const b = box.getBoundingClientRect(); mouse = { x: e.clientX - b.left, y: e.clientY - b.top }; });
    let bound = false;
    const bind = () => {
      if (bound) return; bound = true;
      div.on("plotly_hover", ev => {
        const pt = ev.points && ev.points[0]; if (!pt) return;
        const meta = traceMeta[pt.curveNumber]; if (!meta) return;
        showCard(meta[pt.pointNumber]);
      });
      div.on("plotly_unhover", () => card.classList.remove("on"));
      div.on("plotly_click", ev => {
        const pt = ev.points && ev.points[0]; if (!pt) return;
        const meta = traceMeta[pt.curveNumber]; if (!meta) return;
        const t = meta[pt.pointNumber];
        if (ev.event && ev.event.shiftKey) B = t; else A = t;
        seek(t); updateCompare(); showCard(t);
      });
    };
    // plotly attaches .on after first plot
    const wait = setInterval(() => { if (div.on) { clearInterval(wait); bind(); } }, 50);
  }
  function showCard(t) {
    const p = P[t], card = $("#hovercard"), box = card.parentElement;
    const cat = CAT[p.cat];
    const heard = p.cat === "other"
      ? p.top.slice(0, 2).map(x => `${x[0]} (${pct(x[1])})`).join(", ")
      : [p.p_tool > 0.1 ? `${p.lab.tool} (${pct(p.p_tool)})` : null, p.p_engine > 0.1 ? `${p.lab.engine} (${pct(p.p_engine)})` : null, p.p_bomb > 0.1 ? `${p.lab.bomb} (${pct(p.p_bomb)})` : null].filter(Boolean).join(", ") || p.top[0][0];
    const meaning = {
      tool: "A tool or metal sound: the work of building.",
      engine: "Engine or heavy-machine sound: the building site's machines, or a vehicle.",
      bomb: "Heard as a blast, gunfire or thunder: the war.",
      both: "Heard as building work <b>and</b> a blast at the same moment: here the two worlds overlap.",
      other: "Neither building nor bombing: voices, music, wind, the sea or silence.",
    }[p.cat];
    const rows = ["x", "y", "z"].filter((k, i, a) => a.findIndex(j => state[j] === state[k]) === i).map(k => {
      const key = state[k]; const q = qualify(key, p);
      return `<li><span>${AX[key].l}</span><b>${q.word}</b><em>${AX[key].v(p)}</em></li>`;
    }).join("");
    const note = NOTES.find(n => Math.abs(n.t - t) <= 2);
    const rhyme = RH.find(r => r[0] === t);
    card.innerHTML = `<div class="hc-head"><i style="background:${cat.c}"></i><b>${fmt(t)}</b> into the film · ${cat.label}</div>
      <p class="hc-mean">${meaning}</p>
      <p class="hc-heard">The computer hears: <b>${heard}</b></p>
      <ul class="hc-rows">${rows}</ul>
      ${rhyme ? `<p class="hc-note">Most resembles the bomb sound at <b>${fmt(rhyme[1])}</b>${Math.abs(rhyme[1] - t) > 60 ? `, ${Math.round(Math.abs(rhyme[1] - t) / 60)} minutes ${rhyme[1] > t ? "later" : "earlier"}` : ""}.</p>` : ""}
      ${note ? `<p class="hc-note">${note.text}</p>` : ""}
      <p class="hc-hint">${hasMedia ? "Click to hear this second (A). Shift-click sets B." : "Load the film above to hear it. Click sets A, shift-click sets B."}</p>`;
    card.classList.add("on");
    const bw = box.clientWidth, bh = box.clientHeight, cw = card.offsetWidth, ch = card.offsetHeight;
    let x = mouse.x + 18, y = mouse.y + 14;
    if (x + cw > bw - 8) x = mouse.x - cw - 18;
    if (y + ch > bh - 8) y = Math.max(8, bh - ch - 8);
    card.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
  }

  // ---------------- compare ----------------
  const CMP_KEYS = ["weight", "bright", "loud", "thud", "dens", "perc", "p_build", "p_bomb"];
  const norm = (k, v) => rankOf(k, v);
  function updateCompare() {
    const desc = t => { const p = P[t]; return `${fmt(t)} · ${CAT[p.cat].label}`; };
    $("#slotA span").textContent = A == null ? "click a dot" : desc(A);
    $("#slotB span").textContent = B == null ? "shift-click a dot" : desc(B);
    $("#playA").disabled = A == null || !hasMedia;
    $("#playB").disabled = B == null || !hasMedia;
    $("#playAB").disabled = A == null || B == null || !hasMedia;
    let html = "";
    if (A != null || B != null) {
      html += `<span></span><span style="color:${C.green}">A</span><span style="color:${C.maroon}">B</span>`;
      for (const k of CMP_KEYS) {
        const bar = (t, c) => t == null ? "<span></span>" : `<div class="bar" title="${AX[k].v(P[t])}"><i style="width:${(norm(k, AX[k].f(P[t])) * 100).toFixed(0)}%;background:${c}"></i></div>`;
        html += `<span>${AX[k].l}</span>${bar(A, C.green)}${bar(B, C.maroon)}`;
      }
      if (A != null && B != null) {
        const d = Math.sqrt(CMP_KEYS.reduce((s, k) => s + (norm(k, AX[k].f(P[A])) - norm(k, AX[k].f(P[B]))) ** 2, 0) / CMP_KEYS.length);
        const gap = Math.abs(A - B);
        html += `<span>difference</span><span style="grid-column:span 2">${(d * 100).toFixed(0)} / 100 (${d < 0.15 ? "nearly identical" : d < 0.3 ? "similar" : d < 0.45 ? "different" : "very different"}) · ${gap >= 60 ? (gap / 60).toFixed(1) + " min" : gap + " s"} apart in the film</span>`;
      }
      html += `<span class="cmpnote">Bars show where each second ranks against the whole film (left = lowest, right = highest).</span>`;
    }
    $("#cmpbars").innerHTML = html;
    const div = $("#plot3d");
    if (div && div.data && traceInfo.ab >= 0) {
      const fx = AX[state.x].f, fy = AX[state.y].f, fz = AX[state.z].f;
      const sel = [[A, C.green, "A"], [B, C.maroon, "B"]].filter(s => s[0] != null);
      Plotly.restyle(div, { x: [sel.map(s => fx(P[s[0]]))], y: [sel.map(s => fy(P[s[0]]))], z: [sel.map(s => fz(P[s[0]]))], text: [sel.map(s => s[2])], "marker.line.color": [sel.map(s => s[1])], "marker.color": [sel.map(s => s[1])] }, [traceInfo.ab]);
    }
  }

  // ---------------- timeline / strata ----------------
  function drawStrata() {
    const T = P.map(p => p.t / 60);
    const shapes = [];
    for (const r of REG) shapes.push({ type: "rect", xref: "x", yref: "paper", x0: r.a / 60, x1: r.b / 60, y0: 0.9, y1: 0.98, fillcolor: FAM[r.fam].c, line: { width: 0 }, opacity: 0.95 });
    for (const r of PLACES) shapes.push({ type: "rect", xref: "x", yref: "paper", x0: r.a / 60, x1: r.b / 60, y0: 0.985, y1: 1.0, fillcolor: PLACE_C[r.kind] || "#888", line: { width: 0 } });
    for (const c of CUTS) shapes.push({ type: "line", xref: "x", yref: "paper", x0: c.t / 60, x1: c.t / 60, y0: 0, y1: 0.88, line: { color: c.kind === "scene" ? "rgba(29,27,25,0.35)" : "rgba(255,133,184,0.35)", width: 1, dash: c.kind === "scene" ? "solid" : "dot" } });
    shapes.push({ type: "line", xref: "x", yref: "paper", x0: 0, x1: 0, y0: 0, y1: 1, line: { color: C.ink, width: 1.5 } });

    const sm = (arr, k) => arr.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(arr.length - 1, i + k); j++) { s += arr[j]; n++; } return s / n; });
    const echo = sm(P.map(p => p.echo), 3);
    const traces = [
      { type: "scattergl", mode: "lines", x: T, y: P.map(p => Math.max(-90, p.loud)), name: "Loudness (dB)", yaxis: "y3", line: { color: C.mute, width: 1 }, hovertemplate: "%{y:.0f} dB<extra></extra>" },
      { type: "scattergl", mode: "lines", x: T, y: echo.map(v => Math.max(0, v)), name: "Resembles bombing", yaxis: "y2", fill: "tozeroy", line: { color: C.orange, width: 0.5 }, fillcolor: "rgba(255,106,31,0.6)", hoverinfo: "skip" },
      { type: "scattergl", mode: "lines", x: T, y: echo.map(v => Math.min(0, v)), name: "Resembles building", yaxis: "y2", fill: "tozeroy", line: { color: C.blue, width: 0.5 }, fillcolor: "rgba(31,99,173,0.5)", hoverinfo: "skip" },
    ];
    for (const k of ["war", "machine", "both", "unclear"]) {
      const g = IMP.filter(i => i.reading === k);
      traces.push({ type: "scatter", mode: "markers", x: g.map(i => i.t / 60), y: g.map(i => i.decay), yaxis: "y", name: "Impact · " + READ[k].label.replace(/Computer( hears)?: /, ""),
        marker: { color: READ[k].c, size: g.map(i => 5 + Math.max(0, (i.peak + 40) / 3)), line: { width: 1, color: "#fff" } },
        text: g.map(i => `${fmt(i.t)} · ${i.label}<br>rings for ${i.decay}s · bass ${pct(i.weight)}`), hoverinfo: "text" });
    }
    const layout = { ...LIGHT, margin: { l: 78, r: 20, t: 10, b: 70 }, shapes, hovermode: "closest",
      legend: { orientation: "h", y: -0.13, font: { size: 11 } },
      xaxis: { title: { text: "film time (minutes)", standoff: 6 }, range: [0, 85], gridcolor: "#ece3d8", dtick: 5, zeroline: false },
      yaxis3: { domain: [0.62, 0.88], title: { text: "loudness dB", font: { size: 11 } }, gridcolor: "#ece3d8", range: [-80, -5] },
      yaxis2: { domain: [0.32, 0.58], title: { text: "building ↔ bombing", font: { size: 11 } }, gridcolor: "#ece3d8", range: [-0.6, 0.6], zerolinecolor: C.grey },
      yaxis: { domain: [0, 0.28], title: { text: "impact rings for (s)", font: { size: 11 } }, gridcolor: "#ece3d8", range: [0, 4.2] },
      annotations: [{ xref: "paper", yref: "paper", x: 0, y: 0.99, xanchor: "right", text: "sound-world ", showarrow: false, font: { size: 10, color: C.mute } }] };
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
        hoverinfo: "text", hoverlabel: { bgcolor: "rgba(255,255,255,0.88)", bordercolor: C.ink, font: { color: C.ink } },
        marker: { size: g.map(i => 4 + Math.max(0, (i.peak + 40) / 2.5)), color: READ[k].c, opacity: 0.95, line: { width: 1, color: "#ffffff" } } });
    }
    traces.push({ type: "scatter3d", mode: "markers", hoverinfo: "skip", showlegend: false, x: [null], y: [null], z: [null], marker: { size: 10, color: C.ink, symbol: "diamond" } });
    impPlayhead = traces.length - 1;
    const layout = { ...LIGHT, margin: { l: 0, r: 0, t: 10, b: 0 }, legend: { x: 0, y: 1, bgcolor: "rgba(255,255,255,0.85)" },
      scene: { xaxis: sceneAxis("Rings for: short → long (s)"), yaxis: sceneAxis("Heaviness: light → heavy"),
        zaxis: { ...sceneAxis("Sharpness: muffled → sharp (Hz)"), tickvals: [2, 2.5, 3, 3.5], ticktext: ["100", "316", "1k", "3.2k"] }, aspectmode: "cube", camera: { eye: { x: 1.7, y: -1.5, z: 0.8 } } } };
    Plotly.react("plotImp", traces, layout, { displaylogo: false, responsive: true });
    $("#plotImp").on("plotly_click", ev => { const p = ev.points && ev.points[0]; if (p && p.customdata != null) seek(p.customdata); });

    const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
    let rows = "";
    for (const k of ["war", "machine", "both", "unclear"]) {
      const g = IMP.filter(i => i.reading === k);
      rows += `<tr><td><span style="color:${READ[k].c}">●</span> ${{ war: "bomb", machine: "machine", both: "both", unclear: "neither" }[k]}</td><td>${g.length}</td><td>${med(g.map(i => i.decay)).toFixed(2)}</td><td>${med(g.map(i => i.weight)).toFixed(2)}</td><td>${Math.round(med(g.map(i => i.bright)))}</td></tr>`;
    }
    $("#impStats").innerHTML = `<table><tr><th>heard as</th><th>n</th><th>rings s</th><th>bass</th><th>Hz</th></tr>${rows}</table><p style="font-family:var(--sans);color:var(--mute)">Medians. Hits heard as bombs ring on nearly twice as long, and are much more muffled, than hits heard as machines. That is the acoustics of distance and open space. Their heaviness overlaps heavily: in the body, a slab and a shell can land the same way.</p>`;
  }

  // ---------------- player ----------------
  function setupPlayer() {
    $("#file").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      media.src = URL.createObjectURL(f);
      media.classList.toggle("has", f.type.startsWith("video") || /\.(mp4|mov|m4v|webm|mkv)$/i.test(f.name));
      hasMedia = true;
      $("#play").disabled = false;
      $("#mediaHint").textContent = `${f.name}: loaded locally. Press play, or click any dot to hear that moment.`;
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
      const pl = PLACES.find(r => t >= r.a && t < r.b);
      $("#now").innerHTML = `<span class="chip" style="background:${CAT[p.cat].c}"></span><b>${CAT[p.cat].label}</b> · the computer hears ${p.top.map(x => `${x[0]} ${pct(x[1])}`).join(" · ")}<br>` +
        `loudness ${p.loud <= -120 ? "total silence" : p.loud + " dB"} · heaviness ${pct(p.weight)} · sharpness ${Math.round(p.bright)} Hz · resembles ${p.echo > 0.05 ? "bombing" : p.echo < -0.05 ? "building" : "either"}` +
        (pl ? ` · <b>${pl.kind}</b>` : "");
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
    if (di.data && impPlayhead >= 0 && $("#pane-impacts").classList.contains("on")) {
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
    $("#placeList").innerHTML = PLACES.length ? PLACES.map((r, i) => `<li><span style="color:${PLACE_C[r.kind]}">■</span> ${fmt(r.a)}–${fmt(r.b)} <span>${r.kind}</span> <button data-go="${r.a}">go</button><button data-del="${i}">×</button></li>`).join("")
      : `<li style="color:var(--mute)">No places marked yet. Play the film, pick a place, then Mark start and Mark end.</li>`;
    $("#placeList").querySelectorAll("[data-go]").forEach(b => b.onclick = () => seek(+b.dataset.go));
    $("#placeList").querySelectorAll("[data-del]").forEach(b => b.onclick = () => { PLACES.splice(+b.dataset.del, 1); savePlaces(); renderPlaces(); });
    if ($("#plotStrata").layout) drawStrata();
    if (state.c === "place" && $("#plot3d").data) draw3d();
  }
})();
