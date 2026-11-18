// Semua suara disintesis WebAudio — tanpa file audio sama sekali.
// AudioContext dibuat malas (setelah interaksi pertama) supaya tidak
// diblokir browser. Radio: 3 stasiun (lihat radio.js), masing-masing
// pola nada + gelombang sendiri, diputar sebagai melodi synth.
import { RADIO_STATIONS, stationAt, nextStationIndex } from './radio.js';

export function createAudio() {
  const MASTER = 0.5;
  let ctx = null;
  let master = null;
  let muted = false;
  let musicTimer = null;
  let noteIndex = 0;
  let stationIndex = 0;
  let engine = null; // {osc, gain}
  let siren = null;
  let rotor = null;
  let rotorChop = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER;
      master.connect(ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  // Satu nada oscillator dengan envelope turun.
  function tone(freq, dur, type, vol) {
    if (!ensure() || muted) return;
    try {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g);
      g.connect(master);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch { /* suara opsional */ }
  }

  // Satu semburan noise putih (memudar) lewat lowpass filter.
  function burst(dur, vol, filterFreq) {
    if (!ensure() || muted) return;
    try {
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq || 1200;
      const g = ctx.createGain();
      g.gain.value = vol || 0.3;
      src.connect(f);
      f.connect(g);
      g.connect(master);
      src.start();
    } catch { /* suara opsional */ }
  }

  // Oscillator looping (mesin/sirene/rotor): dibuat sekali, lalu hanya
  // frekuensi/gain-nya yang diubah tiap frame.
  function startLoop(type, freq, gainValue) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    return { osc, gain };
  }

  function stopLoop(loop) {
    if (!loop) return;
    try { loop.osc.stop(); loop.osc.disconnect(); } catch { /* abaikan */ }
  }

  function restartMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (!ensure()) return;
    const st = stationAt(stationIndex);
    musicTimer = setInterval(() => {
      if (muted) return;
      const cur = stationAt(stationIndex);
      const f = cur.notes[noteIndex % cur.notes.length];
      noteIndex += 1;
      if (f) tone(f, (cur.stepMs / 1000) * 0.9, cur.wave, cur.vol);
      if (noteIndex % 4 === 0) burst(0.03, 0.05, 6000);
    }, st.stepMs);
  }

  return {
    unlock() {
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    setMuted(m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : MASTER;
    },
    isMuted() { return muted; },
    shoot() { burst(0.12, 0.35, 2500); },
    punch() { burst(0.08, 0.3, 500); tone(90, 0.1, 'sine', 0.25); },
    pickup() { tone(660, 0.08, 'sine', 0.2); tone(990, 0.12, 'sine', 0.2); },
    crash() { burst(0.3, 0.4, 700); },
    explosion() { burst(0.7, 0.5, 400); tone(50, 0.5, 'sine', 0.4); },
    missionDone() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.22), i * 110));
    },
    wantedUp() { tone(220, 0.15, 'sawtooth', 0.2); tone(165, 0.2, 'sawtooth', 0.2); },
    startMusic() { if (!musicTimer) restartMusic(); },
    stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } },
    stationName() { return stationAt(stationIndex).name; },
    stationIndex() { return stationIndex; },
    trackTitle() { return stationAt(stationIndex).track.title; },
    trackArtist() { return stationAt(stationIndex).track.artist; },
    cycleStation() {
      stationIndex = nextStationIndex(stationIndex);
      noteIndex = 0;
      if (musicTimer) restartMusic();
      return stationAt(stationIndex).name;
    },
    // Rotor helikopter: dengung rendah yang dicacah berkala.
    rotor(on) {
      if (!ensure()) return;
      try {
        if (on && !muted) {
          if (!rotor) {
            rotor = startLoop('sawtooth', 46, 0.05);
            let loud = true;
            rotorChop = setInterval(() => {
              if (rotor) { loud = !loud; rotor.gain.gain.value = loud ? 0.05 : 0.017; }
            }, 90);
          }
        } else if (rotor) {
          if (rotorChop) { clearInterval(rotorChop); rotorChop = null; }
          stopLoop(rotor);
          rotor = null;
        }
      } catch { /* abaikan */ }
    },
    engine(on, speedRatio) {
      if (!ensure()) return;
      try {
        if (on && !muted) {
          if (!engine) engine = startLoop('sawtooth', 60, 0.03);
          engine.osc.frequency.value = 60 + speedRatio * 140;
          engine.gain.gain.value = 0.02 + speedRatio * 0.05;
        } else if (engine) {
          stopLoop(engine);
          engine = null;
        }
      } catch { /* abaikan */ }
    },
    siren(on) {
      if (!ensure()) return;
      try {
        if (on && !muted) {
          if (!siren) {
            siren = startLoop('sine', 660, 0.04);
            let hi = false;
            siren.timer = setInterval(() => {
              if (siren) { hi = !hi; siren.osc.frequency.value = hi ? 880 : 660; }
            }, 450);
          }
        } else if (siren) {
          clearInterval(siren.timer);
          stopLoop(siren);
          siren = null;
        }
      } catch { /* abaikan */ }
    },
  };
}
