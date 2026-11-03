# 🥬 온라인 김장하기 (Online Kimjang)

A tiny browser game about making kimchi the Korean way — in a red rubber basin on the balcony.
Pick your family's secret ingredient, then rub 양념 (seasoning paste) over a salted napa cabbage before time runs out.

Part 2 of a street-food series. Part 1: [🐟 온라인 붕어빵 굽기](https://github.com/dayunbibi/bungeoppang)

## How to play

1. **Secret ingredient** — 굴 (oyster), 새우젓 (salted shrimp), 생새우 (fresh shrimp), or 갓 (mustard greens).
2. **Rub the seasoning** — drag your finger over the cabbage. You have 12 seconds to cover 90%.
   Paste that lands in the basin instead of on the cabbage costs points.
3. **Result** — get a grade (할머니 손맛 김치, 양념 폭탄 김치, 반쪽 백김치 …) and a score out of 100,
   on a 1080×1920 card that fits an Instagram story.

## How the scoring works

The seasoning is painted onto an offscreen 600×600 canvas, not the visible one,
so the score is the same on a phone and on a laptop.

- A **mask** of the cabbage shape is drawn once at startup.
- While you paint, the game samples every 4th pixel (5 times a second) and compares it with the mask:
  - `coverage` = painted cabbage pixels / all cabbage pixels
  - `spill` = painted pixels outside the cabbage / all painted pixels
- `score = coverage × 85 + (spill bonus up to 15)`

## Tech

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Canvas 2D for the basin, cabbage and seasoning (no image assets)

## Project structure

```
src/
  app/
    layout.tsx          # fonts, metadata
    page.tsx            # header, link to part 1
    globals.css         # theme tokens, buttons, bars
    opengraph-image.png # link preview
  components/
    KimjangGame.tsx     # game state + render loop + pointer painting
    ResultCard.tsx      # result image, save & share
  lib/
    draw.ts             # basin, cabbage, seasoning brush
    coverage.ts         # cabbage mask + coverage/spill measuring
    judge.ts            # scoring and grade titles
    resultImage.ts      # builds the shareable PNG
    secrets.ts          # secret ingredient options
    counter.ts          # "today's count" in localStorage
```

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000
