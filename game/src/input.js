// Teluk Cerah — masukan keyboard dan mouse.
// Membaca dokumen halaman sekali di awal, lalu modul lain cukup memeriksa
// objek keys / mouse, atau memanggil takePressed untuk aksi sekali tekan.

export function createInput(doc) {
  const keys = {};
  const mouse = { x: 0, y: 0, down: false, dx: 0, dy: 0, wheel: 0 };
  // Tekanan yang belum dikonsumsi, beserta waktu terjadinya (milidetik).
  // Entri kedaluwarsa setelah 1,5 detik supaya tekanan lama yang tidak pernah
  // dibaca tidak tiba-tiba terpicu di tempat yang salah.
  const freshPresses = new Map();
  const PRESS_TTL_MS = 1500;

  const PREVENT_DEFAULT = new Set([
    'Space',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Tab',
  ]);

  function notePress(code) {
    freshPresses.set(code, Date.now());
  }

  function isFormTarget(event) {
    // Saat fokus berada di kolom isian, biarkan browser yang menangani
    // tombol; game tidak boleh ikut bereaksi terhadap ketikan itu.
    const target = event.target;
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = (target.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  }

  function onKeyDown(event) {
    if (isFormTarget(event)) return;
    if (!event.repeat) notePress(event.code);
    keys[event.code] = true;
    if (PREVENT_DEFAULT.has(event.code)) event.preventDefault();
  }

  function onKeyUp(event) {
    if (isFormTarget(event)) return;
    keys[event.code] = false;
  }

  function onMouseMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.dx += event.movementX || 0;
    mouse.dy += event.movementY || 0;
  }

  function onMouseDown(event) {
    if (event.button === 0) {
      mouse.down = true;
      notePress('Mouse0');
    } else if (event.button === 2) {
      notePress('Mouse2');
    }
  }

  function onMouseUp(event) {
    if (event.button === 0) mouse.down = false;
  }

  function onWheel(event) {
    mouse.wheel += event.deltaY || 0;
  }

  function onBlur() {
    // Kehilangan fokus membebaskan semua tombol supaya tidak ada tombol
    // yang "macet" menyala saat pemain kembali ke jendela.
    for (const code of Object.keys(keys)) keys[code] = false;
    mouse.down = false;
    freshPresses.clear();
  }

  function onContextMenu(event) {
    // Klik kanan dipakai untuk membidik; jangan munculkan menu browser.
    event.preventDefault();
  }

  doc.addEventListener('keydown', onKeyDown);
  doc.addEventListener('keyup', onKeyUp);
  doc.addEventListener('mousemove', onMouseMove);
  doc.addEventListener('mousedown', onMouseDown);
  doc.addEventListener('mouseup', onMouseUp);
  doc.addEventListener('wheel', onWheel, { passive: true });
  doc.addEventListener('contextmenu', onContextMenu);
  if (doc.defaultView) doc.defaultView.addEventListener('blur', onBlur);

  function takePressed(name) {
    // Benar tepat satu kali untuk tiap penekanan fisik yang masih segar.
    const at = freshPresses.get(name);
    if (at === undefined) return false;
    freshPresses.delete(name);
    if (Date.now() - at > PRESS_TTL_MS) return false;
    return true;
  }

  function takeMouseDelta() {
    // Pergerakan mouse sejak pemanggilan terakhir, lalu penghitung direset.
    const delta = { dx: mouse.dx, dy: mouse.dy };
    mouse.dx = 0;
    mouse.dy = 0;
    return delta;
  }

  function clearPressed() {
    freshPresses.clear();
  }

  return { keys, mouse, takePressed, takeMouseDelta, clearPressed };
}
