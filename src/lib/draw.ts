// Drawing for the basin, cabbage and 양념.
// The cabbage is drawn in "unit space": y = -1 is the leafy top, y = 1 is the stem.

import { SECRETS, type SecretKey } from "./secrets";

type Ctx = CanvasRenderingContext2D;

export function cabbagePath(c: Ctx) {
  c.beginPath();
  c.moveTo(0, 1.0);
  c.bezierCurveTo(0.35, 1.0, 0.55, 0.75, 0.6, 0.3);
  c.bezierCurveTo(0.66, -0.2, 0.62, -0.75, 0.38, -0.95);
  c.bezierCurveTo(0.25, -1.06, 0.12, -0.9, 0, -1.0);
  c.bezierCurveTo(-0.12, -0.9, -0.25, -1.06, -0.38, -0.95);
  c.bezierCurveTo(-0.62, -0.75, -0.66, -0.2, -0.6, 0.3);
  c.bezierCurveTo(-0.55, 0.75, -0.35, 1.0, 0, 1.0);
  c.closePath();
}

// where the cabbage sits inside a square scene of size S
export function cabbageSpot(S: number) {
  return { cx: S / 2, cy: S * 0.52, s: S * 0.4 };
}

export function drawCabbage(c: Ctx, S: number) {
  const { cx, cy, s } = cabbageSpot(S);
  c.save();
  c.translate(cx, cy);
  c.scale(s, s);

  // nested leaf layers, outer -> inner core
  for (let i = 0; i < 5; i++) {
    const kx = 1 - i * 0.18;
    const ky = 1 - i * 0.1;
    c.save();
    c.translate(0, 1);
    c.scale(kx, ky);
    c.translate(0, -1);

    const g = c.createLinearGradient(0, -1, 0, 1);
    g.addColorStop(0, i < 3 ? "#79a84a" : "#a9c561");
    g.addColorStop(0.32, i < 3 ? "#b6d07e" : "#e3e48f");
    g.addColorStop(0.5, i === 4 ? "#f3e7a0" : "#eef2d4");
    g.addColorStop(1, "#fbfbf1");

    cabbagePath(c);
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 0.012 / kx;
    c.strokeStyle = "#9bb878";
    c.stroke();
    c.restore();
  }

  // white ribs
  c.strokeStyle = "rgba(255,255,255,0.8)";
  c.lineWidth = 0.025;
  c.lineCap = "round";
  for (const x of [-0.42, -0.25, 0.25, 0.42]) {
    c.beginPath();
    c.moveTo(x * 0.3, 0.95);
    c.quadraticCurveTo(x * 0.9, 0.2, x, -0.6);
    c.stroke();
  }
  c.restore();
}

// red rubber basin (고무대야) seen from above, with a vinyl sheet inside
export function drawBasin(c: Ctx, S: number) {
  c.fillStyle = "rgba(31,51,38,0.12)";
  c.beginPath();
  c.ellipse(S / 2, S / 2 + S * 0.02, S * 0.49, S * 0.49, 0, 0, Math.PI * 2);
  c.fill();

  const rim = c.createRadialGradient(S * 0.4, S * 0.35, S * 0.1, S / 2, S / 2, S * 0.5);
  rim.addColorStop(0, "#e2513e");
  rim.addColorStop(1, "#a8291b");
  c.fillStyle = rim;
  c.beginPath();
  c.arc(S / 2, S / 2, S * 0.48, 0, Math.PI * 2);
  c.fill();

  const vinyl = c.createRadialGradient(S * 0.45, S * 0.42, S * 0.05, S / 2, S / 2, S * 0.44);
  vinyl.addColorStop(0, "#ffffff");
  vinyl.addColorStop(1, "#e9ece6");
  c.fillStyle = vinyl;
  c.beginPath();
  c.arc(S / 2, S / 2, S * 0.43, 0, Math.PI * 2);
  c.fill();
}

// small pile of the picked ingredient next to the cabbage
function drawSecret(c: Ctx, S: number, key: SecretKey) {
  const pts = [
    [0.76, 0.7],
    [0.79, 0.74],
    [0.73, 0.75],
    [0.77, 0.79],
    [0.72, 0.7],
  ];
  c.fillStyle = SECRETS[key].color;
  for (const [x, y] of pts) {
    c.beginPath();
    c.ellipse(x * S, y * S, S * 0.025, S * 0.018, x * 9, 0, Math.PI * 2);
    c.fill();
  }
}

export function drawScene(c: Ctx, S: number, paint: HTMLCanvasElement, secret: SecretKey | null) {
  c.clearRect(0, 0, S, S);
  drawBasin(c, S);
  drawCabbage(c, S);
  if (secret) drawSecret(c, S, secret);

  // multiply so the 양념 tints the leaves instead of covering them
  c.save();
  c.globalCompositeOperation = "multiply";
  c.drawImage(paint, 0, 0, S, S);
  c.restore();
}

// one smear of 양념: soft red blob + a few chili flakes
export function dab(c: Ctx, x: number, y: number) {
  const g = c.createRadialGradient(x, y, 2, x, y, 30);
  g.addColorStop(0, "rgba(196,48,26,0.85)");
  g.addColorStop(0.7, "rgba(196,48,26,0.55)");
  g.addColorStop(1, "rgba(196,48,26,0)");
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, 30, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = "rgba(122,22,10,0.8)";
  for (let i = 0; i < 3; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 22;
    c.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 2.5, 1.5);
  }
}
