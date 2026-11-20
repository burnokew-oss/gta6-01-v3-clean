// random.js — RNG deterministik mulberry32 agar dunia dan screenshot
// reprodusibel dari seed yang sama di setiap run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngRange(rng, min, max) { return min + rng() * (max - min); }
export function rngInt(rng, min, max) { return Math.floor(rngRange(rng, min, max + 1)); }
export function rngPick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }
export function rngChance(rng, p) { return rng() < p; }
