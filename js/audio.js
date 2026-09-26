/* =====================================================================
   AUDIO — an original soundtrack and sound effects, synthesized live
   in the browser with the Web Audio API. No audio files, no samples,
   nothing copyrighted.

   The song, "Tracking", is a warbly VHS synthwave loop in A minor:
   pad, bass, drum machine, an arpeggio through a tape echo, and a
   lead melody, all run through fake tape wow and hiss.

   Easy things to change are in SONG below: tempo, chords, melody,
   and which instruments play in which bars.

   To use your own audio instead, you don't need to touch this file:
   put files in the audio folder and name them in js/data.js
   (settings.music.file for the soundtrack, "sounds" for effects).
   ===================================================================== */

(function () {
  "use strict";

  const SETTINGS = (window.EDIT && window.EDIT.settings && window.EDIT.settings.music) || {};
  const SOUNDS = (window.EDIT && window.EDIT.sounds) || {};
  const HISS_INTRO = SETTINGS.hissIntro != null ? SETTINGS.hissIntro : 0.012;
  const HISS_MAP = SETTINGS.hissMap != null ? SETTINGS.hissMap : 0.005;

  const SONG = {
    bpm: SETTINGS.bpm || 92,

    // One chord per bar, looping. MIDI note numbers (60 = middle C).
    //   bass: root note   pad: chord tones   arp: notes the arpeggio cycles through
    chords: [
      { name: "Am", bass: 45, pad: [57, 60, 64, 67], arp: [69, 72, 76, 79] },
      { name: "F",  bass: 41, pad: [53, 57, 60, 64], arp: [65, 69, 72, 76] },
      { name: "C",  bass: 48, pad: [55, 60, 64, 67], arp: [67, 72, 76, 79] },
      { name: "G",  bass: 43, pad: [55, 59, 62, 67], arp: [67, 71, 74, 79] }
    ],

    // Lead melody, 8 bars. Each note: [midi, start beat, length in beats]
    melody: [
      [[76, 0, 1.5], [74, 1.5, 0.5], [72, 2, 1], [69, 3, 1]],
      [[72, 0, 2], [69, 2, 1], [72, 3, 1]],
      [[67, 0, 1.5], [69, 1.5, 0.5], [72, 2, 1], [76, 3, 1]],
      [[74, 0, 3], [71, 3, 1]],
      [[76, 0, 1], [79, 1, 1], [76, 2, 1], [74, 3, 1]],
      [[72, 0, 1.5], [74, 1.5, 0.5], [72, 2, 1], [69, 3, 1]],
      [[67, 0, 1], [72, 1, 1], [76, 2, 2]],
      [[74, 0, 4]]
    ],

    // Arrangement: which parts play in which bar range [from, to).
    // After bar 32 the song loops back to bar 4 (the intro plays once).
    sections: {
      pad:       [[0, 32]],
      bass:      [[0, 24]],
      bassHold:  [[24, 32]],
      kick:      [[4, 24]],
      kickHalf:  [[24, 32]],
      hats:      [[4, 24]],
      snare:     [[8, 24]],
      arp:       [[8, 32]],
      lead:      [[16, 24]]
    },
    loopFrom: 4,
    length: 32
  };

  const SPB = 60 / SONG.bpm;   // seconds per beat
  const S16 = SPB / 4;         // seconds per sixteenth

  let ctx = null, master, comp, musicBus, wowDelay, focusFilter, duckGain, sfxBus,
      reverbSend, delaySend, noiseBuf, hissSrc = null, hissGain;
  let playing = false, timer = null, step = 0, nextTime = 0;
  let muted = false;
  const volume = SETTINGS.volume != null ? SETTINGS.volume : 0.8;
  try { muted = localStorage.getItem("hote-muted") === "1"; } catch (e) {}

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const inSection = (name, bar) => (SONG.sections[name] || []).some(([a, b]) => bar >= a && bar < b);

  function makeCurve(k) {
    const n = 2048, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
    return c;
  }
  function makeIR(seconds) {
    const rate = ctx.sampleRate, len = Math.floor(rate * seconds), buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();

    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    master = ctx.createGain(); master.gain.value = muted ? 0 : volume;
    master.connect(comp); comp.connect(ctx.destination);

    // tape: soft saturation and a gentle top-end roll-off
    const sat = ctx.createWaveShaper(); sat.curve = makeCurve(1.5); sat.oversample = "2x";
    const tapeLP = ctx.createBiquadFilter(); tapeLP.type = "lowpass"; tapeLP.frequency.value = 9000; tapeLP.Q.value = 0.3;
    sat.connect(tapeLP); tapeLP.connect(master);

    // music path: bus -> wow/flutter -> focus filter -> duck -> tape
    musicBus = ctx.createGain(); musicBus.gain.value = 0;
    wowDelay = ctx.createDelay(0.05); wowDelay.delayTime.value = 0.008;
    const wowLfo = ctx.createOscillator(); wowLfo.frequency.value = 0.45;
    const wowAmt = ctx.createGain(); wowAmt.gain.value = 0.0013;
    const flLfo = ctx.createOscillator(); flLfo.frequency.value = 6.2;
    const flAmt = ctx.createGain(); flAmt.gain.value = 0.00012;
    wowLfo.connect(wowAmt); wowAmt.connect(wowDelay.delayTime);
    flLfo.connect(flAmt); flAmt.connect(wowDelay.delayTime);
    wowLfo.start(); flLfo.start();
    focusFilter = ctx.createBiquadFilter(); focusFilter.type = "lowpass"; focusFilter.frequency.value = 18000; focusFilter.Q.value = 0.6;
    duckGain = ctx.createGain(); duckGain.gain.value = 1;
    musicBus.connect(wowDelay); wowDelay.connect(focusFilter); focusFilter.connect(duckGain); duckGain.connect(sat);

    // reverb
    const reverb = ctx.createConvolver(); reverb.buffer = makeIR(2.4);
    const revOut = ctx.createGain(); revOut.gain.value = 0.32;
    const revHP = ctx.createBiquadFilter(); revHP.type = "highpass"; revHP.frequency.value = 350;
    reverbSend = ctx.createGain(); reverbSend.connect(revHP); revHP.connect(reverb); reverb.connect(revOut); revOut.connect(musicBus);

    // tape echo (dotted eighth)
    const delay = ctx.createDelay(2); delay.delayTime.value = SPB * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.36;
    const dLP = ctx.createBiquadFilter(); dLP.type = "lowpass"; dLP.frequency.value = 2600;
    const dOut = ctx.createGain(); dOut.gain.value = 0.42;
    delaySend = ctx.createGain(); delaySend.connect(delay);
    delay.connect(dLP); dLP.connect(fb); fb.connect(delay); dLP.connect(dOut); dOut.connect(musicBus);

    // sound effects skip the music's filters
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    document.addEventListener("visibilitychange", () => {
      if (!ctx) return;
      if (document.hidden) { ctx.suspend(); if (fileEl && playing) fileEl.pause(); }
      else { ctx.resume(); if (fileEl && playing) { const p = fileEl.play(); if (p && p.catch) p.catch(() => {}); } }
    });
    return true;
  }

  /* ---------- building blocks ---------- */
  function env(g, t, peak, a, d, sustain, rel, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * sustain, t + a, d);
    if (end != null) { g.gain.setTargetAtTime(0.0001, end, rel); }
  }
  function noise(t, dur, dest) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    s.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    return s;
  }

  /* ---------- instruments ---------- */
  function kick(t, vel) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(44, t + 0.13);
    g.gain.setValueAtTime(0.8 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.45);
  }
  function snare(t, vel) {
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    noise(t, 0.25, bp); bp.connect(g); g.connect(musicBus);
    const rs = ctx.createGain(); rs.gain.value = 0.7; g.connect(rs); rs.connect(reverbSend);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "triangle"; o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    og.gain.setValueAtTime(0.28 * vel, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(og); og.connect(musicBus); o.start(t); o.stop(t + 0.12);
  }
  function hat(t, open, vel) {
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7200;
    const g = ctx.createGain(), len = open ? 0.3 : 0.05;
    g.gain.setValueAtTime(0.17 * vel, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    noise(t, len, hp); hp.connect(g); g.connect(musicBus);
  }
  function bass(t, midi, dur) {
    const f = mtof(midi), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = "lowpass"; lp.Q.value = 6;
    lp.frequency.setValueAtTime(160, t); lp.frequency.exponentialRampToValueAtTime(950, t + 0.03);
    lp.frequency.exponentialRampToValueAtTime(260, t + Math.min(dur, 0.35));
    env(g, t, 0.15, 0.008, 0.12, 0.7, 0.05, t + dur);
    [["sawtooth", 0], ["square", -12]].forEach(([type, oct]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * Math.pow(2, oct / 12);
      const og = ctx.createGain(); og.gain.value = oct ? 0.5 : 1;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.3);
    });
    lp.connect(g); g.connect(musicBus);
  }
  function pad(t, notes, dur) {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1400; lp.Q.value = 0.8;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 220;
    const g = ctx.createGain(); env(g, t, 0.09, 0.9, 1.2, 0.85, 0.5, t + dur);
    lp.connect(hp); hp.connect(g); g.connect(musicBus);
    const rs = ctx.createGain(); rs.gain.value = 0.6; g.connect(rs); rs.connect(reverbSend);
    notes.forEach(m => [-8, 8].forEach(cents => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = mtof(m); o.detune.value = cents;
      const og = ctx.createGain(); og.gain.value = 0.16;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 2.5);
    }));
  }
  function arp(t, midi, vel) {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.17 * vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    [["triangle", 1], ["square", 0.28]].forEach(([type, lvl]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(midi);
      const og = ctx.createGain(); og.gain.value = lvl; o.connect(og); og.connect(lp); o.start(t); o.stop(t + 0.3);
    });
    lp.connect(g); g.connect(musicBus);
    const ds = ctx.createGain(); ds.gain.value = 0.55; g.connect(ds); ds.connect(delaySend);
  }
  function lead(t, midi, dur) {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2300; lp.Q.value = 1.2;
    const g = ctx.createGain(); env(g, t, 0.12, 0.03, 0.3, 0.8, 0.12, t + dur);
    const vib = ctx.createOscillator(); vib.frequency.value = 5.4;
    const vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(14, t + Math.min(0.5, dur));
    vib.connect(vg);
    [["square", -5], ["sawtooth", 5]].forEach(([type, c]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(midi); o.detune.value = c;
      vg.connect(o.detune);
      o.connect(lp); o.start(t); o.stop(t + dur + 0.8);
    });
    vib.start(t); vib.stop(t + dur + 0.8);
    lp.connect(g); g.connect(musicBus);
    const ds = ctx.createGain(); ds.gain.value = 0.3; g.connect(ds); ds.connect(delaySend);
    const rs = ctx.createGain(); rs.gain.value = 0.35; g.connect(rs); rs.connect(reverbSend);
  }

  /* ---------- sequencer ---------- */
  const ARP_SHAPE = [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 1, 2, 3, 2, 1, 0];
  function playStep(stepIndex, t) {
    const rawBar = Math.floor(stepIndex / 16), s = stepIndex % 16;
    const span = SONG.length - SONG.loopFrom;
    const bar = rawBar < SONG.length ? rawBar : SONG.loopFrom + ((rawBar - SONG.length) % span);
    const ch = SONG.chords[bar % SONG.chords.length];

    if (s === 0 && inSection("pad", bar)) pad(t, ch.pad, SPB * 4 + 0.1);
    if (inSection("bass", bar)) {
      if (bar < 4) { if (s === 0) bass(t, ch.bass, SPB * 3.8); }
      else if (s % 2 === 0) bass(t, ch.bass + (s === 6 || s === 14 ? 12 : 0), S16 * 1.7);
    }
    if (inSection("bassHold", bar) && s === 0) bass(t, ch.bass, SPB * 3.8);
    if (inSection("kick", bar) && (s === 0 || s === 8 || (s === 10 && bar % 2 === 1))) kick(t, s === 10 ? 0.7 : 1);
    if (inSection("kickHalf", bar) && s === 0) kick(t, 0.8);
    if (inSection("snare", bar)) {
      if (s === 4 || s === 12) snare(t, 1);
      if ((bar === 15 || bar === 23) && s >= 13) snare(t, 0.35 + (s - 13) * 0.2);
    }
    if (inSection("hats", bar) && s % 2 === 0) {
      const open = bar >= 16 && (s === 6 || s === 14);
      hat(t, open, s % 4 === 2 ? 1 : 0.6);
    }
    if (inSection("arp", bar)) {
      const half = bar >= 24;
      if (!half || s % 2 === 0) arp(t, ch.arp[ARP_SHAPE[s]] + (bar % 8 >= 4 && s % 4 === 3 ? 12 : 0), s % 4 === 0 ? 1 : 0.7);
    }
    if (inSection("lead", bar) && s % 2 === 0) {
      const phrase = SONG.melody[(bar - 16) % SONG.melody.length] || [];
      phrase.forEach(([m, beat, len]) => { if (Math.round(beat * 4) === s) lead(t, m, len * SPB); });
    }
  }
  function scheduler() {
    while (nextTime < ctx.currentTime + 0.14) {
      playStep(step, nextTime);
      nextTime += S16; step++;
    }
  }

  // Tape hiss runs from the title screen onward: louder on the title
  // screen, quieter under the music on the map.
  function setHiss(level) {
    if (!ctx) return;
    if (!hissSrc) {
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4800;
      hissGain = ctx.createGain(); hissGain.gain.value = 0.0001;
      hissSrc = ctx.createBufferSource(); hissSrc.buffer = noiseBuf; hissSrc.loop = true;
      hissSrc.connect(hp); hp.connect(hissGain); hissGain.connect(duckGain);
      hissSrc.start();
    }
    hissGain.gain.setTargetAtTime(Math.max(0.0001, level), ctx.currentTime, 0.6);
  }
  function intro() {
    if (!init()) return;
    setHiss(playing ? HISS_MAP : HISS_INTRO);
  }

  /* ---------- your own soundtrack file (settings.music.file) ---------- */
  let fileEl = null, fileLevel = 0, fileTarget = 0, fileRaf = 0, focusOn = false, duckOn = false;
  function fileGoal() { return playing ? (muted ? 0 : volume) * (duckOn ? 0.05 : 1) * (focusOn ? 0.6 : 1) : 0; }
  function fadeFile() {
    fileTarget = fileGoal();
    cancelAnimationFrame(fileRaf);
    const stepFade = () => {
      fileLevel += (fileTarget - fileLevel) * 0.12;
      if (Math.abs(fileTarget - fileLevel) < 0.004) fileLevel = fileTarget;
      if (fileEl) fileEl.volume = Math.max(0, Math.min(1, fileLevel));
      if (fileLevel !== fileTarget) fileRaf = requestAnimationFrame(stepFade);
      else if (!playing && fileEl) fileEl.pause();
    };
    stepFade();
  }
  function startFile() {
    if (!fileEl) {
      fileEl = new Audio(SETTINGS.file);
      fileEl.loop = SETTINGS.loop !== false;
      fileEl.preload = "auto";
      fileEl.addEventListener("error", () => console.warn("[history of the edit] Couldn't play the soundtrack file " + SETTINGS.file + ". Check the name and that it's in the audio folder."));
    }
    fileEl.currentTime = 0;
    fileEl.volume = 0; fileLevel = 0;
    const p = fileEl.play(); if (p && p.catch) p.catch(() => {});
    fadeFile();
  }

  /* ---------- your own sound effect files (sounds in data.js) ---------- */
  function playFileSfx(name) {
    const src = SOUNDS[name];
    if (!src) return false;
    if (!muted) {
      const a = new Audio(src); a.volume = Math.min(1, volume);
      const p = a.play(); if (p && p.catch) p.catch(() => {});
    }
    return true;
  }

  /* ---------- public controls ---------- */
  function startMusic(delay) {
    if (!init() || playing) return;
    playing = true; step = 0;
    setHiss(HISS_MAP);
    if (SETTINGS.file) { startFile(); return; }
    nextTime = ctx.currentTime + (delay || 0.05);
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.6);
    focusFilter.frequency.setTargetAtTime(18000, ctx.currentTime, 0.1);
    duckGain.gain.setTargetAtTime(1, ctx.currentTime, 0.1);
    clearInterval(timer); timer = setInterval(scheduler, 25); scheduler();
  }
  function stopMusic() {
    if (!ctx || !playing) return;
    playing = false;
    setHiss(HISS_INTRO);
    if (SETTINGS.file) { fadeFile(); return; }
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
    const t = timer; setTimeout(() => { if (!playing) clearInterval(t); }, 1200);
  }
  function setFocus(on) {
    focusOn = !!on; if (fileEl) fadeFile();
    if (!ctx) return;
    focusFilter.frequency.setTargetAtTime(on ? 2400 : 18000, ctx.currentTime, 0.3);
  }
  function duck(on) {
    duckOn = !!on; if (fileEl) fadeFile();
    if (!ctx) return;
    duckGain.gain.setTargetAtTime(on ? 0.05 : 1, ctx.currentTime, 0.2);
  }
  function setMuted(m) {
    muted = !!m;
    try { localStorage.setItem("hote-muted", muted ? "1" : "0"); } catch (e) {}
    if (ctx) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.08);
    if (fileEl) fadeFile();
  }

  /* ---------- sound effects ---------- */
  function click(t, freq, lvl) {
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(lvl, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    noise(t, 0.04, hp); hp.connect(g); g.connect(sfxBus);
  }
  function blip(t, midi, lvl, len) {
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3600;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(lvl, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + len);
    [["square", 1, 0], ["triangle", 0.5, 12]].forEach(([type, l, oct]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(midi + oct);
      const og = ctx.createGain(); og.gain.value = l; o.connect(og); og.connect(lp); o.start(t); o.stop(t + len + 0.05);
    });
    lp.connect(g); g.connect(sfxBus);
    const ds = ctx.createGain(); ds.gain.value = 0.25; g.connect(ds); ds.connect(delaySend);
  }
  const PENT = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

  const sfx = {
    // VCR: the deck clunks shut, the motor spins up, the heads engage
    play() {
      if (playFileSfx("play") || !init()) return; const t = ctx.currentTime + 0.01;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      g.gain.setValueAtTime(0.75, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.3);
      click(t, 2400, 0.4);
      const m = ctx.createOscillator(), ml = ctx.createBiquadFilter(), mg = ctx.createGain();
      m.type = "sawtooth"; m.frequency.setValueAtTime(48, t + 0.12); m.frequency.exponentialRampToValueAtTime(160, t + 0.75);
      ml.type = "lowpass"; ml.frequency.value = 650;
      mg.gain.setValueAtTime(0.0001, t + 0.12); mg.gain.linearRampToValueAtTime(0.12, t + 0.3); mg.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
      m.connect(ml); ml.connect(mg); mg.connect(sfxBus); m.start(t + 0.12); m.stop(t + 1);
      click(t + 0.62, 3200, 0.28);
      click(t + 0.7, 3600, 0.16);
    },
    // Opening a clip: a tape-counter click and a note. Earlier clips play
    // lower notes and later ones higher, so the history rises as you go.
    clip(frac) {
      if (playFileSfx("clip") || !init()) return; const t = ctx.currentTime + 0.01;
      const i = Math.max(0, Math.min(PENT.length - 1, Math.round((frac || 0) * (PENT.length - 1))));
      click(t, 4200, 0.22);
      blip(t, PENT[i] + 12, 0.12, 0.2);
      blip(t + 0.075, PENT[Math.min(PENT.length - 1, i + 2)] + 12, 0.07, 0.22);
    },
    close() {
      if (playFileSfx("close") || !init()) return; const t = ctx.currentTime + 0.01;
      click(t, 4200, 0.16);
      blip(t, 76, 0.08, 0.16); blip(t + 0.07, 69, 0.06, 0.2);
    },
    // Rewind: a high whine sweeping down, fluttering like a tape at speed
    rewind() {
      if (playFileSfx("rewind") || !init()) return; const t = ctx.currentTime + 0.01;
      const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(240, t + 0.6);
      lp.type = "lowpass"; lp.frequency.value = 2600;
      const trem = ctx.createOscillator(), tg = ctx.createGain(); trem.frequency.value = 23; tg.gain.value = 0.035;
      trem.connect(tg); tg.connect(g.gain);
      g.gain.setValueAtTime(0.05, t); g.gain.setTargetAtTime(0.0001, t + 0.5, 0.06);
      o.connect(lp); lp.connect(g); g.connect(sfxBus);
      o.start(t); o.stop(t + 0.75); trem.start(t); trem.stop(t + 0.75);
      click(t + 0.66, 2800, 0.3);
    },
    // Inserting a tape into the panel's monitor
    insert() {
      if (playFileSfx("insert") || !init()) return; const t = ctx.currentTime + 0.01;
      click(t, 1800, 0.3); click(t + 0.09, 2600, 0.22);
      blip(t + 0.14, 81, 0.05, 0.12);
    }
  };

  // _debug is only used for testing the mix offline; safe to ignore.
  const _debug = {
    ctx: () => ctx,
    hiss: () => (hissGain ? hissGain.gain.value : 0),
    file: () => fileEl,
    scheduleUntil(t) { while (nextTime < t) { playStep(step, nextTime); nextTime += S16; step++; } }
  };
  window.EditAudio = { init, intro, running: () => !!ctx && ctx.state === "running", startMusic, stopMusic, setFocus, duck, setMuted, isMuted: () => muted, isPlaying: () => playing, sfx, _debug };
})();
