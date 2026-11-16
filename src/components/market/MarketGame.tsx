"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  act,
  canDeliver,
  createMarket,
  deliver,
  menus,
  startMarket,
  tick,
  type Kind,
  type Item,
} from "@/lib/market/engine";
import "./market.css";
const origin = "https://bungeoppang-seven.vercel.app";
const guests = ["rabbit", "bear", "dog", "hamster", "cat"];
const guestNames = ["토끼", "곰", "강아지", "햄스터", "고양이"];
function Food({ kind, item }: { kind: Kind; item: Item }) {
  const color =
    item.stage === 0
      ? "#655645"
      : item.heat > 90
        ? "#513429"
        : item.stage === 1
          ? "#f7dfae"
          : item.heat < 45
            ? "#ecd3a0"
            : "#db9743";
  return (
    <svg viewBox="0 0 180 100" aria-hidden="true">
      {kind === "hotteok" ? (
        <>
          <ellipse
            cx="90"
            cy="55"
            rx={item.stage === 1 ? 40 + item.prep / 6 : 64}
            ry="32"
            fill={color}
            stroke="#70492e"
            strokeWidth="4"
          />
          {[48, 70, 91, 111, 128].map((x, i) => (
            <path
              key={x}
              d={`M${x} ${42 + (i % 2) * 15}l8 4`}
              stroke={item.variant === 1 ? "#57432d" : "#b67936"}
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}
          <path
            d="M53 69q40 18 78-4"
            fill="none"
            stroke="#ad692a"
            strokeWidth="3"
          />
        </>
      ) : kind === "goguma" ? (
        <>
          <path
            d="M24 63Q36 21 103 24L159 18Q150 39 146 57Q115 97 48 83Z"
            fill={
              item.stage === 0
                ? "#655645"
                : item.heat > 90
                  ? "#48312e"
                  : "#ab6779"
            }
            stroke="#654330"
            strokeWidth="4"
          />
          {item.heat >= 45 && item.heat <= 90 && (
            <path
              d="M45 62Q85 25 134 42Q100 76 45 62"
              fill="#f6cd61"
              stroke="#c4983c"
              strokeWidth="3"
            />
          )}
          <path
            d="M42 70l7 4m66-40 5 3m13 26 5-2"
            stroke="#e2a2aa"
            strokeWidth="3"
          />
        </>
      ) : (
        <>
          <path
            d="M36 75Q10 40 47 24Q59 5 77 20Q101 1 119 24Q157 15 155 51Q165 78 115 88L60 88Z"
            fill={item.stage === 0 ? "#655645" : "#bad584"}
            stroke="#58754a"
            strokeWidth="4"
          />
          <path
            d="M90 84 85 28M90 55 53 31M90 64l42-31M88 73 49 55"
            stroke="#f8f0cc"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          {Array.from({ length: 8 }, (_, i) =>
            item.prep & (1 << i) ? (
              <ellipse
                key={i}
                cx={48 + (i % 4) * 26}
                cy={40 + Math.floor(i / 4) * 24}
                rx="15"
                ry="10"
                fill={item.variant === 0 ? "#d99362" : "#bf5d44"}
                opacity=".9"
              />
            ) : null,
          )}
        </>
      )}
    </svg>
  );
}
export default function MarketGame({ kind }: { kind: Kind }) {
  const cfg = menus[kind];
  const [s, setS] = useState(() => createMarket(kind)),
    [variant, setVariant] = useState<0 | 1>(0),
    [help, setHelp] = useState(false),
    [best, setBest] = useState(0),
    [hand, setHand] = useState("hands"),
    [action, setAction] = useState(0),
    [thank, setThank] = useState(false);
  useEffect(() => {
    try {
      setBest(Number(localStorage.getItem(`poipi-market-${kind}-v1`)) || 0);
    } catch {}
  }, [kind]);
  useEffect(() => {
    if (s.mode !== "open" || s.paused || help) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.5, (now - last) / 1000);
      last = now;
      setS((old) => tick(old, dt));
    }, 100);
    return () => clearInterval(id);
  }, [s.mode, s.paused, help]);
  useEffect(() => {
    if (s.mode !== "closed") return;
    setBest((v) => Math.max(v, s.sales));
    try {
      const key = `poipi-market-${kind}-v1`;
      localStorage.setItem(
        key,
        String(Math.max(Number(localStorage.getItem(key)) || 0, s.sales)),
      );
    } catch {}
  }, [s.mode, s.sales, kind]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setHand("hands");
      setThank(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, [action]);
  const active = s.mode === "open" && !s.paused && !help;
  function touch(i: number, cell?: number) {
    if (!active) return;
    setHand(kind === "hotteok" ? "flip" : "hands");
    setAction((n) => n + 1);
    setS((old) => act(old, i, variant, cell));
  }
  function serve(id: number) {
    if (!active) return;
    const o = s.customers.find((c) => c.id === id);
    if (!o || !canDeliver(s, o)) return;
    setS((old) => deliver(old, id));
    setHand("serve");
    setThank(true);
    setAction((n) => n + 1);
  }
  return (
    <main className={`market market-${kind}`}>
      <header className="mk-nav">
        <a href="https://homesick-games.vercel.app/">🍀 포잎이 놀이터</a>
        <button onClick={() => setHelp(true)} aria-label="게임 방법">
          ?
        </button>
      </header>
      <div className="mk-heading">
        <div>
          <p className="mk-eyebrow">POIPI’S LITTLE SHOP</p>
          <h1>
            포잎이의 <em>{cfg.name} 가게</em>
          </h1>
          <p>{cfg.action}</p>
        </div>
        <span className="mk-day">DAY {String(s.day).padStart(2, "0")}</span>
      </div>
      <section className="mk-stats" aria-label="영업 현황">
        <div>
          오늘 매출
          <strong>
            {s.sales.toLocaleString()}
            <small>원</small>
          </strong>
        </div>
        <div>
          남은 시간
          <strong>
            {Math.floor(Math.ceil(s.time) / 60)}:
            {String(Math.ceil(s.time) % 60).padStart(2, "0")}
          </strong>
        </div>
        <div>
          행복한 손님
          <strong>
            {s.served}
            <small>명</small>
          </strong>
        </div>
        <button
          disabled={s.mode !== "open"}
          onClick={() => setS((v) => ({ ...v, paused: !v.paused }))}
        >
          {s.paused ? "▶ 계속" : "Ⅱ 쉬기"}
        </button>
      </section>
      <section className="mk-scene" aria-label={`${cfg.name} 가게`}>
        <div className="mk-awning">
          <span>🍀 포잎이네 · {cfg.name} 한 입의 행복</span>
        </div>
        <div className="mk-street">
          <div className="mk-houses" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className="mk-snow" aria-hidden="true">
            · ✧ ˚ · ✧ ˚ · ✧
          </div>
          <span className="mk-lane">행운 골목</span>
          <div className="mk-customers">
            {s.customers.map((o) => (
              <article
                className={`mk-customer ${o.wait / o.max < 0.3 ? "mk-hurry" : ""}`}
                key={o.id}
              >
                <div className="mk-order">
                  <strong>
                    {o.want
                      .map((n, i) =>
                        n ? `${cfg.variants[i]} ${n}${cfg.unit}` : "",
                      )
                      .filter(Boolean)
                      .join(" + ")}
                  </strong>
                  <span>
                    {o.wait / o.max < 0.3
                      ? "사장님, 제 건요…?"
                      : "따끈하게 부탁해요 ♡"}
                  </span>
                </div>
                <Image
                  src={`${origin}/shop/${guests[(o.id - 1) % 5]}.webp`}
                  width={220}
                  height={220}
                  alt={`${guestNames[(o.id - 1) % 5]} 손님`}
                  unoptimized
                />
                <progress
                  value={o.wait}
                  max={o.max}
                  aria-label="손님 대기 시간"
                />
                <button
                  disabled={!active || !canDeliver(s, o)}
                  onClick={() => serve(o.id)}
                >
                  {canDeliver(s, o) ? "주문 전달하기" : "기다리는 중…"}
                </button>
              </article>
            ))}
            {s.customers.length === 0 && (
              <p className="mk-wait">
                {s.mode === "ready"
                  ? "손님 맞을 준비를 해볼까요?"
                  : "다음 손님이 오고 있어요…"}
                <span>🐾</span>
              </p>
            )}
          </div>
          {thank && (
            <div className="mk-thank" role="status">
              고마워요, 포잎이! ♡<small>따뜻하게 잘 먹을게요!</small>
            </div>
          )}
        </div>
        <div className="mk-ledge">
          <span>🍀 당신은 포잎이 사장님</span>
          <span>
            한 {cfg.unit} {cfg.price.toLocaleString()}원
          </span>
        </div>
        <div className="mk-workbench">
          <div className="mk-counter-label">
            {kind === "kimjang"
              ? "정성 듬뿍, 양념을 쓱쓱 발라요"
              : "노릇노릇, 초록 구간을 기다려요"}
            <span>MADE WITH LOVE</span>
          </div>
          <div className="mk-stations">
            {s.items.map((v, i) => {
              const burnt = v.heat > 90;
              const label =
                v.stage === 0
                  ? kind === "kimjang"
                    ? "배추 놓기"
                    : kind === "goguma"
                      ? "고구마 넣기"
                      : "반죽 놓기"
                  : kind === "kimjang"
                    ? v.stage === 4
                      ? "김치통에 포장"
                      : "양념 바르기"
                    : v.stage === 1
                      ? "반죽 누르기"
                      : burnt
                        ? "탄 음식 치우기"
                        : kind === "hotteok" && v.stage === 2
                          ? "뒤집기"
                          : "꺼내기";
              return (
                <div
                  className={`mk-station ${burnt ? "mk-burnt" : ""}`}
                  key={i}
                >
                  <span className="mk-num">0{i + 1}</span>
                  <Food kind={kind} item={v} />
                  {kind === "kimjang" && v.stage === 1 ? (
                    <>
                      <div
                        className="mk-coat-grid"
                        aria-label={`${i + 1}번 배추 양념 바르기`}
                      >
                        {Array.from({ length: 8 }, (_, cell) => (
                          <button
                            key={cell}
                            disabled={!active}
                            aria-label={`${i + 1}번 배추 ${cell + 1}번 양념`}
                            aria-pressed={!!(v.prep & (1 << cell))}
                            onPointerEnter={(e) => {
                              if (e.buttons === 1) touch(i, cell);
                            }}
                            onClick={() => touch(i, cell)}
                          >
                            {v.prep & (1 << cell) ? "✓" : "쓱"}
                          </button>
                        ))}
                      </div>
                      <span className="mk-prep-note">
                        {v.prep.toString(2).replace(/0/g, "").length} / 8곳 완료
                      </span>
                    </>
                  ) : (
                    <button
                      className="mk-cook-button"
                      disabled={!active}
                      aria-label={`${i + 1}번 ${label}`}
                      onClick={() => touch(i)}
                    >
                      {label}
                    </button>
                  )}
                  {v.stage > 0 && (
                    <small>
                      {cfg.variants[v.variant]}
                      {kind === "hotteok" && v.stage === 1
                        ? ` · ${v.prep}%`
                        : kind === "hotteok"
                          ? v.stage === 2
                            ? " · 앞면"
                            : " · 뒷면"
                          : ""}
                    </small>
                  )}
                  {kind !== "kimjang" && v.stage >= 2 && (
                    <>
                      <div className="mk-heat">
                        <b style={{ left: `${(v.heat / 120) * 100}%` }} />
                      </div>
                      <span className="mk-prep-note">
                        {burnt
                          ? "탔어요!"
                          : v.heat < 45
                            ? "조금 더 익혀요"
                            : v.heat <= 75
                              ? "지금이 좋아요!"
                              : "서둘러 꺼내요"}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mk-hands" data-tool={hand} key={action}>
            <Image
              src={`${origin}/shop/${hand}.webp`}
              width={260}
              height={260}
              alt=""
              unoptimized
            />
            {hand !== "serve" && kind === "goguma" && (
              <span className="mk-tongs" aria-hidden="true">
                ♧
              </span>
            )}
            {hand !== "serve" && kind === "kimjang" && (
              <span className="mk-glove" aria-hidden="true">
                🧤
              </span>
            )}
          </div>
          <p className="mk-hint">
            {kind === "kimjang"
              ? "양념은 같은 곳을 반복해도 추가로 채워지지 않아요."
              : "● 초록 45–75가 딱 좋아요 · 90을 넘으면 타요"}
          </p>
        </div>
      </section>
      <section className="mk-tools">
        <div>
          <p className="mk-eyebrow">01 · 재료 고르기</p>
          <h2>오늘은 어떤 맛?</h2>
          <div className="mk-variants">
            {cfg.variants.map((name, i) => (
              <button
                key={name}
                aria-pressed={variant === i}
                onClick={() => setVariant(i as 0 | 1)}
              >
                <span>
                  {i === 0
                    ? cfg.emoji
                    : kind === "kimjang"
                      ? "🌶️"
                      : kind === "hotteok"
                        ? "🌻"
                        : "🌰"}
                </span>
                {name}
                {variant === i ? " ✓" : ""}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mk-eyebrow">02 · 포장 준비</p>
          <h2>완성된 {kind === "kimjang" ? "김치" : cfg.name}</h2>
          {cfg.variants.map((name, i) => (
            <p className="mk-stock" key={name}>
              <span>{name}</span>
              <strong>
                {s.stock[i]}
                <small>{cfg.unit}</small>
              </strong>
            </p>
          ))}
        </div>
      </section>
      <div className="mk-message" role="status">
        <b>🍀 포잎이의 한마디</b>
        <span>{s.message}</span>
      </div>
      <p className="mk-best">
        나의 최고 매출 <strong>{best.toLocaleString()}원</strong>
      </p>
      <footer className="mk-footer">
        작은 가게에서 굽는, 오늘의 행복 한 잎.
      </footer>
      {(s.mode !== "open" || s.paused || help) && (
        <div className="mk-overlay">
          <section
            className="mk-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              help
                ? "게임 방법"
                : s.paused
                  ? "잠시 쉬는 중"
                  : `${cfg.name} 가게`
            }
          >
            <Image
              src={`${origin}/poipi/${s.mode === "closed" ? 3 : 1}.webp`}
              width={140}
              height={140}
              alt="포잎이 사장님"
              unoptimized
            />
            <p className="mk-eyebrow">POIPI’S LITTLE SHOP</p>
            <h2>
              {help
                ? "사장님을 위한 작은 안내"
                : s.paused
                  ? "잠깐, 쉬어가요"
                  : s.mode === "closed"
                    ? "오늘도 수고했어요!"
                    : `포잎이의 ${cfg.name} 가게`}
            </h2>
            {help ? (
              <>
                <p>{cfg.instruction}</p>
                <p>
                  주문 수량이 모이면 손님의 전달 버튼을 눌러요. 빨리 전달할수록
                  팁이 늘어요!
                </p>
              </>
            ) : s.mode === "closed" ? (
              <div className="mk-receipt">
                <strong>{s.sales.toLocaleString()}원</strong>
                <p>
                  판매 {s.served}건 · 팁 {s.tips.toLocaleString()}원
                </p>
                <p>
                  놓친 손님 {s.lost}명 · 버린 음식 {s.waste}개
                </p>
              </div>
            ) : (
              <p>
                {s.paused
                  ? "손님도 음식도 잠시 기다리고 있어요."
                  : `150초 동안 ${kind === "kimjang" ? "김치를" : kind === "hotteok" ? "호떡을" : "군고구마를"} 만들어 손님께 대접해요.`}
              </p>
            )}
            <button
              className="mk-primary"
              onClick={() => {
                if (help) {
                  setHelp(false);
                  return;
                }
                if (s.paused) {
                  setS((v) => ({ ...v, paused: false }));
                  return;
                }
                setS(
                  startMarket(
                    createMarket(kind, s.mode === "closed" ? s.day + 1 : 1),
                  ),
                );
                setHand("hands");
              }}
            >
              {help
                ? "알겠어요!"
                : s.paused
                  ? "다시 시작하기"
                  : s.mode === "closed"
                    ? "다음 날 영업하기 →"
                    : "가게 문 열기 →"}
            </button>
            {!help && (
              <button className="mk-text-button" onClick={() => setHelp(true)}>
                게임 방법 보기
              </button>
            )}
            {s.mode === "closed" && !help && (
              <button
                className="mk-text-button"
                onClick={() => setS(createMarket(kind))}
              >
                첫날부터 다시 하기
              </button>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
