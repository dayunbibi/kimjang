export type Verdict = {
  title: string;
  line: string;
  score: number;
  spillLabel: string;
};

// coverage and spill are 0 ~ 1
export function judge(coverage: number, spill: number): Verdict {
  const spillPts = spill < 0.15 ? 15 : spill < 0.3 ? 8 : 0;
  const score = Math.min(100, Math.round(coverage * 85 + spillPts));
  const spillLabel = spill < 0.15 ? "깔끔" : spill < 0.3 ? "조금 튐" : "사방에 튐";

  if (coverage >= 0.9 && spill < 0.2) {
    return { score, spillLabel, title: "할머니 손맛 김치", line: "이 정도면 내년 김장도 맡겨도 되겠어요." };
  }
  if (coverage >= 0.9) {
    return { score, spillLabel, title: "양념 폭탄 김치", line: "배추보다 대야가 더 빨개요. 맛은 확실." };
  }
  if (coverage >= 0.7) {
    return { score, spillLabel, title: "우리 집 김장 김치", line: "푹 익으면 라면이랑 딱이에요." };
  }
  if (coverage >= 0.4) {
    return { score, spillLabel, title: "반쪽 백김치", line: "반은 김치, 반은 백김치. 두 가지 맛을 한 번에." };
  }
  return { score, spillLabel, title: "등짝 스매싱 김치", line: "엄마가 장갑 다시 끼고 오래요." };
}
