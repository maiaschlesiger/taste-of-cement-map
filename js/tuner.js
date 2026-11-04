/* Design tuner: live sliders for every token in css/style.css.
   Opens with #tune on the site, or always in the preview build. "Save for Claude" stores the values
   in the artifact's database (preview only); "Copy values" copies them as CSS. */
(() => {
  "use strict";
  const root = document.documentElement;
  const FONTS = {
    "Figtree": "\"Figtree\", \"FigtreeLocal\", \"Helvetica Neue\", Arial, sans-serif",
    "Geist": "\"Geist\", \"Helvetica Neue\", Arial, sans-serif",
    "Hanken Grotesk": "\"Hanken Grotesk\", \"Helvetica Neue\", Arial, sans-serif",
    "Onest": "\"Onest\", \"Helvetica Neue\", Arial, sans-serif",
    "Manrope": "\"Manrope\", \"Helvetica Neue\", Arial, sans-serif",
  };
  // [token, label, kind, min, max, step, unit]   kind: color | range | font
  const GROUPS = [
    ["Typography", [
      ["--font", "Typeface", "font"],
      ["--fs", "Body size", "range", 11, 18, 0.5, "px"],
      ["--fs-small", "Small text", "range", 10, 15, 0.5, "px"],
      ["--fs-h2", "Card title", "range", 14, 30, 0.5, "px"],
      ["--fs-h1", "Site name", "range", 12, 24, 0.5, "px"],
      ["--fs-h3", "Section title", "range", 11, 22, 0.5, "px"],
      ["--fw-body", "Body weight", "range", 300, 500, 10, ""],
      ["--fw-head", "Heading weight", "range", 400, 800, 10, ""],
      ["--lh", "Line height", "range", 1.2, 1.9, 0.01, ""],
    ]],
    ["Colour", [
      ["--canvas", "Page background", "color"],
      ["--card", "Cards", "color"],
      ["--ink", "Text", "color"],
      ["--mute", "Secondary text", "color"],
      ["--line", "Hover fill", "color"],
      ["--accent", "Accent", "color"],
    ]],
    ["Sound colours", [
      ["--c-tool", "Tools and metal", "color"],
      ["--c-engine", "Engines and machines", "color"],
      ["--c-bomb", "Bombs", "color"],
      ["--c-both", "Both at once", "color"],
      ["--c-other", "Silence", "color"],
      ["--c-voice", "Voices", "color"],
      ["--c-music", "Music", "color"],
      ["--c-water", "Water and sea", "color"],
      ["--c-wind", "Wind and noise", "color"],
      ["--c-ambient", "Other ambience", "color"],
    ]],
    ["Interaction", [
      ["--bubble-k", "Group bubble size", "range", 0.3, 2.5, 0.05, ""],
      ["--dim-op", "Faded groups opacity", "range", 0, 0.6, 0.01, ""],
      ["--anim-ms", "Animation length", "range", 0, 1200, 10, ""],
      ["--spin", "Spin speed", "range", 0, 3, 0.05, ""],
      ["--vs-size", "Compare circle size", "range", 60, 160, 2, "px"],
      ["--filter-w", "Filter sidebar width", "range", 220, 380, 2, "px"],
    ]],
    ["Shape", [
      ["--r-card", "Card corners", "range", 0, 32, 1, "px"],
      ["--r-inner", "Inner corners", "range", 0, 24, 1, "px"],
      ["--r-btn", "Button corners", "range", 0, 20, 1, "px"],
      ["--r-pill", "Nav pill corners", "range", 0, 24, 1, "px"],
      ["--r-nav", "Nav bar corners", "range", 0, 28, 1, "px"],
    ]],
    ["Shadow", [
      ["--sh-a", "Strength", "range", 0, 0.25, 0.005, ""],
      ["--sh-y", "Offset", "range", 0, 40, 1, "px"],
      ["--sh-blur", "Blur", "range", 0, 80, 1, "px"],
    ]],
    ["Spacing", [
      ["--page-pad", "Page margin", "range", 8, 64, 1, "px"],
      ["--gap", "Gap between cards", "range", 4, 40, 1, "px"],
      ["--pad-card", "Card padding", "range", 8, 40, 1, "px"],
      ["--sec-gap", "Sidebar section gap", "range", 8, 48, 1, "px"],
      ["--side-w", "Sidebar width", "range", 220, 420, 2, "px"],
      ["--maxw", "Max page width", "range", 960, 1920, 10, "px"],
      ["--nav-pad", "Nav bar padding", "range", 0, 14, 1, "px"],
      ["--nav-px", "Nav item side padding", "range", 6, 28, 1, "px"],
      ["--nav-py", "Nav item top padding", "range", 2, 16, 1, "px"],
      ["--row-pad", "Menu row padding", "range", 2, 18, 1, "px"],
    ]],
    ["3D map", [
      ["--plot-h", "Plot height", "range", 360, 1100, 10, "px"],
      ["--dot-scale", "Dot size", "range", 0.4, 2.5, 0.05, ""],
      ["--dot-op", "Dot opacity", "range", 0.2, 1, 0.01, ""],
      ["--other-op", "Environment opacity", "range", 0, 1, 0.01, ""],
      ["--dot-rim", "Dot white rim", "range", 0, 2, 0.1, ""],
      ["--grid", "Grid lines", "color"],
      ["--note-a", "Note label opacity", "range", 0.2, 1, 0.01, ""],
    ]],
    ["Hover card", [
      ["--hover-a", "Opacity", "range", 0.3, 1, 0.01, ""],
      ["--hover-w", "Width", "range", 220, 440, 5, "px"],
    ]],
  ];
  const PLOT_TOKENS = new Set(["--c-voice", "--c-music", "--c-water", "--c-wind", "--c-ambient", "--bubble-k", "--dim-op", "--anim-ms", "--spin", "--filter-w", "--font", "--c-tool", "--c-engine", "--c-bomb", "--c-both", "--c-other", "--ink", "--mute", "--card", "--line", "--plot-h", "--dot-scale", "--dot-op", "--other-op", "--dot-rim", "--grid", "--note-a", "--side-w", "--maxw", "--page-pad", "--gap"]);

  const base = {};             // stylesheet defaults
  const cs = getComputedStyle(root);
  GROUPS.forEach(([, items]) => items.forEach(([t]) => { base[t] = cs.getPropertyValue(t).trim(); }));
  let values = {};             // current overrides
  try { values = JSON.parse(localStorage.getItem("toc-tuning") || "{}"); } catch (e) { values = {}; }

  const fontName = v => Object.keys(FONTS).find(k => FONTS[k].replace(/\s/g, "") === String(v).replace(/\s/g, "")) || "Figtree";
  const loaded = new Set(["Figtree"]);
  function loadFont(name) {
    if (loaded.has(name)) return; loaded.add(name);
    const l = document.createElement("link"); l.rel = "stylesheet";
    l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@300..700&display=swap`;
    document.head.appendChild(l);
  }
  const toHex = v => {
    v = String(v).trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(v)) return "#" + v.slice(1).split("").map(c => c + c).join("").toLowerCase();
    const m = v.match(/\d+/g); return m ? "#" + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, "0")).join("") : "#000000";
  };

  let rt = null;
  function apply(t, v, quiet) {
    if (v === base[t]) delete values[t]; else values[t] = v;
    root.style.setProperty(t, v);
    if (t === "--font") loadFont(fontName(v));
    try { localStorage.setItem("toc-tuning", JSON.stringify(values)); } catch (e) { /* ignore */ }
    if (!quiet && PLOT_TOKENS.has(t) && window.TOC) { clearTimeout(rt); rt = setTimeout(() => window.TOC.retheme(), 180); }
    updateCount();
  }

  // ---------- panel ----------
  const css = `
  .tuner{position:fixed;top:max(12px,env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px));bottom:12px;width:330px;z-index:100;display:flex;flex-direction:column;
    background:var(--card);border-radius:var(--r-card);box-shadow:0 18px 48px rgb(20 20 30/.16);font:13px/1.4 var(--font);color:var(--ink);overflow:hidden}
  .tuner.min{bottom:auto}
  .tuner.min .tn-body,.tuner.min .tn-foot{display:none}
  .tn-head{display:flex;align-items:center;gap:8px;padding:14px 12px 10px 16px}
  .tn-head b{font-weight:600;font-size:14px;flex:1}
  .tn-head small{display:block;color:var(--mute);font-weight:400;font-size:12px}
  .tn-x{border:0;background:var(--canvas);border-radius:var(--r-btn);width:30px;height:28px;cursor:pointer;color:var(--ink)}
  .tn-body{overflow:auto;padding:0 0 8px;flex:1}
  .tn-g summary{list-style:none;cursor:pointer;padding:10px 16px;font-size:13px;font-weight:600;display:flex;justify-content:space-between}
  .tn-g summary::-webkit-details-marker{display:none}
  .tn-g summary::after{content:"+";color:var(--mute)}
  .tn-g[open] summary::after{content:"–"}
  .tn-g[open]{padding-bottom:8px}
  .tn-r{display:grid;grid-template-columns:120px 1fr 56px;gap:8px;align-items:center;padding:3px 16px}
  .tn-r label{color:var(--mute);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tn-r.changed label{color:var(--ink);font-weight:500}
  .tn-r.changed label::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:6px;vertical-align:1px}
  .tn-r input[type=range]{width:100%;accent-color:var(--ink)}
  .tn-r input[type=number],.tn-r input[type=text]{width:56px;border:0;border-radius:var(--r-btn);padding:3px 5px;font:12px var(--font);background:var(--canvas);color:var(--ink)}
  .tn-r input[type=color]{width:100%;height:24px;border:0;border-radius:var(--r-btn);padding:0;background:none;cursor:pointer}
  .tn-r select{grid-column:span 2;border:0;border-radius:var(--r-btn);padding:4px 6px;background:var(--canvas);font-size:12.5px}
  .tn-foot{padding:12px 16px 14px;display:grid;gap:8px}
  .tn-foot .row{display:flex;gap:6px}
  .tn-foot button{flex:1;border:0;background:var(--canvas);border-radius:var(--r-btn);padding:8px;font:500 12.5px var(--font);color:var(--ink);cursor:pointer}
  .tn-foot button.primary{background:var(--ink);color:var(--card)}
  .tn-foot button:disabled{color:var(--mute);cursor:default}
  .tn-msg{font-size:12px;color:var(--mute);min-height:1.4em}
  .tn-open{position:fixed;right:max(12px,env(safe-area-inset-right,0px));bottom:max(12px,env(safe-area-inset-bottom,0px));z-index:100;border:0;background:var(--ink);color:var(--card);border-radius:var(--r-btn);padding:9px 14px;font:500 13px var(--font);cursor:pointer;box-shadow:0 8px 24px rgb(20 20 30/.18);display:none}
  body.tuning{padding-right:342px}
  @media (max-width:900px){.tuner{left:12px;width:auto;top:auto;height:58vh}body.tuning{padding-right:0;padding-bottom:58vh}}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  const panel = document.createElement("aside");
  panel.className = "tuner"; panel.setAttribute("aria-label", "Design tuner");
  panel.innerHTML = `<div class="tn-head"><b>Design tuner<small id="tnCount">No changes yet</small></b>
      <button class="tn-x" id="tnMin" aria-label="Collapse">–</button><button class="tn-x" id="tnClose" aria-label="Hide tuner">×</button></div>
    <div class="tn-body" id="tnBody"></div>
    <div class="tn-foot"><div class="row"><button class="primary" id="tnSave">Save for Claude</button><button id="tnCopy">Copy values</button></div>
      <div class="row"><button id="tnReset">Reset all</button></div><div class="tn-msg" id="tnMsg"></div></div>`;
  document.body.appendChild(panel);
  const opener = document.createElement("button");
  opener.className = "tn-open"; opener.textContent = "Design tuner"; document.body.appendChild(opener);
  document.body.classList.add("tuning");

  const body = panel.querySelector("#tnBody");
  const rows = {};
  GROUPS.forEach(([name, items], gi) => {
    const g = document.createElement("details"); g.className = "tn-g"; if (gi < 2) g.open = true;
    g.innerHTML = `<summary>${name}</summary>`;
    items.forEach(([t, label, kind, min, max, step, unit]) => {
      const r = document.createElement("div"); r.className = "tn-r";
      const id = "tn" + t.replace(/[^a-z0-9]/gi, "");
      const cur = values[t] != null ? values[t] : base[t];
      if (kind === "color") {
        r.innerHTML = `<label for="${id}">${label}</label><input type="color" id="${id}" value="${toHex(cur)}"><input type="text" id="${id}h" value="${toHex(cur)}" aria-label="${label} hex">`;
        const c = r.querySelector("input[type=color]"), h = r.querySelector("input[type=text]");
        c.oninput = () => { h.value = c.value; apply(t, c.value); mark(); };
        h.onchange = () => { const v = toHex(h.value); c.value = v; h.value = v; apply(t, v); mark(); };
        rows[t] = { set: v => { c.value = toHex(v); h.value = toHex(v); } };
      } else if (kind === "font") {
        r.innerHTML = `<label for="${id}">${label}</label><select id="${id}">${Object.keys(FONTS).map(f => `<option${f === fontName(cur) ? " selected" : ""}>${f}</option>`).join("")}</select>`;
        const s = r.querySelector("select");
        s.onchange = () => { apply(t, FONTS[s.value]); mark(); };
        rows[t] = { set: v => { s.value = fontName(v); } };
      } else {
        const n = parseFloat(cur);
        r.innerHTML = `<label for="${id}">${label}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${n}"><input type="number" id="${id}n" min="${min}" max="${max}" step="${step}" value="${n}" aria-label="${label} value">`;
        const sl = r.querySelector("input[type=range]"), nb = r.querySelector("input[type=number]");
        const go = v => { apply(t, v + unit); mark(); };
        sl.oninput = () => { nb.value = sl.value; go(sl.value); };
        nb.onchange = () => { sl.value = nb.value; go(nb.value); };
        rows[t] = { set: v => { const x = parseFloat(v); sl.value = x; nb.value = x; } };
      }
      const mark = () => r.classList.toggle("changed", values[t] != null);
      rows[t].mark = mark; mark();
      g.appendChild(r);
    });
    body.appendChild(g);
  });

  function updateCount() {
    const n = Object.keys(values).length;
    panel.querySelector("#tnCount").textContent = n ? `${n} value${n > 1 ? "s" : ""} changed` : "No changes yet";
  }
  function applyAll(v) {
    values = {};
    Object.keys(base).forEach(t => root.style.removeProperty(t));
    Object.entries(v || {}).forEach(([t, x]) => { if (t in base) { values[t] = x; root.style.setProperty(t, x); if (t === "--font") loadFont(fontName(x)); } });
    Object.keys(rows).forEach(t => { rows[t].set(values[t] != null ? values[t] : base[t]); rows[t].mark(); });
    try { localStorage.setItem("toc-tuning", JSON.stringify(values)); } catch (e) { /* ignore */ }
    updateCount();
    if (window.TOC) window.TOC.retheme();
  }
  const msg = t => { panel.querySelector("#tnMsg").textContent = t; };
  const asCss = () => ":root {\n" + Object.entries(values).map(([t, v]) => `  ${t}: ${v};`).join("\n") + "\n}";

  panel.querySelector("#tnMin").onclick = () => { panel.classList.toggle("min"); };
  panel.querySelector("#tnClose").onclick = () => { panel.style.display = "none"; opener.style.display = "block"; document.body.classList.remove("tuning"); setTimeout(() => window.TOC && window.TOC.retheme(), 50); };
  opener.onclick = () => { panel.style.display = ""; opener.style.display = "none"; document.body.classList.add("tuning"); setTimeout(() => window.TOC && window.TOC.retheme(), 50); };
  panel.querySelector("#tnReset").onclick = () => { applyAll({}); msg("Back to the original design."); };
  panel.querySelector("#tnCopy").onclick = () => {
    const text = asCss();
    const fallback = () => { const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "width:100%;height:120px;font:12px var(--font)"; panel.querySelector(".tn-foot").appendChild(ta); ta.select(); msg("Select-all and copy the text above."); };
    try { navigator.clipboard.writeText(text).then(() => msg("Copied as CSS. Paste it into the chat."), fallback); } catch (e) { fallback(); }
  };

  // ---------- Save for Claude (artifact database; only in the published preview) ----------
  const saveBtn = panel.querySelector("#tnSave");
  let db = null;
  saveBtn.disabled = true;
  const useP = window.claude && typeof window.claude.use === "function" ? window.claude.use("db") : Promise.resolve(null);
  useP.then(d => {
    db = d;
    if (!db) { saveBtn.style.display = "none"; return; }
    saveBtn.disabled = false;
    const ref = db.doc("tuning/current");
    // start from the last saved version when this browser has nothing of its own
    if (!Object.keys(values).length) {
      ref.get().then(snap => { if (snap.exists && snap.data().tokens) { applyAll(snap.data().tokens); msg("Loaded your last saved design."); } }).catch(() => {});
    }
    saveBtn.onclick = () => {
      saveBtn.disabled = true; msg("Saving…");
      ref.set({ tokens: values, css: asCss(), savedAt: new Date().toISOString() })
        .then(() => { msg(`Saved ${Object.keys(values).length} values. Tell Claude in the chat that you're done.`); })
        .catch(e => { msg(`Couldn't save (${e && e.code ? e.code : "error"}). Use Copy values instead.`); })
        .finally(() => { saveBtn.disabled = false; });
    };
  }).catch(() => { saveBtn.style.display = "none"; });

  // restore this browser's own tweaks
  const start = () => { if (Object.keys(values).length) applyAll(values); updateCount(); };
  if (window.TOC) start(); else document.addEventListener("toc-ready", start, { once: true });
})();
