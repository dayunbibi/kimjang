import { drawScene } from "./draw";
import { SECRETS, type SecretKey } from "./secrets";
import type { Verdict } from "./judge";

type CardInput = {
  verdict: Verdict;
  coverage: number;
  secret: SecretKey;
  paint: HTMLCanvasElement;
};

function wrapText(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, x, yy);
      line = w;
      yy += lineH;
    } else {
      line = test;
    }
  }
  c.fillText(line, x, yy);
}

// Google Fonts splits Korean fonts into small chunks and only downloads the ones
// the page actually shows. Text that only exists on the canvas never triggers a download,
// so document.fonts.ready isn't enough — load each font for the exact text first.
async function loadFontsFor(text: string) {
  const families = ['"Black Han Sans"', "Jua", '"Gowun Dodum"'];
  try {
    await Promise.all(families.map((f) => document.fonts.load(`40px ${f}`, text)));
  } catch {
    // worst case the card uses a fallback font, still fine
  }
}

// 1080x1920 (9:16) so it drops straight into an Instagram story
export async function makeResultImage({ verdict, coverage, secret, paint }: CardInput): Promise<Blob> {
  const s = SECRETS[secret];

  const stats = `양념 ${Math.round(coverage * 100)}% · 튄 양념 ${verdict.spillLabel}`;
  const secretLine = `비법 재료: ${s.name} (${s.type})`;
  await loadFontsFor(
    ["온라인 김장하기", "올해의 김장 김치", verdict.title, verdict.line, stats, secretLine, `${verdict.score}점`, "3주 뒤가 제일 맛있어요"].join(""),
  );

  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext("2d")!;

  // balcony tiles
  c.fillStyle = "#e7ece3";
  c.fillRect(0, 0, W, H);
  c.strokeStyle = "#dce3d6";
  c.lineWidth = 4;
  for (let x = 0; x < W; x += 135) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, H);
    c.stroke();
  }
  for (let y = 0; y < H; y += 135) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }

  c.fillStyle = "#cf3726";
  c.fillRect(0, 0, W, 120);
  c.textAlign = "center";
  c.fillStyle = "#ffffff";
  c.font = '52px "Black Han Sans", sans-serif';
  c.fillText("온라인 김장하기", W / 2, 80);

  c.fillStyle = "#5f6f60";
  c.font = "44px Jua, sans-serif";
  c.fillText("올해의 김장 김치", W / 2, 270);

  c.fillStyle = "#cf3726";
  c.font = '100px "Black Han Sans", sans-serif';
  wrapText(c, verdict.title, W / 2, 390, 960, 110);

  const scene = document.createElement("canvas");
  scene.width = scene.height = 820;
  drawScene(scene.getContext("2d")!, 820, paint, secret);
  c.drawImage(scene, (W - 820) / 2, 450);

  c.fillStyle = "#1f3326";
  c.font = '48px "Gowun Dodum", sans-serif';
  wrapText(c, verdict.line, W / 2, 1360, 900, 64);

  c.fillStyle = "#5f6f60";
  c.font = "42px Jua, sans-serif";
  c.fillText(stats, W / 2, 1480);
  c.fillText(secretLine, W / 2, 1550);

  c.fillStyle = "#cf3726";
  c.font = '140px "Black Han Sans", sans-serif';
  c.fillText(`${verdict.score}점`, W / 2, 1740);

  c.fillStyle = "#8a988a";
  c.font = "34px Jua, sans-serif";
  c.fillText("3주 뒤가 제일 맛있어요", W / 2, 1850);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
  });
}
