import type { BaseSpirit, Flavor, TasteDimension, TasteScore } from "@cocktail-taste-test/contracts";

export const DIMENSION_LABELS: Record<TasteDimension, string> = {
  sweet: "단맛", sour: "산미", bitter: "쓴맛", alcoholIntensity: "도수감", refreshing: "청량감",
};
export const FLAVOR_LABELS: Record<Flavor, string> = {
  citrus: "시트러스", fruity: "과일", tropical: "열대과일", herbal: "허브", floral: "꽃향",
  creamy: "크리미", coffee: "커피", spicy: "스파이시", smoky: "스모키",
};
export const SPIRIT_LABELS: Record<BaseSpirit, string> = {
  gin: "진", vodka: "보드카", rum: "럼", tequila: "테킬라", whiskey: "위스키", mezcal: "메즈칼",
};
export const SCORE_LABELS: Record<TasteScore, string> = {
  1: "매우 낮음", 2: "낮음", 3: "보통", 4: "높음", 5: "매우 높음",
};
