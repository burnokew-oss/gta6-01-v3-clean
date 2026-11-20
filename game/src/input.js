// input.js — keyboard dan mouse: gerak, kemudi, tembak, interaksi,
// ganti senjata, peta, pause. Mencegah scroll halaman dari tombol game.
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    window.addEventListener("keydown", (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("mousedown", (e) => { if (e.button === 0) this.mouseDown = true; });
    window.addEventListener("mouseup", (e) => { if (e.button === 0) this.mouseDown = false; });
    window.addEventListener("mousemove", (e) => { this.mouseX = e.clientX; this.mouseY = e.clientY; });
    window.addEventListener("blur", () => { this.keys.clear(); this.mouseDown = false; });
  }
  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  tapped(...codes) { return codes.some((c) => this.pressed.has(c)); }
  endFrame() { this.pressed.clear(); }
  get forward() { return this.down("KeyW", "ArrowUp"); }
  get back() { return this.down("KeyS", "ArrowDown"); }
  get left() { return this.down("KeyA", "ArrowLeft"); }
  get right() { return this.down("KeyD", "ArrowRight"); }
  get sprint() { return this.down("ShiftLeft", "ShiftRight"); }
  get firing() { return this.mouseDown || this.down("KeyF"); }
}
