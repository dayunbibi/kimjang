"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dab, drawScene } from "@/lib/draw";
import { buildMask, measure, PAINT_SIZE } from "@/lib/coverage";
import { SECRETS, SECRET_KEYS, type SecretKey } from "@/lib/secrets";
import { judge } from "@/lib/judge";
import { bumpTodayCount, getTodayCount } from "@/lib/counter";
import { makeResultImage } from "@/lib/resultImage";
import ResultCard from "./ResultCard";

type Phase = "pick" | "paint" | "done";

const TIME_LIMIT = 12; // seconds

const STEPS: { key: Phase; label: string }[] = [
  { key: "pick", label: "비법 재료" },
  { key: "paint", label: "양념 바르기" },
  { key: "done", label: "김치통 담기" },
];

type Result = {
  url: string;
  blob: Blob;
  title: string;
  score: number;
};

export default function KimjangGame() {
  const [phase, setPhaseState] = useState<Phase>("pick");
  const [secret, setSecret] = useState<SecretKey | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const covBarRef = useRef<HTMLElement>(null);
  const covNumRef = useRef<HTMLSpanElement>(null);
  const timeBarRef = useRef<HTMLElement>(null);
  const timeNumRef = useRef<HTMLSpanElement>(null);

  // per-frame stuff lives in refs so React doesn't re-render while painting
  const paintRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<Uint8Array | null>(null);
  const phaseRef = useRef<Phase>("pick");
  const secretRef = useRef<SecretKey | null>(null);
  const game = useRef({ timeLeft: TIME_LIMIT, started: false, drawing: false, last: { x: 0, y: 0 }, coverage: 0, spill: 0 });
  const size = useRef({ W: 0, dpr: 1 });

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  // paint layer + cabbage mask are created once on the client
  useEffect(() => {
    const p = document.createElement("canvas");
    p.width = p.height = PAINT_SIZE;
    paintRef.current = p;
    maskRef.current = buildMask();
    setCount(getTodayCount());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      size.current = { W: rect.width, dpr };
      canvas.width = canvas.height = Math.round(rect.width * dpr);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [result]); // canvas is re-mounted after "한 포기 더"

  const updateBars = useCallback(() => {
    const g = game.current;
    const pct = Math.round(g.coverage * 100);
    if (covBarRef.current) covBarRef.current.style.width = `${pct}%`;
    if (covNumRef.current) covNumRef.current.textContent = `${pct}%`;
    if (timeBarRef.current) timeBarRef.current.style.width = `${(g.timeLeft / TIME_LIMIT) * 100}%`;
    if (timeNumRef.current) timeNumRef.current.textContent = `${Math.ceil(g.timeLeft)}초`;
  }, []);

  const runMeasure = useCallback(() => {
    const p = paintRef.current;
    const mask = maskRef.current;
    if (!p || !mask) return;
    const { coverage, spill } = measure(p.getContext("2d")!, mask);
    game.current.coverage = coverage;
    game.current.spill = spill;
  }, []);

  const finish = useCallback(async () => {
    if (phaseRef.current !== "paint") return;
    const g = game.current;
    g.drawing = false;
    runMeasure();
    updateBars();
    setPhase("done");

    const verdict = judge(g.coverage, g.spill);
    setCount(bumpTodayCount());
    const blob = await makeResultImage({
      verdict,
      coverage: g.coverage,
      secret: secretRef.current ?? "salted",
      paint: paintRef.current!,
    });
    setResult({ url: URL.createObjectURL(blob), blob, title: verdict.title, score: verdict.score });
  }, [runMeasure, updateBars, setPhase]);

  // main loop: timer, live coverage, drawing
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let sinceMeasure = 0;

    function tick(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = game.current;

      if (phaseRef.current === "paint" && g.started) {
        g.timeLeft = Math.max(0, g.timeLeft - dt);
        sinceMeasure += dt;
        // reading pixels every frame is wasteful, 5 times a second is enough
        if (sinceMeasure > 0.2) {
          sinceMeasure = 0;
          runMeasure();
          updateBars();
        }
        if (g.timeLeft === 0) finish();
      }

      const canvas = canvasRef.current;
      if (canvas && paintRef.current && phaseRef.current !== "done") {
        const ctx = canvas.getContext("2d")!;
        const { W, dpr } = size.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawScene(ctx, W, paintRef.current, secretRef.current);
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finish, runMeasure, updateBars]);

  // ---------- painting ----------

  function toPaintSpace(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * PAINT_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * PAINT_SIZE,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = game.current;
    if (phaseRef.current !== "paint" || g.timeLeft <= 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    g.drawing = true;
    if (!g.started) {
      g.started = true;
      setStarted(true);
    }
    const p = toPaintSpace(e);
    g.last = p;
    dab(paintRef.current!.getContext("2d")!, p.x, p.y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = game.current;
    if (!g.drawing) return;
    const ctx = paintRef.current!.getContext("2d")!;
    const p = toPaintSpace(e);
    // fill the gap between pointer events so fast swipes don't leave dots
    const dx = p.x - g.last.x;
    const dy = p.y - g.last.y;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 10));
    for (let i = 1; i <= steps; i++) {
      dab(ctx, g.last.x + (dx * i) / steps, g.last.y + (dy * i) / steps);
    }
    g.last = p;
  }

  function stopDrawing() {
    game.current.drawing = false;
  }

  // ---------- actions ----------

  function pickSecret(key: SecretKey) {
    if (secretRef.current) return;
    secretRef.current = key;
    setSecret(key);
    setTimeout(() => setPhase("paint"), 700);
  }

  function again() {
    if (result) URL.revokeObjectURL(result.url);
    paintRef.current?.getContext("2d")!.clearRect(0, 0, PAINT_SIZE, PAINT_SIZE);
    game.current = { timeLeft: TIME_LIMIT, started: false, drawing: false, last: { x: 0, y: 0 }, coverage: 0, spill: 0 };
    secretRef.current = null;
    setSecret(null);
    setStarted(false);
    setResult(null);
    setPhase("pick");
  }

  // ---------- UI ----------

  const stepIndex = STEPS.findIndex((s) => s.key === phase);

  let hint: React.ReactNode = null;
  if (phase === "pick") {
    hint = secret ? (
      `${SECRETS[secret].name} 넣고 양념 버무리는 중…`
    ) : (
      <>
        우리 집 비법 재료는?
        <small>양념에 하나만 넣을 수 있어요</small>
      </>
    );
  } else if (phase === "paint") {
    hint = (
      <>
        배추에 양념을 골고루 발라주세요
        <small>문지르면 시작. 12초 안에 90% 넘기기, 대야에 튀면 감점</small>
      </>
    );
  } else if (!result) {
    hint = "김치통에 담는 중…";
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <ol className="flex gap-1.5 font-ui text-[13px]">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className={`flex-1 border-b-[3px] py-1 text-center ${
              i < stepIndex ? "border-ink-dim text-ink" : i === stepIndex ? "border-basin text-basin" : "border-line text-ink-dim"
            }`}
          >
            {s.label}
          </li>
        ))}
      </ol>

      {result ? (
        <ResultCard imageUrl={result.url} imageBlob={result.blob} title={result.title} score={result.score} onAgain={again} />
      ) : (
        <>
          <canvas
            ref={canvasRef}
            aria-label="고무 대야 속 절임배추"
            className="block aspect-square w-full cursor-crosshair touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
          />

          <p className="hint">{hint}</p>

          {phase === "paint" && (
            <div className="flex flex-col gap-2">
              <div className="bar-row">
                <span>양념</span>
                <div className="bar">
                  <span className="goal" />
                  <i ref={covBarRef} />
                </div>
                <span ref={covNumRef}>0%</span>
              </div>
              <div className="bar-row">
                <span>시간</span>
                <div className="bar time">
                  <i ref={timeBarRef} style={{ width: "100%" }} />
                </div>
                <span ref={timeNumRef}>{TIME_LIMIT}초</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2.5">
            {phase === "pick" &&
              SECRET_KEYS.map((key) => (
                <button
                  key={key}
                  className={`btn btn-chip grow basis-[40%] ${secret === key ? "picked" : ""}`}
                  disabled={!!secret}
                  onClick={() => pickSecret(key)}
                >
                  {SECRETS[key].name}
                  <small>{SECRETS[key].type}</small>
                </button>
              ))}

            {phase === "paint" && (
              <button className="btn btn-big flex-1" disabled={!started} onClick={finish}>
                다 발랐어요
              </button>
            )}
          </div>
        </>
      )}

      {count > 0 && <p className="text-center text-[13px] tabular-nums text-ink-dim">오늘 담근 김치 {count}포기</p>}
    </div>
  );
}
