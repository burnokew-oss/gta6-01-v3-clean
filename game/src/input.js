// Input keyboard + mouse.
//
// Tombol tahan dibaca lewat `keys` (up/down/left/right/run/brake).
// Aksi sekali-tekan dikumpulkan jadi bitmask dan dikonsumsi sekali per
// frame lewat takeActions(). Tombol angka 1-9 (beli di toko) disimpan
// terpisah sebagai `digit` terakhir, supaya tidak bentrok dengan bitmask.
// Mouse: posisi kursor di atas canvas (untuk bidik) + tombol kiri ditekan.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const ACTION_STEAL = 8;
export const ACTION_RELOAD = 16;
export const ACTION_MUTE = 32;
export const ACTION_MAP = 64;
export const ACTION_TAXI = 128;
export const ACTION_RAMPAGE = 256;

const KEY_TO_ACTION = {
  Enter: ACTION_CONFIRM,
  Escape: ACTION_PAUSE,
  e: ACTION_ENTER, E: ACTION_ENTER,
  f: ACTION_STEAL, F: ACTION_STEAL,
  r: ACTION_RELOAD, R: ACTION_RELOAD,
  n: ACTION_MUTE, N: ACTION_MUTE,
  m: ACTION_MAP, M: ACTION_MAP,
  t: ACTION_TAXI, T: ACTION_TAXI,
  g: ACTION_RAMPAGE, G: ACTION_RAMPAGE,
};

export function createInput(canvas) {
  const keys = { up: false, down: false, left: false, right: false, run: false, brake: false };
  const mouse = { x: 640, y: 400, down: false };
  let queued = 0;
  let digit = 0;

  function onKeyDown(e) {
    const k = e.key;
    if (k === 'w' || k === 'W' || k === 'ArrowUp') keys.up = true;
    else if (k === 's' || k === 'S' || k === 'ArrowDown') keys.down = true;
    else if (k === 'a' || k === 'A' || k === 'ArrowLeft') keys.left = true;
    else if (k === 'd' || k === 'D' || k === 'ArrowRight') keys.right = true;
    else if (k === 'Shift') keys.run = true;
    else if (k === ' ') { keys.brake = true; e.preventDefault(); }
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') e.preventDefault();
    if (KEY_TO_ACTION[k] !== undefined && !e.repeat) queued |= KEY_TO_ACTION[k];
    if (k >= '1' && k <= '9') digit = k.charCodeAt(0) - 48;
  }

  function onKeyUp(e) {
    const k = e.key;
    if (k === 'w' || k === 'W' || k === 'ArrowUp') keys.up = false;
    else if (k === 's' || k === 'S' || k === 'ArrowDown') keys.down = false;
    else if (k === 'a' || k === 'A' || k === 'ArrowLeft') keys.left = false;
    else if (k === 'd' || k === 'D' || k === 'ArrowRight') keys.right = false;
    else if (k === 'Shift') keys.run = false;
    else if (k === ' ') keys.brake = false;
  }

  function onMouseMove(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', () => {
    for (const k in keys) keys[k] = false;
    mouse.down = false;
  });
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) mouse.down = true; });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    keys,
    mouse,
    axisX() { return (keys.right ? 1 : 0) - (keys.left ? 1 : 0); },
    axisY() { return (keys.down ? 1 : 0) - (keys.up ? 1 : 0); },
    // Ambil + kosongkan aksi sekali-tekan dan digit sejak frame lalu.
    takeActions() {
      const a = queued;
      const d = digit;
      queued = 0;
      digit = 0;
      return { actions: a, digit: d };
    },
  };
}
