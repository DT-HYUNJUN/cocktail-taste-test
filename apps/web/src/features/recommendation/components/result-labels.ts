import type { BaseSpirit, Flavor, RecommendationReason, TasteDimension, TasteScore } from "@cocktail-taste-test/contracts";

const COCKTAIL_NAME_LABELS: Record<string, string> = {
  americano: "아메리카노",
  "dry-martini": "드라이 마티니",
  "espresso-martini": "에스프레소 마티니",
  manhattan: "맨해튼",
  margarita: "마가리타",
  "mezcal-margarita": "메즈칼 마가리타",
  mojito: "모히토",
  negroni: "네그로니",
  "old-fashioned": "올드 패션드",
  "pina-colada": "피냐 콜라다",
  "tequila-sunrise": "테킬라 선라이즈",
  "tom-collins": "톰 콜린스",
};

const COCKTAIL_DESCRIPTIONS: Record<string, string> = {
  americano: "쌉쌀한 허브 풍미에 탄산을 더한 가볍고 산뜻한 칵테일이에요. 네그로니와 비슷한 매력을 지니면서도 도수 부담이 적어 편안하게 즐기기 좋아요.",
  "dry-martini": "진과 드라이 베르무트로 만드는 깔끔하고 도수감 있는 칵테일이에요. 단맛은 적고 허브 향과 선명한 여운이 남아 담백한 스타일을 좋아할 때 잘 어울려요.",
  "espresso-martini": "보드카에 에스프레소와 커피 풍미를 더한 진하고 향긋한 칵테일이에요. 커피의 쌉쌀함과 은은한 단맛이 어우러져 디저트 한 잔으로 잘 어울려요.",
  manhattan: "위스키에 달콤한 베르무트와 비터스를 더한 깊고 부드러운 칵테일이에요. 풍부한 향과 은은한 단맛이 어우러진 차분하고 클래식한 한 잔이에요.",
  margarita: "테킬라에 라임의 산미와 은은한 단맛을 더한 칵테일이에요. 상큼하고 선명한 맛에 잔 가장자리의 소금이 색다른 포인트를 더해요.",
  "mezcal-margarita": "마가리타의 상큼한 맛에 메즈칼 특유의 스모키한 향을 더한 칵테일이에요. 산미와 훈연 향이 어우러져 조금 더 깊고 개성 있는 맛을 느낄 수 있어요.",
  mojito: "라임과 민트, 탄산의 상쾌함이 돋보이는 럼 칵테일이에요. 가볍고 청량해서 산뜻한 한 잔을 찾을 때 잘 어울려요.",
  negroni: "진과 허브 풍미, 쌉쌀한 맛이 조화를 이루는 클래식 칵테일이에요. 달콤함 뒤에 남는 깊은 쓴맛을 천천히 즐기기 좋아요.",
  "old-fashioned": "위스키의 풍미를 설탕과 비터스로 부드럽게 다듬은 클래식 칵테일이에요. 도수감과 묵직한 향이 선명해 위스키 본연의 맛을 천천히 즐기기 좋아요.",
  "pina-colada": "럼과 파인애플, 코코넛이 어우러진 부드러운 열대풍 칵테일이에요. 달콤하고 크리미해서 디저트처럼 편안하게 즐기기 좋아요.",
  "tequila-sunrise": "테킬라와 오렌지의 과일 맛이 중심이 되는 달콤하고 화사한 칵테일이에요. 석양처럼 층이 진 색감과 부드러운 맛 덕분에 부담 없이 즐길 수 있어요.",
  "tom-collins": "진에 레몬과 탄산을 더한 상큼하고 깔끔한 칵테일이에요. 레모네이드처럼 산뜻하지만 진의 은은한 향도 함께 느낄 수 있어요.",
};

export function getCocktailDisplayName(id: string, fallbackName: string) {
  return COCKTAIL_NAME_LABELS[id] ?? fallbackName;
}

export function getCocktailDescription(id: string) {
  return COCKTAIL_DESCRIPTIONS[id] ?? null;
}

export function getRecommendationReasonText(reason: RecommendationReason) {
  if (reason.type === "core-match") return `선호하는 ${reason.dimensions.map((value) => DIMENSION_LABELS[value]).join("·")}과 잘 어울려요`;
  if (reason.type === "flavor-match") return `좋아하는 ${reason.flavors.map((value) => FLAVOR_LABELS[value]).join("·")} 풍미가 있어요`;
  return `선호하는 ${reason.baseSpirits.map((value) => SPIRIT_LABELS[value]).join("·")} 베이스 칵테일이에요`;
}

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
