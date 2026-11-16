export type Kind = "hotteok" | "goguma" | "kimjang";
export type Item = {
  stage: number;
  variant: 0 | 1;
  heat: number;
  front: number;
  prep: number;
};
export type Customer = {
  id: number;
  want: [number, number];
  wait: number;
  max: number;
};
export type Market = {
  kind: Kind;
  mode: "ready" | "open" | "closed";
  paused: boolean;
  day: number;
  time: number;
  items: Item[];
  stock: [number, number];
  customers: Customer[];
  nextId: number;
  spawn: number;
  sales: number;
  tips: number;
  served: number;
  lost: number;
  waste: number;
  message: string;
};
export const menus = {
  hotteok: {
    name: "호떡",
    emoji: "🥞",
    variants: ["꿀 호떡", "씨앗 호떡"],
    price: 1500,
    slots: 4,
    action: "노릇하게 뒤집고 꾹 눌러요",
    instruction:
      "속을 고르고 빈 틀 → 반죽을 4번 꾹 → 앞면 굽기 → 뒤집기 → 꺼내기",
    unit: "장",
  },
  goguma: {
    name: "군고구마",
    emoji: "🍠",
    variants: ["촉촉 꿀고구마", "포슬 밤고구마"],
    price: 2000,
    slots: 5,
    action: "저마다 다른 속도로 익는 고구마",
    instruction:
      "종류를 고르고 빈 칸에 넣어요. 초록 구간에 익은 고구마부터 꺼내요.",
    unit: "개",
  },
  kimjang: {
    name: "김장",
    emoji: "🥬",
    variants: ["순한 김치", "매콤 김치"],
    price: 5000,
    slots: 3,
    action: "배춧잎 사이사이 정성 한 스푼",
    instruction:
      "맵기를 고르고 배추를 놓아요. 양념 8곳을 문지르거나 눌러 채운 뒤 포장해요.",
    unit: "통",
  },
};
export const empty = (): Item => ({
  stage: 0,
  variant: 0,
  heat: 0,
  front: 0,
  prep: 0,
});
export function order(id: number, day: number): Customer {
  const max = Math.max(38, 65 - day * 2);
  return {
    id,
    want: id % 3 === 0 ? [0, 2] : id % 2 === 0 ? [1, 1] : [1, 0],
    wait: max,
    max,
  };
}
export function createMarket(kind: Kind, day = 1): Market {
  return {
    kind,
    mode: "ready",
    paused: false,
    day,
    time: 150,
    items: Array.from({ length: menus[kind].slots }, empty),
    stock: [0, 0],
    customers: [],
    nextId: 1,
    spawn: 8,
    sales: 0,
    tips: 0,
    served: 0,
    lost: 0,
    waste: 0,
    message: "포잎이 사장님, 오늘도 잘 부탁해요!",
  };
}
export function startMarket(s: Market): Market {
  return {
    ...s,
    mode: "open",
    customers: [order(1, s.day)],
    nextId: 2,
    message: "첫 손님이에요! 주문을 보고 조리를 시작해요.",
  };
}
export function tick(s: Market, dt: number): Market {
  if (s.mode !== "open" || s.paused) return s;
  const elapsed = Math.max(0, Math.min(dt, s.time));
  let customers = s.customers
    .filter((o) => o.wait > elapsed)
    .map((o) => ({ ...o, wait: o.wait - elapsed }));
  const lost = s.customers.length - customers.length;
  let nextId = s.nextId,
    spawn = s.spawn - elapsed;
  if (spawn <= 0 && customers.length < 3 && s.time > elapsed) {
    customers = [...customers, order(nextId++, s.day)];
    spawn = Math.max(7, 13 - s.day);
  }
  const time = Math.max(0, s.time - elapsed);
  return {
    ...s,
    time,
    mode: time === 0 ? "closed" : "open",
    customers,
    nextId,
    spawn,
    lost: s.lost + lost,
    message: lost
      ? "손님이 돌아갔어요. 다음 주문은 따끈하게 준비해요!"
      : s.message,
    items: s.items.map((v, i) =>
      v.stage >= 2 && v.stage <= 3 && s.kind !== "kimjang"
        ? {
            ...v,
            heat: Math.min(
              120,
              v.heat + elapsed * (s.kind === "goguma" ? 7 + i * 1.7 : 11),
            ),
          }
        : v,
    ),
  };
}
export function act(
  s: Market,
  index: number,
  variant: 0 | 1,
  cell?: number,
): Market {
  if (s.mode !== "open" || s.paused || !s.items[index]) return s;
  let v = { ...s.items[index] },
    waste = s.waste,
    message = "";
  const stock = [...s.stock] as [number, number];
  const kind = s.kind;
  if (v.stage === 0) {
    v = { ...empty(), stage: kind === "goguma" ? 2 : 1, variant };
    message =
      kind === "kimjang"
        ? "양념할 곳 8군데를 쓱쓱 채워요."
        : kind === "hotteok"
          ? "반죽을 4번 꾹 눌러 넓게 펴요."
          : "고구마마다 익는 속도가 달라요. 초록 구간을 살펴봐요!";
  } else if (kind === "kimjang") {
    if (v.stage === 1 && cell !== undefined && cell >= 0 && cell < 8) {
      v.prep |= 1 << cell;
      message = "배춧잎 사이까지 양념 쓱쓱!";
      if (v.prep === 255) {
        v.stage = 4;
        message = "양념 완료! 포장 버튼을 눌러 김치통에 담아요.";
      }
    } else if (v.stage === 4) {
      stock[v.variant]++;
      v = empty();
      message = "김치 한 통 포장 완료! 손님께 전달해요.";
    } else return s;
  } else if (v.stage === 1) {
    v.prep += 25;
    message = "꾹꾹! 맛있게 펴고 있어요.";
    if (v.prep >= 100) {
      v.stage = 2;
      message = "지글지글! 초록 구간에서 뒤집어요.";
    }
  } else if (v.heat > 90) {
    v = empty();
    waste++;
    message = "앗, 타버렸어요. 비운 틀에 다시 도전해요!";
  } else if (v.heat < 45) {
    message = "조금만 더! 초록 구간까지 익혀주세요.";
  } else if (kind === "hotteok" && v.stage === 2) {
    v.front = v.heat;
    v.heat = 0;
    v.stage = 3;
    message = "휙! 뒷면도 초록 구간까지 구워요.";
  } else {
    stock[v.variant]++;
    v = empty();
    message = "완성! 주문 수량이 모이면 봉투를 전달해요.";
  }
  return {
    ...s,
    stock,
    waste,
    message,
    items: s.items.map((old, i) => (i === index ? v : old)),
  };
}
export function canDeliver(s: Market, o: Customer) {
  return s.stock[0] >= o.want[0] && s.stock[1] >= o.want[1];
}
export function deliver(s: Market, id: number): Market {
  const o = s.customers.find((c) => c.id === id);
  if (!o || s.mode !== "open" || s.paused || !canDeliver(s, o)) return s;
  const tip = Math.round(((o.wait / o.max) * 400) / 10) * 10;
  return {
    ...s,
    stock: [s.stock[0] - o.want[0], s.stock[1] - o.want[1]],
    customers: s.customers.filter((c) => c.id !== id),
    sales: s.sales + (o.want[0] + o.want[1]) * menus[s.kind].price + tip,
    tips: s.tips + tip,
    served: s.served + 1,
    message: `맛있게 드세요! 판매 완료 · 팁 +${tip}원`,
  };
}
