// Teluk Cerah — pembangkit angka acak ber-seed.
// Satu seed yang sama selalu menghasilkan urutan angka yang sama, sehingga
// kota yang dibangun prosedural selalu identik di setiap sesi.

export function makeRng(seed) {
  // Keadaan internal 32-bit; seed nol diganti konstanta supaya tidak macet.
  let state = (seed >>> 0) || 0x9e3779b9;

  function next() {
    // Putar keadaan dengan konstanta ganjil, lalu acak bit-bitnya dengan
    // perkalian dan xor-shift sampai merata; hasilnya 0 <= n < 1.
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  }

  function range(low, high) {
    // Angka di antara batas bawah dan batas atas (batas atas tidak tercapai).
    return low + (high - low) * next();
  }

  function int(low, high) {
    // Bilangan bulat dari low sampai high, keduanya bisa muncul.
    return Math.floor(range(low, high + 1));
  }

  function pick(list) {
    // Satu elemen acak dari daftar; daftar kosong menghasilkan undefined.
    if (!list || list.length === 0) return undefined;
    return list[Math.floor(next() * list.length)];
  }

  function chance(probability) {
    // Benar dengan peluang sebesar probability (0 sampai 1).
    return next() < probability;
  }

  function shuffle(list) {
    // Salinan daftar dengan urutan teracak (Fisher-Yates); daftar asli utuh.
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function fork() {
    // Turunan independen dari generator ini, berguna untuk sub-sistem.
    return makeRng(Math.floor(next() * 4294967296));
  }

  return { next, range, int, pick, chance, shuffle, fork };
}
