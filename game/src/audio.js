// audio.js — semua suara Teluk Cerah disintesis WebAudio, tanpa file audio.
// Builder sistem, rebuild #3. Nama suara mengikuti spesifikasi: engine,
// siren, gunshot, punch, pickup, mission, radio. AudioContext dibuat malas
// (hanya setelah gestur pengguna) dan semua pemutaran dibungkus guard agar
// game tidak pernah crash karena audio.

const NOTE_FREQUENCIES = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
};

const RADIO_MELODIES = {
  pantai: {
    tempo: 96,
    bass: ['C3', 'G3', 'A3', 'F3'],
    lead: ['E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4', 'D4'],
  },
  neon: {
    tempo: 118,
    bass: ['C3', 'C3', 'F3', 'G3'],
    lead: ['C5', 'A4', 'G4', 'A4', 'C5', 'D5', 'C5', 'A4'],
  },
  suara: {
    tempo: 132,
    bass: ['G3', 'D3', 'G3', 'C3'],
    lead: ['G4', 'B4', 'D5', 'B4', 'G4', 'A4', 'B4', 'D5'],
  },
};

function ensureAudio(state) {
  if (!state.audio) {
    state.audio = {
      ctx: null,
      muted: Boolean(state.muted),
      master: null,
      engineNodes: null,
      sirenNodes: null,
      radioTimer: null,
      radioStation: null,
      radioTrack: null,
      radioStep: 0,
      unlocked: false,
    };
  }
  return state.audio;
}

function buildContext(audio) {
  if (audio.ctx) return audio.ctx;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = audio.muted ? 0 : 0.5;
    master.connect(ctx.destination);
    audio.ctx = ctx;
    audio.master = master;
    audio.unlocked = true;
    return ctx;
  } catch (err) {
    return null;
  }
}

function unlockOnGesture(audio) {
  if (audio.unlocked) return;
  const resume = () => {
    const ctx = buildContext(audio);
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    window.removeEventListener('pointerdown', resume);
    window.removeEventListener('keydown', resume);
    // Sekali terbuka, langsung hidupkan loop radio bila stasiun sudah dipilih.
    if (audio.radioStation && !audio.radioTimer && !audio.muted) {
      startRadioMusic({ audio }, audio);
    }
  };
  window.addEventListener('pointerdown', resume);
  window.addEventListener('keydown', resume);
}

function tone(ctx, master, options) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type || 'sine';
  osc.frequency.setValueAtTime(options.frequency, ctx.currentTime + (options.delay || 0));
  if (options.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(options.slideTo, ctx.currentTime + (options.delay || 0) + (options.duration || 0.2));
  }
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + (options.delay || 0));
  gain.gain.exponentialRampToValueAtTime(options.volume || 0.2, ctx.currentTime + (options.delay || 0) + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (options.delay || 0) + (options.duration || 0.2));
  osc.connect(gain);
  gain.connect(master);
  osc.start(ctx.currentTime + (options.delay || 0));
  osc.stop(ctx.currentTime + (options.delay || 0) + (options.duration || 0.2) + 0.05);
  return osc;
}

