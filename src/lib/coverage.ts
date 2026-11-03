import { cabbagePath, cabbageSpot } from "./draw";

// Paint and scoring happen on a fixed 600x600 canvas,
// so the score is the same on a phone and on a laptop.
export const PAINT_SIZE = 600;
const STRIDE = 4; // check every 4th pixel, plenty accurate and way cheaper

// 1 = this sample point is on the cabbage
export function buildMask() {
  const m = document.createElement("canvas");
  m.width = m.height = PAINT_SIZE;
  const c = m.getContext("2d")!;
  const { cx, cy, s } = cabbageSpot(PAINT_SIZE);
  c.translate(cx, cy);
  c.scale(s, s);
  cabbagePath(c);
  c.fillStyle = "#000";
  c.fill();

  const data = c.getImageData(0, 0, PAINT_SIZE, PAINT_SIZE).data;
  const n = PAINT_SIZE / STRIDE;
  const mask = new Uint8Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      mask[y * n + x] = data[(y * STRIDE * PAINT_SIZE + x * STRIDE) * 4 + 3] > 128 ? 1 : 0;
    }
  }
  return mask;
}

// coverage = how much of the cabbage has 양념
// spill = how much of the 양념 landed in the basin instead
export function measure(paint: CanvasRenderingContext2D, mask: Uint8Array) {
  const data = paint.getImageData(0, 0, PAINT_SIZE, PAINT_SIZE).data;
  const n = PAINT_SIZE / STRIDE;
  let inside = 0;
  let covered = 0;
  let painted = 0;
  let outside = 0;

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const alpha = data[(y * STRIDE * PAINT_SIZE + x * STRIDE) * 4 + 3];
      const onCabbage = mask[y * n + x] === 1;
      if (onCabbage) inside++;
      if (alpha > 60) {
        painted++;
        if (onCabbage) covered++;
        else outside++;
      }
    }
  }

  return {
    coverage: inside ? covered / inside : 0,
    spill: painted ? outside / painted : 0,
  };
}
