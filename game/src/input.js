// Teluk Cerah — keyboard and mouse input. Tracks held keys, one-shot
// presses, and a drag-look offset so the camera can be orbited by mouse.

export function createInput() {
  const held = new Set();
  const pressed = new Set();
  let lookDX = 0, lookDY = 0, dragging = false, lastX = 0, lastY = 0, firing = false;

  window.addEventListener("keydown", (e) => {
    if (!e.repeat) pressed.add(e.code);
    held.add(e.code);
    if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => held.delete(e.code));
  window.addEventListener("blur", () => { held.clear(); firing = false; });
  window.addEventListener("mousedown", (e) => {
    if (e.button === 0) { firing = true; dragging = true; lastX = e.clientX; lastY = e.clientY; }
  });
  window.addEventListener("mouseup", (e) => { if (e.button === 0) { firing = false; dragging = false; } });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    lookDX += e.clientX - lastX; lookDY += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
  });

  return {
    down: (code) => held.has(code),
    hit: (code) => { const was = pressed.has(code); pressed.delete(code); return was; },
    get firing() { return firing; },
    consumeLook() { const d = { x: lookDX, y: lookDY }; lookDX = 0; lookDY = 0; return d; },
    endFrame() { pressed.clear(); },
    forward: () => held.has("KeyW") || held.has("ArrowUp"),
    back: () => held.has("KeyS") || held.has("ArrowDown"),
    left: () => held.has("KeyA") || held.has("ArrowLeft"),
    right: () => held.has("KeyD") || held.has("ArrowRight"),
  };
}
