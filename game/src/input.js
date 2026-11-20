// Masukan keyboard + mouse; takePressed memberi true sekali per tekanan fisik.
export function createInput(doc) {
  const keys = {};
  const pressedOnce = {};
  const mouse = { x: 0, y: 0, down: false, clicked: false };
  doc.addEventListener("keydown", (ev) => {
    if (!keys[ev.code]) pressedOnce[ev.code] = true;
    keys[ev.code] = true;
    if (["Space", "ArrowUp", "ArrowDown"].includes(ev.code)) ev.preventDefault();
  });
  doc.addEventListener("keyup", (ev) => { keys[ev.code] = false; });
  doc.addEventListener("mousemove", (ev) => { mouse.x = ev.clientX; mouse.y = ev.clientY; });
  doc.addEventListener("mousedown", (ev) => { if (ev.button === 0) { mouse.down = true; mouse.clicked = true; } });
  doc.addEventListener("mouseup", (ev) => { if (ev.button === 0) mouse.down = false; });
  doc.addEventListener("blur", () => { for (const k of Object.keys(keys)) keys[k] = false; mouse.down = false; });
  return {
    keys, mouse,
    takePressed(name) { const v = !!pressedOnce[name]; pressedOnce[name] = false; return v; },
    takeClick() { const v = mouse.clicked; mouse.clicked = false; return v; },
  };
}
