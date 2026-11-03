// "비법 재료" — every family has one
export type SecretKey = "oyster" | "salted" | "shrimp" | "mustard";

export type Secret = {
  name: string;
  type: string; // fun label for the result card
  color: string;
};

export const SECRETS: Record<SecretKey, Secret> = {
  oyster: { name: "굴", type: "굴 듬뿍파", color: "#b9b4a6" },
  salted: { name: "새우젓", type: "정석파", color: "#e9c9b5" },
  shrimp: { name: "생새우", type: "시원파", color: "#e6866b" },
  mustard: { name: "갓", type: "어른입맛파", color: "#6b4a6e" },
};

export const SECRET_KEYS = Object.keys(SECRETS) as SecretKey[];
