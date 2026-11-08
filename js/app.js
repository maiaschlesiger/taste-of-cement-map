/* Taste of Cement: war and work, side by side.
   One page. On the left, the seven relationships between a sound of war and a building sound.
   Choosing one shows facts about each sound, the two sounds compared and played from the film,
   and other moments in the film that sound alike. */
(() => {
  "use strict";
  const $ = s => document.querySelector(s);
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const fmt = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, "0"); return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`; };
  const sfx = e => { if (window.SFX) window.SFX.play(e); };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- measurements of each moment (6 s from 2 s before it; from data/data.json) ----------
  // louder: % of the film's non-silent seconds it is louder than. bass: % of energy below 250 Hz.
  // hz: tone centre (spectral centroid). hits: sharp onsets per second.
  const M = {
    1733: { louder: 95, bass: 82, hz: 990, hits: 1.8 }, 4780: { louder: 87, bass: 80, hz: 910, hits: 2.5 },
    3098: { louder: 97, bass: 89, hz: 820, hits: 2.5 }, 3197: { louder: 97, bass: 80, hz: 1520, hits: 3.7 },
    3254: { louder: 97, bass: 68, hz: 1560, hits: 4.8 }, 3267: { louder: 99, bass: 65, hz: 1800, hits: 5.8 },
    3736: { louder: 62, bass: 87, hz: 330, hits: 0 }, 866: { louder: 59, bass: 99, hz: 260, hits: 0 },
    3808: { louder: 86, bass: 13, hz: 1610, hits: 5.5 }, 2636: { louder: 84, bass: 5, hz: 2720, hits: 6.3 },
    3875: { louder: 86, bass: 7, hz: 2280, hits: 7 }, 638: { louder: 85, bass: 7, hz: 3830, hits: 3.5 },
    4067: { louder: 90, bass: 72, hz: 720, hits: 0.5 }, 4641: { louder: 81, bass: 90, hz: 500, hits: 0.5 },
  };

  // ---------- the relationships ----------
  // war / build: [seconds, label]. watched: paired by watching the film (else: building moment picked by
  // measurement). warFacts / buildFacts / linkFacts: bullet points shown on the page. Sources are listed in About.
  const PAIRS = [
    { war: [1733, "Bombs"], build: [4780, "Site machinery"], watched: false,
      warFacts: [
        "On screen at 28:53: bombs falling in Syria",
        "Human Rights Watch identified nearly 1,500 sites hit by indiscriminate Syrian government air attacks in a single year (2014–15)",
        "Its attacks included improvised “barrel bombs” dropped on populated areas of Aleppo and Daraa",
      ],
      buildFacts: [
        "From the long machinery stretch near the end of the film (about 1:16–1:20), which also contains the construction lift at 1:16:24",
        "Picked by searching the film for the building moment whose loudness, bass and tone come closest to the bombs",
      ],
      linkFacts: ["51 minutes apart: the film never cuts between them, so the match is in the soundtrack itself"] },
    { war: [3098, "A tank moving"], build: [3197, "Machinery moving"], watched: true,
      warFacts: [
        "On screen at 51:38: a tank moving in Syria; the film returns to it at 52:42, 53:30 and 55:11",
        "On 25 April 2011, Syrian army tanks entered Daraa, the city where the uprising began",
        "Syria's army fought the war with Soviet- and Russian-made tanks, including the T-72",
      ],
      buildFacts: [
        "On screen at 53:17: construction machinery moving on the Beirut site, between the tank shots",
        "Most of the workers on the site are Syrian, and they may not leave it after 7 pm",
      ],
      linkFacts: [
        "Cut together: 99 seconds apart in the same sequence",
        "The film's loudest stretch: 209 of its 300 loudest seconds fall between 51 and 56 minutes",
      ] },
    { war: [3254, "A tank firing"], build: [3267, "Drilling a wall"], watched: true,
      warFacts: [
        "On screen at 54:14: a tank firing; it fires again at 54:29",
        "Part of the same tank sequence as pair 2, inside the film's loudest stretch",
      ],
      buildFacts: [
        "On screen at 54:27: a worker drilling into a concrete wall on the Beirut site",
        "Concrete is drilled with a hammer drill, which spins and hammers the bit at the same time",
      ],
      linkFacts: [
        "Cut together: 13 seconds apart",
        "The tank's second shot at 54:29 comes 2 seconds after the drill",
      ] },
    { war: [3736, "Footsteps in tunnels"], build: [866, "Site rumble"], watched: false,
      warFacts: [
        "On screen at 1:02:16: people walking through tunnels in Syria",
        "In besieged areas such as Eastern Ghouta, near Damascus, tunnels carried food, fuel and medicine for years, and residents sheltered underground from air strikes",
      ],
      buildFacts: [
        "From early in the film, 14:26, during its first long stretch on the building site",
        "Picked by searching the film for the building moment that sounds closest",
      ],
      linkFacts: ["Both are low and quiet: neither has a single sharp hit in six seconds"] },
    { war: [3808, "Panicked voices"], build: [2636, "Site noise"], watched: false,
      warFacts: [
        "On screen at 1:03:28: people shouting and calling out after a bombing",
        "The shouting continues through the rescue that follows, to 1:07:44",
        "A review contrasts this “frantic clamour of voices” with “the numb silence of the Syrian workers in Beirut”",
      ],
      buildFacts: [
        "From the building site at 43:56",
        "Picked by searching the film for the building moment that sounds closest",
        "A review notes the Syrian workers are forbidden from speaking about their working conditions",
      ],
      linkFacts: ["Both are bright and busy, with more than five sharp onsets a second; the voices carry words, the site does not"] },
    { war: [3875, "Digging out survivors"], build: [638, "Site machinery"], watched: false,
      warFacts: [
        "On screen from 1:04:35 to 1:07:44: people shovelling gravel by hand to dig survivors out of rubble, while others shout",
        "In opposition-held Syria, volunteer rescuers of the Syria Civil Defence (the “White Helmets”), founded in 2013, dug survivors out after air strikes",
        "By 2015 they numbered more than 2,700 volunteers",
      ],
      buildFacts: [
        "From the building site at 10:38, in the film's first long stretch on the site",
        "Picked by searching the film for the building moment that sounds closest",
        "Before 2011, an estimated 300,000 Syrians worked in Lebanon, many of them in construction",
      ],
      linkFacts: ["Both are scraping, high sounds with almost no bass"] },
    { war: [4067, "A helicopter"], build: [4641, "The construction lift"], watched: true,
      warFacts: [
        "On screen at 1:07:47: a helicopter approaching, straight after the rescue",
        "Human Rights Watch documented Syrian government Mi-17 helicopters dropping barrel bombs and conventional bombs on populated areas",
      ],
      buildFacts: [
        "On screen from 1:16:24 to 1:17:21: the construction lift climbing the tower in Beirut",
        "A construction lift carries workers and materials up the outside of a building as it rises",
      ],
      linkFacts: ["Nine minutes apart", "Both are steady, low engine drones with almost no sharp hits"] },
  ];
  PAIRS.forEach((p, i) => { p.n = i + 1; });
  // moments identified by watching the film, used to name matches in the footer
  const SEEN = [[1733, 1733, "bombs"], [3098, 3098, "tank moving"], [3162, 3162, "tank moving"], [3197, 3197, "machinery moving"], [3210, 3210, "tank moving"],
    [3254, 3254, "tank firing"], [3267, 3267, "drilling a wall"], [3269, 3269, "tank firing"], [3311, 3311, "tank moving"], [3736, 3736, "tunnels"],
    [3808, 3808, "panicked voices"], [3875, 4064, "digging out survivors"], [4067, 4067, "helicopter"], [4584, 4641, "construction lift"]];
  const seenAt = t => { const s = SEEN.find(([a, b]) => t >= a - 3 && t <= b + 3); return s ? s[2] : ""; };
  const sceneOf = t => { const s = SEEN.find(([a, b]) => t >= a - 3 && t <= b + 3); return s ? [Math.min(s[0], t), Math.max(s[1], t)] : [t, t]; };

  let cur = -1, res = null, shift = 1, raf = 0, token = 0;

  // ---------- list of relationships ----------
  function renderList() {
    $("#rels").innerHTML = PAIRS.map((p, i) => `
      <button class="rel" data-i="${i}" aria-pressed="false">
        <span class="rel-n">${p.n}</span>
        <span class="rel-pair">
          <span class="rel-s war"><i></i><b>${esc(p.war[1])}</b><em>${fmt(p.war[0])}</em></span>
          <span class="rel-s build"><i></i><b>${esc(p.build[1])}</b><em>${fmt(p.build[0])}</em></span>
        </span>
        <span class="rel-pct" data-pct></span>
      </button>`).join("");
    $("#rels").addEventListener("click", e => { const b = e.target.closest(".rel"); if (b) select(+b.dataset.i); });
    $("#rels").addEventListener("pointerover", e => { const b = e.target.closest(".rel"); if (b && !b.contains(e.relatedTarget) && +b.dataset.i !== cur) sfx("hover"); });
    Promise.all(PAIRS.map(p => window.COMPARE.compare(p.war[0], p.build[0]))).then(rs => {
      rs.forEach((r, i) => { $(`.rel[data-i="${i}"] [data-pct]`).textContent = r.score + "%"; });
    });
  }

  // ---------- the selected relationship ----------
  const li = arr => arr.map(f => `<li>${esc(f)}</li>`).join("");
  const num = n => n.toLocaleString("en-GB");
  function measured(p, c) {
    const a = M[p.war[0]], b = M[p.build[0]]; if (!a || !b) return [];
    const two = (x, y, unit) => `<span class="v w">${x}${unit}</span> <span class="v b">${y}${unit}</span>`;
    const out = [
      `Louder than this much of the film: ${two(a.louder, b.louder, "%")}`,
      `Energy below 250 Hz (bass): ${two(a.bass, b.bass, "%")}`,
      `Tone centre: ${two(num(a.hz), num(b.hz), " Hz")}`,
      `Sharp hits per second: ${two(a.hits, b.hits, "")}`,
    ];
    if (c.regs.length) out.push(esc(window.COMPARE.hear(c)).replace(/\.$/, ""));
    return out;
  }
  function select(i, quiet) {
    if (i < 0 || i >= PAIRS.length) return;
    if (!quiet && i !== cur) sfx("click");
    cur = i; stopPlay();
    document.querySelectorAll(".rel").forEach(b => { const on = +b.dataset.i === i; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    const p = PAIRS[i], my = ++token;
    $("#pTitle").textContent = `${p.war[1]} vs ${p.build[1].replace(/^./, ch => ch.toLowerCase())}`;
    $("#pWar").innerHTML = `<i></i>${esc(p.war[1])} <span>${fmt(p.war[0])}</span>`;
    $("#pBuild").innerHTML = `<i></i>${esc(p.build[1])} <span>${fmt(p.build[0])}</span>`;
    $("#pHow").textContent = p.watched ? "Paired by watching the film" : "Building moment picked by measurement";
    $("#warHead").textContent = p.war[1];
    $("#buildHead").textContent = p.build[1];
    $("#warFacts").innerHTML = li(p.warFacts);
    $("#buildFacts").innerHTML = li(p.buildFacts);
    $("#linkFacts").innerHTML = li(p.linkFacts);
    const card = $("#detail"); card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    renderFoot(null, p);
    window.COMPARE.preload([p.war[0], p.build[0]]);
    window.COMPARE.compare(p.war[0], p.build[0]).then(c => {
      if (my !== token) return;
      res = c; shift = 0;
      $("#linkFacts").innerHTML = li(p.linkFacts) + measured(p, c).map(f => `<li>${f}</li>`).join("");
      $("#pShift").textContent = c.lag ? `(${Math.abs(c.lagSec).toFixed(1)} s)` : "";
      $("#pAlign").checked = true;
      countUp(c.score);
      tween(700, k => paint(k, 0, null), () => tween(500, k => { shift = k; paint(1, k, null); }));
      setTimeout(() => {
        if (my !== token) return;
        const avoid = [sceneOf(p.war[0]), sceneOf(p.build[0])];
        Promise.all([window.COMPARE.similar(p.war[0], avoid), window.COMPARE.similar(p.build[0], avoid)]).then(([w, b]) => { if (my === token) renderFoot([w, b], p); });
      }, 60);
    });
  }
  function renderFoot(lists, p) {
    const row = (side, label, items) => `<div class="mrow ${side}"><span class="mlab"><i></i>Like the ${esc(label.replace(/^(The|A) /, "").toLowerCase())}</span><div class="mchips">${
      items ? items.map(m => { const s = seenAt(m.t); return `<button class="mchip" data-t="${m.t}" aria-label="Play ${fmt(m.t)}${s ? ", " + s : ""}"><b>${fmt(m.t)}</b>${s ? `<span>${s}</span>` : ""}</button>`; }).join("")
        : `<span class="mute">Listening through the film…</span>`}</div></div>`;
    $("#moments").innerHTML = row("war", p.war[1], lists && lists[0]) + row("build", p.build[1], lists && lists[1]);
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

  // ---------- playback (real clips from the film) ----------
  let playRAF = 0, stopTimer = 0, playTok = 0;
  function stopPlay() {
    playTok++; cancelAnimationFrame(playRAF); clearTimeout(stopTimer); window.COMPARE.stop();
    document.querySelectorAll(".playing, .loading").forEach(b => b.classList.remove("playing", "loading"));
    if (res) paint(1, shift, null);
  }
  function play(which, btn) {
    const was = btn.classList.contains("playing");
    stopPlay(); if (!res || was) return;
    const W = window.COMPARE.W, BF = window.COMPARE.BF, p = PAIRS[cur], my = playTok;
    const a = { t: p.war[0], from: res.a0 / BF }, b = { t: p.build[0], from: (res.b0 + res.lag * shift) / BF };
    const items = which === "both" ? [a, b] : which === "war" ? [a] : [b];
    btn.classList.add("loading"); sfx("play");
    window.COMPARE.play(items).then(ok => {
      if (my !== playTok) return;
      btn.classList.remove("loading"); if (!ok) return;
      btn.classList.add("playing");
      const t0 = performance.now();
      const tick = () => { const t = (performance.now() - t0) / 1000; paint(1, shift, Math.min(W, t)); if (t < W) playRAF = requestAnimationFrame(tick); else stopPlay(); };
      tick();
    });
  }
  function playMoment(t, btn) {
    const was = btn.classList.contains("playing");
    stopPlay(); if (was) return;
    const my = playTok; btn.classList.add("loading"); sfx("play");
    window.COMPARE.play([{ t, from: t - window.COMPARE.PRE }]).then(ok => {
      if (my !== playTok) return;
      btn.classList.remove("loading"); if (!ok) return;
      btn.classList.add("playing");
      stopTimer = setTimeout(stopPlay, window.COMPARE.W * 1000);
    });
  }

  function closeMenus() { $("#sfxMenu").classList.remove("open"); $("#sfxBtn").setAttribute("aria-expanded", "false"); }

  function init() {
    renderList();
    $("#playBoth").onclick = e => play("both", e.currentTarget);
    $("#playWar").onclick = e => play("war", e.currentTarget);
    $("#playBuild").onclick = e => play("build", e.currentTarget);
    $("#pAlign").onchange = e => { if (!res) return; stopPlay(); const from = shift, to = e.target.checked ? 1 : 0; tween(450, k => { shift = from + (to - from) * k; paint(1, shift, null); }); };
    $("#moments").addEventListener("click", e => { const b = e.target.closest(".mchip"); if (b) playMoment(+b.dataset.t, b); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeMenus();
      if (e.target.closest("input, select, dialog")) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select(Math.min(PAIRS.length - 1, cur + 1)); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select(Math.max(0, cur - 1)); }
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
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => paint(1, shift, null), 60); });
    window.TOC = { retheme() { paint(1, shift, null); }, fmt, PAIRS };
    document.dispatchEvent(new Event("toc-ready"));
    select(0, true);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
