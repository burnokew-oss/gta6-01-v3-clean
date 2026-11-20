// input.js — keyboard dan mouse: gerak, kemudi, tembak, interaksi, ganti
// senjata, peta, pause. Keadaan dibaca per-frame oleh modul lain.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseDown = false;
    this.mouseX = 0; this.mouseY = 0;
    this.canvas = canvas;
    addEventListener("keydown", (e) => {
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (["ArrowUp", "ArrowDown", "Space"].includes(e.code)) e.preventDefault();
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => { this.keys.clear(); this.mouseDown = false; });
    canvas.addEventListener("mousedown", (e) => { if (e.button === 0) this.mouseDown = true; });
    addEventListener("mouseup", (e) => { if (e.button === 0) this.mouseDown = false; });
    canvas.addEventListener("mousemove", (e) => { this.mouseX = e.clientX; this.mouseY = e.clientY; });
  }
  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  justPressed(...codes) { return codes.some((c) => this.pressed.has(c)); }
  axis() {
    return {
      x: (this.down("KeyD", "ArrowRight") ? 1 : 0) - (this.down("KeyA", "ArrowLeft") ? 1 : 0),
      y: (this.down("KeyS", "ArrowDown") ? 1 : 0) - (this.down("KeyW", "ArrowUp") ? 1 : 0),
    };
  }
  endFrame() { this.pressed.clear(); }
}
