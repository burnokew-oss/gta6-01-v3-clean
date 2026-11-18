// RNG ber-seed (mulberry32) — kota, traffic, dan scene screenshot
// selalu sama untuk seed yang sama.
//
// Satu-satunya state adalah integer `a` yang dimajukan tiap pemanggilan.
// Urutan pemanggilan tidak boleh berubah sembarangan: layout kota dan
// komposisi scene deterministik diturunkan dari urutan itu.
const INCREMENT = 0x6d2b79f5;
const MIXER = 61;
const UINT32_RANGE = 4294967296;

export function createRandom(seed) {
  let a = seed >>> 0;

  // Majukan state satu langkah, kembalikan word 32-bit mentah.
  function advance() {
    a |= 0;
    a = (a + INCREMENT) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), MIXER | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  // Float di [0, 1).
  function next() {
    return advance() / UINT32_RANGE;
  }

  // Float di [min, max).
  function range(min, max) {
    return min + next() * (max - min);
  }

  // Integer di [min, max], kedua ujung inklusif.
  function int(min, max) {
    return Math.floor(range(min, max + 1));
  }

  // Satu elemen acak dari daftar.
  function pick(list) {
    return list[Math.floor(next() * list.length)];
  }

  // True dengan peluang p.
  function chance(p) {
    return next() < p;
  }

  return { next, range, int, pick, chance };
}
