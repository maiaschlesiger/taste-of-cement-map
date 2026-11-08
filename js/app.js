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
  // measurement). warFacts / buildFacts: what is on screen, then what this sound means for the people who
  // live with it. linkFacts: how the two relate in the film. whyFacts: why the filmmakers may have joined
  // them, from reviews, interviews and the film's history. Sources are listed in About.
  const PAIRS = [
    { war: [1733, "Bombs"], build: [4780, "Site machinery"], watched: false,
      warFacts: [
        "On screen at 28:53: bombs falling in Syria",
        "In a 2017 Save the Children study, 84% of adults and almost all children named bombing and shelling as the main cause of children's stress",
        "71% said children were increasingly wetting the bed, a sign of toxic stress",
      ],
      buildFacts: [
        "1:19:40: machinery on the Beirut site, picked by measurement as the closest sound",
        "In a camp study of Syrian refugees in Lebanon, 27% had PTSD at the time and 35% had had it at some point",
        "Being easily startled by sudden noise is one of the core symptoms of PTSD",
      ],
      whyFacts: [
        "Critics call construction and destruction the film's \u201ctwin poles\u201d: buildings go up in one place and come down in another",
        "One review reads the film as following \u201cthe logic of trauma\u201d, repeating itself and linking things that seem unrelated",
        "51 minutes apart, the bomb returns inside a machine the way a traumatic memory returns: without warning, in the middle of ordinary life",
      ],
      linkFacts: ["51 minutes apart: the film never cuts between them, so the likeness is in the sound itself"] },
    { war: [3098, "A tank moving"], build: [3197, "Machinery moving"], watched: true,
      warFacts: [
        "On screen at 51:38: a tank moving in Syria; it returns at 52:42, 53:30 and 55:11",
        "In April 2011, troops backed by tanks stormed Daraa, where the uprising began; at least 20 people were killed on the first day",
      ],
      buildFacts: [
        "On screen at 53:17: machinery moving on the Beirut site, between the tank shots",
        "Syrians on Lebanese sites work without safety rules, health insurance or union protection, often on thin scaffolding in plastic slippers",
        "92% of Syrian refugee workers in Lebanon have no formal contract",
      ],
      whyFacts: [
        "The Hollywood Reporter notes the bombing footage is cut into the Beirut construction and grows more dissonant as the film goes on",
        "One festival note sees the crane's arm as a cannon barrel aimed at the city, and hears tanks in the bulldozers' roar",
        "Some of the film's tank footage is shot from inside the tank, moving through the ruins of Aleppo: both machines are driven by men, one clearing a city and one building it",
      ],
      linkFacts: ["Cut together, 99 seconds apart, in the loudest stretch of the film"] },
    { war: [3254, "A tank firing"], build: [3267, "Drilling a wall"], watched: true,
      warFacts: [
        "On screen at 54:14: a tank firing; it fires again at 54:29",
        "Aid workers describe Syrian children who flinch at ordinary sounds, a chair moving or a door banging, because they fear planes and rockets",
        "In one study, 45% of Syrian refugee children showed signs of PTSD, about ten times the rate for children elsewhere",
      ],
      buildFacts: [
        "On screen at 54:27: a worker drilling into a concrete wall in Beirut",
        "Half of Syrian refugee workers in an ILO survey had back or joint pain, severe fatigue, or worked in extreme heat or cold",
        "Almost two-thirds breathed dust and fumes at work",
      ],
      whyFacts: [
        "Beirut Today headlined its review \u201cWe build, and then we destroy\u201d, noting that the sound of construction becomes tied to the sound of bombs",
        "Eye for Film describes the war sounds as \u201can attack on the senses\u201d after long stretches of quiet",
        "Thirteen seconds apart, the drill may make the audience flinch the way a survivor does, which is the point: the work never lets the war go quiet",
      ],
      linkFacts: ["Cut together, 13 seconds apart; the tank fires again 2 seconds after the drill"] },
    { war: [3736, "Footsteps in tunnels"], build: [866, "Site rumble"], watched: false,
      warFacts: [
        "On screen at 1:02:16: people walking through tunnels in Syria",
        "In besieged Eastern Ghouta in 2018, families slept in basements for months; some shelters held 200 people",
        "Save the Children counted 4,100 families living underground there, more than half without water, sanitation or ventilation",
      ],
      buildFacts: [
        "14:26: a low rumble on the Beirut site, picked by measurement as the closest sound",
        "The workers may not leave the site after 7 pm; Syrian workers in Lebanon often live on the sites where they work",
        "By 2014, at least 45 Lebanese towns had put Syrian refugees under curfew",
      ],
      whyFacts: [
        "A review notes the workers climb ever higher to pour concrete, then return \u201cto the bowels of the Earth\u201d when the day is done",
        "Under the 7 pm curfew they live below the tower they build, as people under siege in Syria lived below the bombs",
        "The same low, muffled rumble in both places suggests one trapped, underground life on both sides of the border",
      ],
      linkFacts: ["Both are low and quiet, without a single sharp hit"] },
    { war: [3808, "Panicked voices"], build: [2636, "Site noise"], watched: false,
      warFacts: [
        "On screen at 1:03:28: people shouting after a bombing",
        "Save the Children found that even without bombing, the sound of people shouting and aircraft overhead triggered extreme fear in children",
        "A review sets this \u201cfrantic clamour of voices\u201d against \u201cthe numb silence of the Syrian workers in Beirut\u201d",
      ],
      buildFacts: [
        "43:56: the Beirut site, picked by measurement as the closest sound",
        "The workers are forbidden from speaking about their working conditions",
        "In 2017 Syrian builders asked for a raise from $20 to $22 a day, but did not ask for better living conditions for fear of losing their jobs",
      ],
      whyFacts: [
        "Reviews note the soundtrack moves between rhythmic construction noise and empty silence, and the workers barely speak",
        "The workers are not allowed to talk about their conditions: the film gives the voices to Syria and the silence to Beirut",
        "Matching the shouting to machinery suggests grief that has nowhere to go except into the noise of the work",
      ],
      linkFacts: ["Both are bright and busy; only one of them has voices in it"] },
    { war: [3875, "Digging out survivors"], build: [638, "Site machinery"], watched: false,
      warFacts: [
        "On screen from 1:04:35 to 1:07:44: people digging survivors out of rubble with shovels",
        "Strikes were often followed by a second strike on the same spot up to 30 minutes later, putting anyone digging at risk",
        "At least 191 Syria Civil Defence (\u201cWhite Helmets\u201d) volunteers were killed rescuing others; mental health support for them is scarce",
      ],
      buildFacts: [
        "10:38: machinery on the Beirut site, picked by measurement as the closest sound",
        "In a 2019 study in Lebanon's Bekaa Valley, only 13% of construction workers had a written contract",
        "More than 58% of the workers in that study were paid below the minimum wage",
      ],
      whyFacts: [
        "The Hollywood Reporter notes that cement becomes both a force for building and a sign of destruction",
        "One reviewer describes a living head emerging from the rubble, \u201ccaked in cement\u201d: the material the men build with is the material that buries their people",
        "The film asks \u201cWho will rebuild Syria? And when?\u201d The men digging foundations in Beirut cannot dig out their own cities",
      ],
      linkFacts: ["Both are scraping, high sounds with almost no bass"] },
    { war: [4067, "A helicopter"], build: [4641, "The construction lift"], watched: true,
      warFacts: [
        "On screen at 1:07:47: a helicopter approaching",
        "Aleppo residents feared barrel bombs most: they could hear the helicopter, then a hiss as the bomb fell, and had about two minutes to run",
        "\u201cIt became routine for the helicopter to be there above us, so I finally stopped looking up. I smelled death everywhere.\u201d Aleppo resident, 2015",
      ],
      buildFacts: [
        "On screen from 1:16:24 to 1:17:21: the construction lift climbing the tower",
        "Nine in ten Syrian refugee families in Lebanon live in extreme poverty",
        "Men who owned land or ran businesses in Syria became low-paid labourers in Lebanon, a loss they describe as damaging their mental health",
      ],
      whyFacts: [
        "Beirut's new towers rise on the ruins of Lebanon's own civil war, built largely by Syrians while their towns are destroyed",
        "The narrator's father did the same work in Beirut, and the narration ends: \u201cSince the end of the war Beirut keeps building\u201d",
        "Both engines climb above a city; one carries the men to work, the other carried the bombs that sent them there",
      ],
      linkFacts: ["Nine minutes apart; both are steady, low engine drones"] },
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
        <span class="rel-s">${esc(p.war[1])}</span><span class="rel-t">${fmt(p.war[0])}</span>
        <span class="rel-s">${esc(p.build[1])}</span><span class="rel-t">${fmt(p.build[0])}</span>
      </button>`).join("");
    $("#rels").addEventListener("click", e => { const b = e.target.closest(".rel"); if (b) select(+b.dataset.i); });
    $("#rels").addEventListener("pointerover", e => { const b = e.target.closest(".rel"); if (b && !b.contains(e.relatedTarget) && +b.dataset.i !== cur) sfx("hover"); });
  }

  // ---------- the selected relationship ----------
  const li = arr => arr.map(f => `<li>${esc(f)}</li>`).join("");
  const num = n => n.toLocaleString("en-GB");
  function renderStats(p) {
    const a = M[p.war[0]], b = M[p.build[0]]; if (!a || !b) { $("#stats").innerHTML = ""; return; }
    const row = (label, x, y) => `<span>${label}</span><b>${x}</b><b>${y}</b>`;
    $("#stats").innerHTML = `<span></span><span>War</span><span>Building</span>`
      + row("Louder than", a.louder + "% of the film", b.louder + "% of the film") + row("Bass", a.bass + "%", b.bass + "%")
      + row("Tone centre", num(a.hz) + " Hz", num(b.hz) + " Hz") + row("Hits a second", a.hits, b.hits);
  }
  function select(i, quiet) {
    if (i < 0 || i >= PAIRS.length) return;
    if (!quiet && i !== cur) sfx("click");
    cur = i; stopPlay();
    document.querySelectorAll(".rel").forEach(b => { const on = +b.dataset.i === i; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    const p = PAIRS[i], my = ++token;
    $("#pTitle").textContent = `${p.war[1]} vs ${p.build[1].replace(/^./, ch => ch.toLowerCase())}`;
    $("#pMeta").textContent = `War at ${fmt(p.war[0])}, building at ${fmt(p.build[0])}. ${p.watched ? "Paired by watching the film" : "Building moment picked by measurement"}`;
    $("#pct").textContent = "";
    $("#warHead").textContent = p.war[1];
    $("#buildHead").textContent = p.build[1];
    $("#warFacts").innerHTML = li(p.warFacts);
    $("#buildFacts").innerHTML = li(p.buildFacts);
    $("#linkFacts").innerHTML = li(p.linkFacts);
    $("#whyFacts").innerHTML = li(p.whyFacts);
    renderStats(p);
    const card = $("#detail"); card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    renderFoot(null, p);
    window.COMPARE.preload([p.war[0], p.build[0]]);
    window.COMPARE.compare(p.war[0], p.build[0]).then(c => {
      if (my !== token) return;
      res = c; shift = 0;
      $("#linkFacts").innerHTML = li(p.linkFacts) + (c.regs.length ? li([window.COMPARE.hear(c).replace(/\.$/, "")]) : "");
      $("#pShift").textContent = c.lag ? `(${Math.abs(c.lagSec).toFixed(1)} s)` : "";
      $("#pAlign").checked = true; $("#pAlignText").textContent = "Lined up";
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
    const row = (side, label, items) => `<div class="mrow ${side}"><span class="mlab">Like the ${esc(label.replace(/^(The|A) /, "").toLowerCase())}</span><div class="mchips">${
      items ? items.map(m => { const s = seenAt(m.t); return `<button class="mchip" data-t="${m.t}" aria-label="Play ${fmt(m.t)}${s ? ", " + s : ""}">${fmt(m.t)}${s ? ` <span>${s}</span>` : ""}</button>`; }).join("")
        : `<span class="lab">Listening through the film…</span>`}</div></div>`;
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
    const t0 = performance.now(), dur = reduce ? 0 : 700;
    const step = now => { const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3);
      $("#pct").textContent = `${Math.round(to * e)}% alike once lined up`; if (k < 1) requestAnimationFrame(step); };
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
    $("#pAlign").onchange = e => { $("#pAlignText").textContent = e.target.checked ? "Lined up" : "Original timing"; $("#pShift").hidden = !e.target.checked; if (!res) return; stopPlay(); const from = shift, to = e.target.checked ? 1 : 0; tween(450, k => { shift = from + (to - from) * k; paint(1, shift, null); }); };
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
