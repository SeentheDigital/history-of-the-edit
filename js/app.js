/* =====================================================================
   APP — builds the map from data.js and runs the camera, panel,
   timeline and sound. You shouldn't need to edit this file to add
   clips or change text; see README.md.
   ===================================================================== */

(function () {
  "use strict";
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DATA = window.EDIT || {};
  const SET = DATA.settings || {};
  const KINDS = DATA.kinds || {};
  const ICON = window.EDIT_ICONS || {};
  const AUDIO = window.EditAudio || null;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  /* ---------- validate the data so editing mistakes are visible ---------- */
  const errors = [];
  const NODES = [], byId = {};
  (DATA.nodes || []).forEach((n, i) => {
    if (!n || !n.id) { errors.push("Clip #" + (i + 1) + " has no id."); return; }
    if (!/^[a-z0-9-]+$/i.test(n.id)) errors.push('Clip "' + n.id + '": ids can only use letters, numbers and dashes.');
    if (byId[n.id]) { errors.push('Two clips share the id "' + n.id + '". The second one was skipped.'); return; }
    if (typeof n.yr !== "number") errors.push('Clip "' + n.id + '" needs a number in "yr".');
    if (typeof n.y !== "number") errors.push('Clip "' + n.id + '" needs a number in "y".');
    if (!KINDS[n.kind]) errors.push('Clip "' + n.id + '" uses the category "' + n.kind + '", which isn\'t listed in kinds.');
    const ic = n.icon || n.id;
    if (!ICON[ic]) { if (n.icon) errors.push('Clip "' + n.id + '" asks for the icon "' + n.icon + '", which isn\'t in icons.js. Using the generic one.'); }
    n.iconSvg = ICON[ic] || ICON.generic || "";
    n.media = Array.isArray(n.media) ? n.media : [];
    n.ins = []; n.outs = [];
    NODES.push(n); byId[n.id] = n;
  });
  const EDGES = [];
  (DATA.edges || []).forEach(e => {
    const [a, b] = e || [];
    if (!byId[a] || !byId[b]) { errors.push("The connection [" + a + ", " + b + "] points to a clip that doesn't exist."); return; }
    if (EDGES.some(x => x[0] === a && x[1] === b)) return;
    EDGES.push([a, b]); byId[a].outs.push(b); byId[b].ins.push(a);
  });
  if (errors.length) {
    const box = document.createElement("div");
    box.id = "dataErrors";
    box.innerHTML = '<button type="button" id="dataErrorsClose">Dismiss</button><b>Something in data.js or icons.js needs fixing:</b><ul>' + errors.map(e => "<li>" + esc(e) + "</li>").join("") + "</ul>";
    box.querySelector("button").addEventListener("click", () => box.remove());
    document.body.appendChild(box);
    console.warn("[history of the edit]", errors);
  }

  /* ---------- category colors, generated from data.js ---------- */
  const kindKeys = Object.keys(KINDS).filter(k => /^[a-z0-9-]+$/i.test(k));
  const safeColor = c => /^#[0-9a-f]{3,8}$|^rgba?\([\d\s.,%]+\)$|^hsla?\([\d\s.,%deg]+\)$/i.test(String(c || "")) ? c : "#888";
  const lightVars = kindKeys.map(k => "--kind-" + k + ":" + safeColor(KINDS[k].light)).join(";");
  const darkVars = kindKeys.map(k => "--kind-" + k + ":" + safeColor(KINDS[k].dark || KINDS[k].light)).join(";");
  const kindStyle = document.createElement("style");
  kindStyle.textContent =
    ":root{" + lightVars + "}" +
    "@media (prefers-color-scheme:dark){:root:not([data-theme=\"light\"]){" + darkVars + "}}" +
    ":root[data-theme=\"dark\"]{" + darkVars + "}" +
    kindKeys.map(k => "[data-kind=\"" + k + "\"]{--k:var(--kind-" + k + ")}").join("");
  document.head.appendChild(kindStyle);

  /* ---------- page text ---------- */
  const lines = SET.titleLines || ["the history", "of the edit"];
  $("#hero-title").innerHTML = lines.map(l => "<span>" + esc(l) + "</span>").join("");
  if (SET.lede) $(".hero-lede").textContent = SET.lede;
  $("#brand").firstChild.textContent = lines.join(" ");
  document.title = lines.join(" ").replace(/^./, c => c.toUpperCase());
  const legend = $(".legend");
  legend.innerHTML = kindKeys.map(k => '<span data-kind="' + k + '">' + esc(KINDS[k].label || k) + "</span>").join("");

  /* ---------- timeline scale ---------- */
  const TL = (SET.timeline && SET.timeline.length > 1 ? SET.timeline : [[1920, 120], [1980, 720], [2000, 1120], [2030, 2020]]).slice().sort((a, b) => a[0] - b[0]);
  function yx(y) {
    if (y <= TL[0][0]) { const [a, b] = [TL[0], TL[1]]; return a[1] + (y - a[0]) * (b[1] - a[1]) / (b[0] - a[0]); }
    for (let i = 0; i < TL.length - 1; i++) {
      const a = TL[i], b = TL[i + 1];
      if (y <= b[0]) return a[1] + (y - a[0]) * (b[1] - a[1]) / (b[0] - a[0]);
    }
    const a = TL[TL.length - 2], b = TL[TL.length - 1];
    return b[1] + (y - b[0]) * (b[1] - a[1]) / (b[0] - a[0]);
  }
  NODES.forEach(n => { n.x = typeof n.x === "number" ? n.x : yx(n.yr); });
  const ORDER = NODES.slice().sort((a, b) => a.yr - b.yr || a.y - b.y);
  ORDER.forEach((n, i) => n.ord = i);
  const W = Math.max(1600, Math.max.apply(null, NODES.map(n => n.x).concat([0])) + 200);
  const H = SET.worldHeight || 1000;

  const hero = $("#hero"), stage = $("#stage"), viewport = $("#viewport"), world = $("#world"),
        edgesSvg = $("#edges"), panel = $("#panel"), tracking = $("#tracking"), hint = $("#hint");
  world.style.width = W + "px"; world.style.height = H + "px";
  edgesSvg.setAttribute("viewBox", "0 0 " + W + " " + H);
  edgesSvg.setAttribute("width", W); edgesSvg.setAttribute("height", H);

  /* decades */
  const d0 = (SET.decades && SET.decades[0]) || 1920, d1 = (SET.decades && SET.decades[1]) || 2020;
  for (let d = d0; d <= d1; d += 10) {
    const el = document.createElement("div");
    el.className = "decade"; el.style.left = yx(d) + "px";
    el.innerHTML = "<span>" + d + "s</span>";
    world.appendChild(el);
  }
  if (SET.worldNote) {
    const note = document.createElement("div");
    note.className = "world-note"; note.textContent = SET.worldNote;
    world.appendChild(note);
  }

  /* edges */
  const NS = "http://www.w3.org/2000/svg";
  const edgeEls = EDGES.map(([a, b]) => {
    const A = byId[a], B = byId[b];
    const dx = Math.max(90, Math.abs(B.x - A.x) * 0.55);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M" + A.x + " " + A.y + " C" + (A.x + dx) + " " + A.y + " " + (B.x - dx) + " " + B.y + " " + B.x + " " + B.y);
    p.setAttribute("class", "edge");
    p.style.setProperty("--c", "var(--kind-" + A.kind + ")");
    p.dataset.from = a; p.dataset.to = b;
    edgesSvg.appendChild(p);
    return p;
  });

  /* clips */
  const clipEls = {};
  NODES.forEach(n => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "clip pre"; b.dataset.kind = n.kind; b.dataset.id = n.id;
    b.style.left = n.x + "px"; b.style.top = n.y + "px";
    const kindLong = (KINDS[n.kind] && (KINDS[n.kind].long || KINDS[n.kind].label)) || "";
    b.setAttribute("aria-label", n.name + ", " + n.era + ". " + kindLong + ". Open details");
    b.innerHTML = '<span class="clip-row"><span class="clip-icon"><svg viewBox="0 0 48 48" aria-hidden="true">' + n.iconSvg +
      '</svg></span><span class="clip-txt"><span class="clip-name">' + esc(n.name) + '</span><span class="clip-year">' + esc(n.era) + '</span></span></span>';
    b.addEventListener("click", e => { if (suppressClick) { e.preventDefault(); return; } openNode(n.id); });
    b.addEventListener("mouseenter", () => { if (!current) highlight(n.id, true); });
    b.addEventListener("mouseleave", () => { if (!current) clearHighlight(); });
    b.addEventListener("focus", () => { if (!current && !pointerActive) ensureVisible(n); });
    world.appendChild(b);
    clipEls[n.id] = b;
  });

  /* scrubber */
  const scrubIn = $("#scrubIn"), scrubPh = $("#scrubPh");
  const s0 = yx(d0 - 2), s1 = Math.max(yx(d1 + 8), W - 100);
  const pct = x => ((x - s0) / (s1 - s0)) * 100;
  for (let d = d0; d <= d1; d += 10) {
    if (d < 1980 && d !== d0 && d !== 1950 && d !== 1970) continue;
    const t = document.createElement("span");
    t.className = "scrub-dec" + ((d % 20 === 10 && d > 1960) ? " minor" : "");
    t.style.left = pct(yx(d)) + "%"; t.textContent = d; t.setAttribute("aria-hidden", "true");
    scrubIn.appendChild(t);
  }
  const rowGap = Math.min(10, Math.floor(40 / Math.max(1, kindKeys.length)));
  const trackTop = () => (window.innerWidth <= 760 ? 20 : 22);
  const markers = NODES.map(n => {
    const m = document.createElement("button");
    m.type = "button"; m.className = "mk"; m.dataset.kind = n.kind;
    m.style.left = pct(n.x) + "%";
    m.style.top = (trackTop() + Math.max(0, kindKeys.indexOf(n.kind)) * rowGap) + "px";
    m.title = n.name + ", " + n.era;
    m.setAttribute("aria-label", n.name + ", " + n.era);
    m.addEventListener("click", () => openNode(n.id));
    scrubIn.appendChild(m);
    return m;
  });

  /* ---------- camera ---------- */
  const cam = {x: 0, y: 0, s: 1};
  function apply(dur) {
    world.style.transition = dur ? "transform " + dur + "ms cubic-bezier(.77,0,.18,1)" : "none";
    world.style.transform = "translate3d(" + cam.x + "px," + cam.y + "px,0) scale(" + cam.s + ")";
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isNarrow = () => window.innerWidth <= 760;
  const hudH = () => (isNarrow() ? 96 : 76);
  const scrubH = () => (isNarrow() ? 58 : 66);

  function overview(dur, whole) {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const top = hudH(), availH = vh - top - scrubH();
    const fit = Math.min((vw - 24) / W, availH / H);
    if (isNarrow() && !whole) {
      const s = Math.max(fit, 0.5);
      cam.s = s; cam.x = 24 - 90 * s; cam.y = top + availH / 2 - 560 * s;
    } else {
      cam.s = fit; cam.x = (vw - W * fit) / 2; cam.y = top + (availH - H * fit) / 2;
    }
    apply(RM ? 0 : dur);
  }
  function focusGeometry() {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    if (isNarrow()) {
      const sheet = vh * 0.64, top = 80, availH = vh - sheet - top;
      return {cx: vw / 2, cy: top + availH / 2, s: clamp(Math.min(vw / 400, availH / 210), 0.55, 1.3)};
    }
    const pw = panel.offsetWidth, availW = vw - pw, top = hudH(), availH = vh - top - scrubH();
    return {cx: availW / 2, cy: top + availH / 2, s: clamp(Math.min(availW / 560, availH / 360), 0.7, 1.85)};
  }
  function focusCam(n, dur) {
    const g = focusGeometry();
    cam.s = g.s; cam.x = g.cx - n.x * g.s; cam.y = g.cy - n.y * g.s;
    apply(RM ? 0 : dur);
  }
  function zoomAt(px, py, f, dur) {
    const ns = clamp(cam.s * f, 0.14, 3);
    const wx = (px - cam.x) / cam.s, wy = (py - cam.y) / cam.s;
    cam.s = ns; cam.x = px - wx * ns; cam.y = py - wy * ns;
    apply(dur || 0);
  }
  function ensureVisible(n) {
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    const sx = cam.x + n.x * cam.s, sy = cam.y + n.y * cam.s;
    if (sx < 60 || sx > vw - 60 || sy < hudH() + 30 || sy > vh - scrubH() - 30) {
      cam.x += vw / 2 - sx; cam.y += (hudH() + vh - scrubH()) / 2 - sy; apply(RM ? 0 : 600);
    }
  }

  /* ---------- highlight ---------- */
  function highlight(id, hover) {
    world.classList.toggle("hovering", !!hover);
    world.classList.toggle("focus", !hover);
    const n = byId[id], rel = new Set([id].concat(n.ins, n.outs));
    edgeEls.forEach(p => { p.classList.toggle("out", p.dataset.from === id); p.classList.toggle("in", p.dataset.to === id); });
    Object.keys(clipEls).forEach(k => {
      clipEls[k].classList.toggle("related", rel.has(k) && k !== id);
      clipEls[k].classList.toggle("active", k === id);
    });
  }
  function clearHighlight() {
    world.classList.remove("hovering", "focus");
    edgeEls.forEach(p => p.classList.remove("in", "out"));
    Object.values(clipEls).forEach(c => c.classList.remove("related", "active"));
  }

  function cut(soft) {
    if (RM) return;
    tracking.classList.remove("on", "soft");
    void tracking.offsetWidth;
    if (soft) tracking.classList.add("soft");
    tracking.classList.add("on");
  }

  /* ---------- tapes: real clips inside the panel ---------- */
  function stopTape(silent) {
    const art = panel.querySelector(".p-art");
    if (art) { art.classList.remove("screen", "listen"); const sc = art.querySelector(".p-screen"); if (sc) sc.innerHTML = ""; }
    panel.querySelectorAll(".tape.on").forEach(t => t.classList.remove("on"));
    if (AUDIO) AUDIO.duck(false);
  }
  function playTape(n, i) {
    const m = n.media[i]; if (!m) return;
    const art = panel.querySelector(".p-art"), sc = art.querySelector(".p-screen");
    stopTape(true);
    art.classList.add(m.type === "audio" ? "listen" : "screen");
    panel.querySelectorAll(".tape").forEach((t, k) => t.classList.toggle("on", k === i));
    if (AUDIO && !AUDIO.isMuted()) AUDIO.sfx.insert();
    let el;
    if (m.type === "youtube") {
      el = document.createElement("iframe");
      el.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(m.id) + "?autoplay=1&rel=0&start=" + (parseInt(m.start, 10) || 0);
      el.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      el.allowFullscreen = true;
      el.title = m.caption || n.name;
      if (AUDIO) AUDIO.duck(true);
    } else if (m.type === "audio") {
      el = document.createElement("audio");
      el.src = m.src; el.controls = true; el.autoplay = true;
      if (m.start) el.addEventListener("loadedmetadata", () => { el.currentTime = m.start; }, {once: true});
      el.addEventListener("play", () => AUDIO && AUDIO.duck(true));
      el.addEventListener("pause", () => AUDIO && AUDIO.duck(false));
      el.addEventListener("ended", () => AUDIO && AUDIO.duck(false));
      el.addEventListener("error", () => {
        el.remove();
        const msg = document.createElement("p");
        msg.className = "tape-err";
        msg.textContent = "Couldn't play " + m.src + ". Check the file name and that it's in the audio folder (.mp3, .wav, .ogg or .m4a).";
        sc.insertBefore(msg, sc.firstChild);
      });
    } else if (m.type === "image") {
      el = document.createElement("img");
      el.src = m.src; el.alt = m.caption || n.name;
    } else {
      el = document.createElement("video");
      el.src = m.src; el.controls = true; el.autoplay = true; el.playsInline = true;
      if (m.start) el.addEventListener("loadedmetadata", () => { el.currentTime = m.start; }, {once: true});
      el.addEventListener("play", () => AUDIO && AUDIO.duck(true));
      el.addEventListener("pause", () => AUDIO && AUDIO.duck(false));
      el.addEventListener("ended", () => AUDIO && AUDIO.duck(false));
      el.addEventListener("error", () => {
        el.remove();
        const msg = document.createElement("p");
        msg.className = "tape-err";
        msg.textContent = "Couldn't play " + m.src + ". Check that the file is in the media folder, that its name matches data.js exactly, and that it's an .mp4 (H.264) or .webm video.";
        sc.insertBefore(msg, sc.firstChild);
      });
    }
    sc.appendChild(el);
    const ej = document.createElement("button");
    ej.type = "button"; ej.className = "tape-eject"; ej.textContent = "\u23CF Eject";
    ej.addEventListener("click", () => stopTape());
    sc.appendChild(ej);
  }

  /* ---------- panel ---------- */
  let current = null, navToken = 0;
  function paragraphs(n) {
    const t = n.text != null ? n.text : n.lede;
    if (Array.isArray(t)) return t.filter(Boolean);
    return t ? [t] : [];
  }
  function chipHTML(id) {
    const n = byId[id];
    return '<button type="button" class="chip" data-kind="' + n.kind + '" data-go="' + id + '"><span class="chip-ic"><svg viewBox="0 0 48 48" aria-hidden="true">' +
      n.iconSvg + '</svg></span>' + esc(n.name) + '</button>';
  }
  function renderPanel(n) {
    stopTape(true);
    const prev = ORDER[n.ord - 1], next = ORDER[n.ord + 1];
    const ins = n.ins.slice().sort((a, b) => byId[a].yr - byId[b].yr);
    const outs = n.outs.slice().sort((a, b) => byId[a].yr - byId[b].yr);
    const kindLong = (KINDS[n.kind] && (KINDS[n.kind].long || KINDS[n.kind].label)) || "";
    const media = n.media;
    let tapeList = "";
    if (media.length > 1) {
      tapeList = '<div class="tapes">' + media.map((m, i) =>
        '<button type="button" class="tape" data-tape="' + i + '"><b>Tape ' + (i + 1) + '</b><span>' + esc(m.caption || m.src || m.id || "") + '</span></button>').join("") + '</div>';
    } else if (media.length === 1 && media[0].caption) {
      tapeList = '<p class="tape-cap">' + esc(media[0].caption) + '</p>';
    }
    panel.dataset.kind = n.kind;
    panel.innerHTML =
      '<div class="p-head"><div class="p-spine"></div><div class="p-headtxt"><span>&#9654; ' + esc(n.era) +
      ' &nbsp;' + String(n.ord + 1).padStart(2, "0") + '/' + NODES.length + '</span>' +
      '<button type="button" class="p-close" id="pClose">Back to the map <span aria-hidden="true">&#10005;</span></button></div></div>' +
      '<div class="p-body swap">' +
        '<span class="p-kind">' + esc(kindLong) + '</span>' +
        '<h2 class="p-title glitch" tabindex="-1">' + esc(n.name) + '</h2>' +
        '<div class="p-art" data-era="' + esc(n.era) + '"><svg class="draw" viewBox="0 0 48 48" aria-hidden="true">' + n.iconSvg + '</svg>' +
          '<div class="p-screen"></div>' +
          (media.length ? '<button type="button" class="tape-btn" data-tape="0">&#9654; Play the tape</button>' : '') +
        '</div>' + tapeList +
        '<div class="p-text">' + paragraphs(n).map(t => '<p>' + t + '</p>').join("") + '</div>' +
        (n.move ? '<h3>Signature move</h3><p class="p-move">' + n.move + '</p>' : '') +
        '<h3>Drew from</h3>' + (ins.length ? '<div class="chips">' + ins.map(chipHTML).join("") + '</div>' : '<p class="none">The starting point. Everything on this map descends from here.</p>') +
        '<h3>Fed into</h3>' + (outs.length ? '<div class="chips">' + outs.map(chipHTML).join("") + '</div>' : '<p class="none">The present. This is where the lines currently end.</p>') +
        '<div class="p-nav">' +
          '<button type="button" data-go="' + (prev ? prev.id : "") + '"' + (prev ? "" : " disabled") + '><small>&#9664;&#9664; earlier</small><span>' + (prev ? esc(prev.name) : "Nothing earlier") + '</span></button>' +
          '<button type="button" data-go="' + (next ? next.id : "") + '"' + (next ? "" : " disabled") + '><small>later &#9654;&#9654;</small><span>' + (next ? esc(next.name) : "Nothing later") + '</span></button>' +
        '</div>' +
      '</div>';
    panel.querySelectorAll(".p-art svg.draw :is(path,circle,rect,ellipse,line,polyline)").forEach((el, i) => {
      el.setAttribute("pathLength", "1");
      el.style.animationDelay = (0.25 + i * 0.09) + "s";
    });
    panel.querySelector("#pClose").addEventListener("click", closePanel);
    panel.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => { if (b.dataset.go) openNode(b.dataset.go); }));
    panel.querySelectorAll("[data-tape]").forEach(b => b.addEventListener("click", () => playTape(n, parseInt(b.dataset.tape, 10))));
  }
  function openNode(id) {
    const n = byId[id];
    if (!n) return;
    const prevId = current;
    if (prevId === id) return;
    current = id;
    const token = ++navToken;
    hideHint();
    highlight(id, false);
    renderPanel(n);
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    stage.classList.add("panel-open");
    scrubPh.style.left = pct(n.x) + "%";
    scrubPh.classList.add("show");
    if (AUDIO) { AUDIO.sfx.clip(NODES.length > 1 ? n.ord / (NODES.length - 1) : 0); AUDIO.setFocus(true); }
    cut(!!prevId);
    const A = prevId ? byId[prevId] : null;
    if (A && !RM) {
      const d = Math.hypot(n.x - A.x, n.y - A.y);
      if (d > 280) {
        const g = focusGeometry();
        const mx = (A.x + n.x) / 2, my = (A.y + n.y) / 2;
        const span = Math.max(Math.abs(n.x - A.x) + 420, (Math.abs(n.y - A.y) + 320) * 1.4);
        const sm = clamp(Math.min(g.s * 0.62, (g.cx * 2) / span), 0.22, g.s);
        cam.s = sm; cam.x = g.cx - mx * sm; cam.y = g.cy - my * sm;
        apply(480);
        setTimeout(() => { if (token === navToken) focusCam(n, 720); }, 470);
      } else focusCam(n, 800);
    } else focusCam(n, prevId ? 0 : 1000);
    setTimeout(() => { const h = panel.querySelector(".p-title"); if (h && token === navToken) h.focus({preventScroll: true}); }, RM ? 0 : 420);
  }
  function resetPanel() {
    stopTape(true);
    current = null; navToken++;
    panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true");
    stage.classList.remove("panel-open"); scrubPh.classList.remove("show");
    clearHighlight();
    if (AUDIO) AUDIO.setFocus(false);
  }
  function closePanel() {
    if (!current) return;
    const was = current;
    resetPanel();
    if (AUDIO) AUDIO.sfx.close();
    cut(true);
    overview(900);
    const c = clipEls[was];
    if (c) c.focus({preventScroll: true});
  }

  /* ---------- sound toggle ---------- */
  const soundBtn = $("#soundBtn");
  const heroSound = $("#heroSound");
  function syncSound() {
    const on = AUDIO ? !AUDIO.isMuted() : false;
    soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
    soundBtn.querySelector(".lbl").textContent = on ? "Sound on" : "Muted";
    if (heroSound) {
      heroSound.setAttribute("aria-pressed", on ? "true" : "false");
      heroSound.textContent = !on ? "\u266A Sound is muted" : (AUDIO.running() ? "\u266A Sound on" : "\u266A Click anywhere for sound");
    }
  }
  if (!AUDIO) { soundBtn.hidden = true; if (heroSound) heroSound.hidden = true; }

  // Browsers only allow sound after the first click, tap or key press.
  // The title screen's tape hiss starts then (or right away if allowed).
  let justUnlocked = 0;
  const UNLOCK_EVENTS = ["pointerdown", "keydown", "touchstart"];
  function unlockAudio() {
    if (!AUDIO) return;
    if (!AUDIO.running()) justUnlocked = performance.now();
    AUDIO.intro();
    [60, 300, 1000].forEach(t => setTimeout(syncSound, t));
    if (AUDIO.running()) UNLOCK_EVENTS.forEach(x => window.removeEventListener(x, unlockAudio, true));
  }
  if (AUDIO) {
    // Only try straight away if the page has already been interacted with;
    // otherwise the browser would refuse and log a warning.
    if (navigator.userActivation && navigator.userActivation.hasBeenActive) { try { AUDIO.intro(); } catch (e) {} }
    [300, 1000].forEach(t => setTimeout(syncSound, t));
    UNLOCK_EVENTS.forEach(ev => window.addEventListener(ev, unlockAudio, true));
  }
  if (heroSound) heroSound.addEventListener("click", () => {
    if (!AUDIO) return;
    if (performance.now() - justUnlocked > 600) AUDIO.setMuted(!AUDIO.isMuted());
    syncSound();
  });
  soundBtn.addEventListener("click", () => {
    if (!AUDIO) return;
    AUDIO.init(); AUDIO.setMuted(!AUDIO.isMuted());
    if (!AUDIO.isMuted() && stage.classList.contains("on") && !AUDIO.isPlaying()) AUDIO.startMusic(0.1);
    syncSound();
  });
  syncSound();

  /* ---------- intro / stage ---------- */
  let started = false;
  function startStage() {
    if (AUDIO) { AUDIO.init(); AUDIO.sfx.play(); AUDIO.startMusic(0.9); }
    cut(false);
    hero.classList.add("gone");
    hero.setAttribute("aria-hidden", "true");
    stage.classList.add("on");
    overview(0);
    const target = {x: cam.x, y: cam.y, s: cam.s};
    if (!RM) {
      const vw = viewport.clientWidth, vh = viewport.clientHeight;
      cam.s = target.s * 0.55; cam.x = vw / 2 - (W / 2) * cam.s; cam.y = vh / 2 - (H / 2) * cam.s;
      apply(0); void world.offsetWidth;
      cam.x = target.x; cam.y = target.y; cam.s = target.s;
      apply(1300);
    }
    if (!started) {
      started = true;
      drawEdgesIn();
      ORDER.forEach((n, i) => setTimeout(() => clipEls[n.id].classList.remove("pre"), RM ? 0 : 350 + i * 55));
    } else Object.values(clipEls).forEach(c => c.classList.remove("pre"));
    setTimeout(() => $("#fitBtn").focus({preventScroll: true}), RM ? 0 : 900);
  }
  function drawEdgesIn() {
    if (RM) return;
    edgeEls.forEach(p => {
      const len = p.getTotalLength(), delay = 300 + byId[p.dataset.from].ord * 70;
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.style.transition = "none";
      void p.getBoundingClientRect();
      p.style.transition = "stroke-dashoffset 1.3s cubic-bezier(.6,0,.2,1) " + delay + "ms, opacity .35s, stroke-width .35s";
      p.style.strokeDashoffset = 0;
    });
    setTimeout(() => edgeEls.forEach(p => { p.style.strokeDasharray = ""; p.style.strokeDashoffset = ""; p.style.transition = ""; }), 3200);
  }
  function rewind() {
    resetPanel();
    if (AUDIO) { AUDIO.sfx.rewind(); AUDIO.stopMusic(); setTimeout(syncSound, 60); }
    stage.classList.remove("on");
    hero.classList.remove("gone", "run");
    hero.removeAttribute("aria-hidden");
    void hero.offsetWidth;
    hero.classList.add("run");
    cut(true);
    tcStart = performance.now();
    setTimeout(() => $("#playBtn").focus({preventScroll: true}), 300);
  }
  $("#playBtn").addEventListener("click", startStage);
  $("#brand").addEventListener("click", rewind);
  $("#fitBtn").addEventListener("click", () => { if (current) { resetPanel(); if (AUDIO) AUDIO.sfx.close(); } overview(800, true); });
  $("#zoomIn").addEventListener("click", () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1.35, RM ? 0 : 350));
  $("#zoomOut").addEventListener("click", () => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1 / 1.35, RM ? 0 : 350));

  /* timecode */
  let tcStart = performance.now();
  const tcEl = $("#tc");
  (function tick(now) {
    if (!hero.classList.contains("gone")) {
      const t = Math.max(0, now - tcStart) / 1000;
      const f = Math.floor((t % 1) * 25), s = Math.floor(t) % 60, m = Math.floor(t / 60) % 60, h = Math.floor(t / 3600);
      const p = v => String(v).padStart(2, "0");
      tcEl.textContent = p(h) + ":" + p(m) + ":" + p(s) + ":" + p(f);
    }
    requestAnimationFrame(tick);
  })(performance.now());

  /* ---------- pan / pinch / wheel ---------- */
  const pts = new Map();
  let dragging = false, suppressClick = false, pointerActive = false, startPt = null, pinch = null;
  function hideHint() { hint.classList.add("hide"); }
  viewport.addEventListener("pointerdown", e => {
    pointerActive = true;
    pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pts.size === 1) { startPt = {x: e.clientX, y: e.clientY}; dragging = false; suppressClick = false; }
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = {d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2};
      dragging = true; suppressClick = true;
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });
  viewport.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    pts.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      cam.x += mx - pinch.mx; cam.y += my - pinch.my;
      zoomAt(mx, my, d / pinch.d, 0);
      pinch = {d, mx, my}; hideHint();
      return;
    }
    if (!dragging && startPt && Math.hypot(e.clientX - startPt.x, e.clientY - startPt.y) > 6) {
      dragging = true; suppressClick = true;
      viewport.classList.add("dragging");
      try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
      hideHint();
    }
    if (dragging) { cam.x += e.clientX - prev.x; cam.y += e.clientY - prev.y; apply(0); }
  });
  function endPointer(e) {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 0) {
      viewport.classList.remove("dragging");
      dragging = false; startPt = null;
      setTimeout(() => { suppressClick = false; pointerActive = false; }, 0);
    }
  }
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);
  viewport.addEventListener("wheel", e => {
    e.preventDefault(); hideHint();
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), 0);
  }, {passive: false});

  /* ---------- keys ---------- */
  document.addEventListener("keydown", e => {
    if (!stage.classList.contains("on")) return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "VIDEO" || tag === "INPUT") return;
    if (e.key === "Escape" && current) { e.preventDefault(); closePanel(); }
    else if (current && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      const t = ORDER[byId[current].ord + (e.key === "ArrowRight" ? 1 : -1)];
      if (t) { e.preventDefault(); openNode(t.id); }
    }
    else if (e.key === "m" || e.key === "M") soundBtn.click();
    else if (!current && (e.key === "+" || e.key === "=")) zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1.3, RM ? 0 : 300);
    else if (!current && (e.key === "-" || e.key === "_")) zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, 1 / 1.3, RM ? 0 : 300);
  });

  /* ---------- resize ---------- */
  let rz;
  window.addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      markers.forEach((m, i) => { m.style.top = (trackTop() + Math.max(0, kindKeys.indexOf(NODES[i].kind)) * rowGap) + "px"; });
      if (!stage.classList.contains("on")) return;
      if (current) focusCam(byId[current], 0); else overview(0);
    }, 120);
  });
  overview(0);
})();