function noiseBurst(ctx, master, options) {
  const duration = options.duration || 0.15;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = options.filterType || 'lowpass';
  filter.frequency.value = options.filterFreq || 1200;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(options.volume || 0.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start();
}

function startEngine(state, audio) {
  const ctx = audio.ctx;
  if (!ctx || audio.engineNodes) return;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 55;
  const sub = ctx.createOscillator();
  sub.type = 'square';
  sub.frequency.value = 28;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  const gain = ctx.createGain();
  gain.gain.value = 0.0;
  osc.connect(filter);
  sub.connect(filter);
  filter.connect(gain);
  gain.connect(audio.master);
  osc.start();
  sub.start();
  audio.engineNodes = { osc, sub, filter, gain };
}

function updateEngineSound(state, audio) {
  if (!audio.engineNodes || !audio.ctx) return;
  const player = state.player || {};
  const speed = player.speedKmh || player.speed || 0;
  const inCar = Boolean(player.car || player.vehicle || player.inCar);
  const targetGain = inCar ? Math.min(0.16, 0.05 + speed / 900) : 0;
  const freq = 48 + Math.min(160, speed * 0.9);
  const now = audio.ctx.currentTime;
  audio.engineNodes.gain.gain.setTargetAtTime(targetGain, now, 0.1);
  audio.engineNodes.osc.frequency.setTargetAtTime(freq, now, 0.08);
  audio.engineNodes.sub.frequency.setTargetAtTime(freq / 2, now, 0.08);
  audio.engineNodes.filter.frequency.setTargetAtTime(320 + speed * 4, now, 0.1);
}

function startSiren(state, audio) {
  const ctx = audio.ctx;
  if (!ctx || audio.sirenNodes) return;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = 660;
  const gain = ctx.createGain();
  gain.gain.value = 0.0;
  osc.connect(gain);
  gain.connect(audio.master);
  osc.start();
  const lfo = ctx.createOscillator();
  lfo.type = 'square';
  lfo.frequency.value = 1.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 150;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start();
  audio.sirenNodes = { osc, lfo, gain };
}

function updateSirenSound(state, audio) {
  if (!audio.sirenNodes || !audio.ctx) return;
  const wanted = typeof state.wanted === 'number' ? state.wanted : 0;
  const nearPolice = Boolean(state.police && (state.police.nearby || state.police.count > 0));
  const audible = wanted >= 1 || nearPolice;
  const target = audible ? 0.05 : 0;
  audio.sirenNodes.gain.gain.setTargetAtTime(target, audio.ctx.currentTime, 0.3);
}

function scheduleRadioStep(state, audio) {
  const melody = RADIO_MELODIES[audio.radioStation] || RADIO_MELODIES.pantai;
  const step = audio.radioStep % 8;
  const beat = 60 / melody.tempo / 2;
  const ctx = audio.ctx;
  if (!ctx) return;
  const bassNote = melody.bass[step % melody.bass.length];
  const leadNote = melody.lead[step % melody.lead.length];
  tone(ctx, audio.master, {
    type: 'triangle',
    frequency: NOTE_FREQUENCIES[bassNote],
    duration: beat * 1.8,
    volume: 0.12,
  });
  tone(ctx, audio.master, {
    type: 'sine',
    frequency: NOTE_FREQUENCIES[leadNote],
    duration: beat * 0.9,
    volume: 0.07,
  });
  if (step % 2 === 0) {
    noiseBurst(ctx, audio.master, { duration: 0.03, filterType: 'highpass', filterFreq: 6000, volume: 0.03 });
  }
  audio.radioStep += 1;
  audio.radioTimer = window.setTimeout(() => scheduleRadioStep(state, audio), beat * 1000);
}

function startRadioMusic(state, audio) {
  if (!audio.ctx) return;
  if (audio.radioTimer) return;
  audio.radioStep = 0;
  scheduleRadioStep(state, audio);
}

function stopRadioMusic(audio) {
  if (audio.radioTimer) {
    window.clearTimeout(audio.radioTimer);
    audio.radioTimer = null;
  }
}

export function createAudio(state) {
  const audio = ensureAudio(state);
  audio.muted = Boolean(state.muted);
  unlockOnGesture(audio);
  return audio;
}

export function playSound(state, name) {
  const audio = ensureAudio(state);
  if (audio.muted) return;
  const ctx = buildContext(audio);
  if (!ctx || ctx.state !== 'running') {
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!ctx || ctx.state !== 'running') {
      if (name === 'radio') startRadioMusic(state, audio);
      return;
    }
  }
  try {
    switch (name) {
      case 'engine':
        startEngine(state, audio);
        updateEngineSound(state, audio);
        break;
      case 'siren':
        startSiren(state, audio);
        updateSirenSound(state, audio);
        break;
      case 'gunshot':
        noiseBurst(ctx, audio.master, { duration: 0.12, filterFreq: 2400, volume: 0.5 });
        tone(ctx, audio.master, { type: 'square', frequency: 180, slideTo: 55, duration: 0.12, volume: 0.25 });
        break;
      case 'punch':
        tone(ctx, audio.master, { type: 'sine', frequency: 140, slideTo: 60, duration: 0.12, volume: 0.35 });
        noiseBurst(ctx, audio.master, { duration: 0.07, filterFreq: 500, volume: 0.2 });
        break;
      case 'pickup':
        tone(ctx, audio.master, { type: 'sine', frequency: 660, duration: 0.09, volume: 0.18 });
        tone(ctx, audio.master, { type: 'sine', frequency: 990, duration: 0.14, volume: 0.18, delay: 0.08 });
        break;
      case 'mission': {
        const notes = ['C4', 'E4', 'G4', 'C5'];
        notes.forEach((note, index) => {
          tone(ctx, audio.master, {
            type: 'triangle',
            frequency: NOTE_FREQUENCIES[note],
            duration: 0.22,
            volume: 0.2,
            delay: index * 0.13,
          });
        });
        break;
      }
      case 'radio':
        startRadioMusic(state, audio);
        break;
      default:
        break;
    }
  } catch (err) {
    // Audio tidak boleh menggagalkan game.
  }
}

export function setMuted(state, muted) {
  const audio = ensureAudio(state);
  audio.muted = Boolean(muted);
  state.muted = audio.muted;
  if (audio.master && audio.ctx) {
    audio.master.gain.setTargetAtTime(audio.muted ? 0 : 0.5, audio.ctx.currentTime, 0.05);
  }
  if (audio.muted) stopRadioMusic(audio);
}

export function updateAudio(state, dt) {
  const audio = ensureAudio(state);
  if (!audio.ctx || audio.ctx.state !== 'running' || audio.muted) return;
  if (audio.radioStation && !audio.radioTimer) {
    startRadioMusic(state, audio);
  }
  if (!audio.radioStation && audio.radioTimer) {
    stopRadioMusic(audio);
  }
  // Mesin dan sirene dikelola dari sini agar tetap berbunyi walau loop utama
  // tidak pernah memanggil playSound('engine') / playSound('siren') langsung.
  const player = state.player || {};
  const inCar = Boolean(player.car || player.vehicle || player.inCar);
  if (inCar && !audio.engineNodes) startEngine(state, audio);
  const wanted = typeof state.wanted === 'number' ? state.wanted : 0;
  if (wanted >= 1 && !audio.sirenNodes) startSiren(state, audio);
  updateEngineSound(state, audio);
  updateSirenSound(state, audio);
}
