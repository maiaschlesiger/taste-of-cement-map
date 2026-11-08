/* Taste of Cement: war and work, side by side.
   One page. A film strip links each sound of war to the building sound the film sets beside it;
   choosing a pair shows the two sounds overlapped, plays them, and explains why the link matters. */
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const fmt = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, "0"); return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`; };
  const sfx = e => { if (window.SFX) window.SFX.play(e); };
  const FILM = 5098; // seconds

  // ---------- the pairs ----------
  // war: a sound of war seen on screen. build: the building sound it is paired with.
  // cut: true when the film itself puts the two side by side; false when the building sound was found
  //      by measuring which construction moment sounds closest (timbre, loudness shape and level).
  const PAIRS = [
    { war: [1733, "Bombs"], build: [601, "The building site"], cut: false,
      why: "The bombing and the site's machinery swell and break in much the same way. For the men on the site, the noise of the job keeps the sound of home close." },
    { war: [3098, "A tank moving"], build: [3197, "Machinery moving"], cut: true,
      why: "The film cuts from a tank in a ruined street to machinery on the site, and the engine noise runs straight across the cut. One machine flattens a city; the other builds one." },
    { war: [3254, "A tank firing"], build: [3267, "Drilling a wall"], cut: true,
      why: "Thirteen seconds apart, a tank fires and a drill bites into concrete. The work of building sounds like the attack the men left behind." },
    { war: [3736, "Footsteps in tunnels"], build: [866, "The building site"], cut: false,
      why: "People in Syria move through tunnels underground. In Beirut the workers live underground too: after the curfew they stay in the building's foundations." },
    { war: [3808, "Panicked voices"], build: [2636, "The building site"], cut: false,
      why: "After the bombing, people shout as they search the rubble. On the site the workers barely speak. The match is in loudness and texture, not words; the gap is the silence." },
    { war: [3875, "Digging out survivors"], build: [638, "The building site"], cut: false,
      why: "Shovels scraping rubble to reach people, against the steady machinery that digs a tower's foundations. Similar work, opposite ends." },
    { war: [4067, "A helicopter"], build: [4641, "The construction lift"], cut: true,
      why: "A helicopter approaches over Syria; in Beirut the lift climbs the tower. Both are rising engines. One carries the men to work, the other is a sound people in Syria learned to fear." },
  ];
  PAIRS.forEach((p, i) => { p.n = i + 1; });

  let cur = 0, res = null, shift = 1, raf = 0, token = 0;

  // ---------- film strip ----------
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, at, parent) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
  function spread(items, r, max) { // nudge dots on one lane so they don't overlap, keeping them inside the lane
    const s = items.slice().sort((a, b) => a.x - b.x), gap = 2 * r + 3;
    for (let i = 1; i < s.length; i++) if (s[i].x - s[i - 1].x < gap) s[i].x = s[i - 1].x + gap;
    if (s.length && s[s.length - 1].x > max) { s[s.length - 1].x = max; for (let i = s.length - 2; i >= 0; i--) if (s[i + 1].x - s[i].x < gap) s[i].x = s[i + 1].x - gap; }
    return items;
  }
  function drawStrip() {
    const svg = $("#strip"), w = svg.parentElement.clientWidth, h = parseFloat(css("--strip-h")) || 150;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`); svg.setAttribute("width", w); svg.setAttribute("height", h);
    svg.innerHTML = "";
    const narrow = w < 600, padL = narrow ? 12 : 112, padR = 14, yW = narrow ? 34 : 26, yB = h - (narrow ? 50 : 44), X = t => padL + t / FILM * (w - padL - padR);
    const lane = (y, text) => {
      el("line", { x1: padL, x2: w - padR, y1: y, y2: y, class: "lane" }, svg);
      const t = el("text", narrow ? { x: padL, y: y === yW ? y - 16 : y + 22, class: "lane-label" } : { x: 0, y: y + 4, class: "lane-label" }, svg); t.textContent = text;
    };
    lane(yW, "War, Syria"); lane(yB, "Building, Beirut");
    for (let m = 0; m <= 80; m += narrow ? 20 : 10) { const t = el("text", { x: X(m * 60), y: h - 6, class: "tick" }, svg); t.textContent = m ? `${m} min` : "0"; }
    const rw = narrow ? 9 : 10, rb = narrow ? 6 : 7;
    const ws = spread(PAIRS.map(p => ({ p, x: X(p.war[0]) })), rw, w - padR - rw), bs = spread(PAIRS.map(p => ({ p, x: X(p.build[0]) })), rb, w - padR - rb);
    const order = PAIRS.map((_, i) => i).sort((a, b) => (a === cur) - (b === cur)); // selected drawn last
    order.forEach(i => {
      const p = PAIRS[i], xw = ws[i].x, xb = bs[i].x, on = i === cur;
      const g = el("g", { class: "pair" + (on ? " on" : ""), tabindex: 0, role: "button", "data-i": i,
        "aria-label": `Pair ${p.n}: ${p.war[1]} at ${fmt(p.war[0])} and ${p.build[1].toLowerCase()} at ${fmt(p.build[0])}` }, svg);
      const my = (yW + yB) / 2;
      el("path", { d: `M${xw},${yW} C${xw},${my} ${xb},${my} ${xb},${yB}`, class: "link" }, g);
      el("path", { d: `M${xw},${yW} C${xw},${my} ${xb},${my} ${xb},${yB}`, class: "hit" }, g);
      el("circle", { cx: xb, cy: yB, r: on ? rb + 2 : rb, class: "dot-b" }, g);
      el("circle", { cx: xw, cy: yW, r: on ? rw + 2 : rw, class: "dot-w" }, g);
      const t = el("text", { x: xw, y: yW + 4, class: "num" }, g); t.textContent = p.n;
      g.addEventListener("click", () => select(i));
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); } });
      g.addEventListener("pointerenter", () => { if (i !== cur) sfx("hover"); tip(p, xw, xb); });
      g.addEventListener("pointerleave", () => { $("#tip").hidden = true; });
    });
  }
  function tip(p, xw, xb) {
    const t = $("#tip"); t.innerHTML = `<b>${p.n}</b> ${p.war[1]} <span>${fmt(p.war[0])}</span> · ${p.build[1]} <span>${fmt(p.build[0])}</span>`;
    t.hidden = false; const box = t.parentElement.clientWidth, tw = t.offsetWidth;
    t.style.left = Math.max(0, Math.min(box - tw, (xw + xb) / 2 - tw / 2)) + "px";
  }

  // ---------- the selected pair ----------
  function select(i, quiet) {
    if (i < 0 || i >= PAIRS.length) return;
    if (!quiet && i !== cur) sfx("click");
    cur = i; stopPlay(); drawStrip(); $("#tip").hidden = true;
    const p = PAIRS[i], my = ++token;
    $("#pNum").innerHTML = PAIRS.map((q, k) => `<button class="${k === i ? "on" : ""}" data-k="${k}" aria-label="Pair ${q.n}: ${q.war[1]}"${k === i ? ' aria-current="true"' : ""}></button>`).join("");
    $("#pTitle").textContent = `${p.war[1]} vs ${p.build[1].replace(/^./, ch => ch.toLowerCase())}`;
    $("#pWar").innerHTML = `<i></i>${p.war[1]} <span>${fmt(p.war[0])}</span>`;
    $("#pBuild").innerHTML = `<i></i>${p.build[1]} <span>${fmt(p.build[0])}</span>`;
    $("#pHow").textContent = p.cut ? "Cut together in the film" : "Closest-sounding building moment";
    $("#pWhy").textContent = p.why;
    $("#pHear").textContent = "";
    $("#prev").disabled = i === 0; $("#next").disabled = i === PAIRS.length - 1;
    const card = $("#pairCard"); card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    window.COMPARE.compare(p.war[0], p.build[0]).then(c => {
      if (my !== token) return;
      res = c; shift = 0;
      $("#pHear").textContent = window.COMPARE.hear(c);
      $("#pShift").textContent = c.lag ? `(${Math.abs(c.lagSec).toFixed(1)} s)` : "";
      $("#pAlign").checked = true;
      countUp(c.score);
      tween(700, k => paint(k, 0, null), () => tween(500, k => { shift = k; paint(1, k, null); }));
    });
  }
  function paint(progress, sh, playT) {
    if (!res) return;
    window.COMPARE.draw($("#wave"), res, { progress, shift: sh, playT, colA: css("--c-bomb"), colB: css("--c-tool") });
  }
  function tween(dur, fn, done) {
    cancelAnimationFrame(raf);
    if (reduce) { fn(1); if (done) done(); return; }
    const t0 = performance.now();
    const step = now => { const k = Math.min(1, (now - t0) / dur); fn(1 - Math.pow(1 - k, 3)); if (k < 1) raf = requestAnimationFrame(step); else if (done) done(); };
    raf = requestAnimationFrame(step);
  }
  function countUp(to) {
    const ring = $("#ring"), C = 2 * Math.PI * 52; ring.style.strokeDasharray = C;
    const t0 = performance.now(), dur = reduce ? 0 : 800;
    const step = now => { const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      $("#pct").textContent = Math.round(to * e) + "%"; ring.style.strokeDashoffset = C * (1 - to / 100 * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  // ---------- playback ----------
  let playRAF = 0;
  function stopPlay() {
    cancelAnimationFrame(playRAF); window.COMPARE.stop();
    document.querySelectorAll(".playrow .btn").forEach(b => b.classList.remove("playing"));
    if (res) paint(1, shift, null);
  }
  function play(which, btn) {
    stopPlay(); if (!res) return;
    const W = window.COMPARE.W, BF = window.COMPARE.BF;
    const a = res.a0 / BF, b = (res.b0 + res.lag * shift) / BF;
    const starts = which === "both" ? [a, b] : which === "war" ? [a] : [b];
    if (!window.COMPARE.play(starts)) return;
    sfx("play"); btn.classList.add("playing");
    const t0 = performance.now();
    const tick = () => { const t = (performance.now() - t0) / 1000; paint(1, shift, Math.min(W, t)); if (t < W) playRAF = requestAnimationFrame(tick); else stopPlay(); };
    tick();
  }

  // ---------- menus and about ----------
  function closeMenus() { $("#sfxMenu").classList.remove("open"); $("#sfxBtn").setAttribute("aria-expanded", "false"); }

  function init() {
    drawStrip();
    $("#pNum").addEventListener("click", e => { const b = e.target.closest("button"); if (b) select(+b.dataset.k); });
    $("#prev").onclick = () => select(cur - 1);
    $("#next").onclick = () => select(cur + 1);
    $("#playBoth").onclick = e => play("both", e.currentTarget);
    $("#playWar").onclick = e => play("war", e.currentTarget);
    $("#playBuild").onclick = e => play("build", e.currentTarget);
    $("#pAlign").onchange = e => { if (!res) return; stopPlay(); const from = shift, to = e.target.checked ? 1 : 0; tween(450, k => { shift = from + (to - from) * k; paint(1, shift, null); }); };
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeMenus();
      if (e.target.closest("input, select, dialog")) return;
      if (e.key === "ArrowRight") select(cur + 1); else if (e.key === "ArrowLeft") select(cur - 1);
    });

    const bt = $("#sfxBtn"), m = $("#sfxMenu");
    bt.onclick = e => { e.stopPropagation(); const open = !m.classList.contains("open"); closeMenus(); if (open && window.SFX) { window.SFX.renderMenu(m); sfx("menu"); } m.classList.toggle("open", open); bt.setAttribute("aria-expanded", open); };
    m.addEventListener("click", e => e.stopPropagation());
    document.addEventListener("click", e => { if (!e.target.closest(".dd")) closeMenus(); });

    const dlg = $("#about");
    $("#aboutBtn").onclick = () => { sfx("menu"); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); };
    $("#aboutClose").onclick = () => dlg.close();
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

    let rt = 0;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { drawStrip(); paint(1, shift, null); }, 60); });
    window.TOC = { retheme() { drawStrip(); paint(1, shift, null); }, fmt, PAIRS };
    document.dispatchEvent(new Event("toc-ready"));
    select(0, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
