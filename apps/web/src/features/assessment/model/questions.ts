export const SCALE_ANSWER_IDS = ["very-low", "low", "medium", "high", "very-high", "unknown"] as const;
export type ScaleAnswerId = (typeof SCALE_ANSWER_IDS)[number];

export const FLAVOR_OPTIONS = [
  { id: "citrus", label: "레몬·라임처럼 상큼한 시트러스" },
  { id: "fruity", label: "복숭아·베리처럼 풍부한 과일향" },
  { id: "tropical", label: "파인애플·코코넛 같은 열대 풍미" },
  { id: "herbal", label: "민트·허브처럼 싱그러운 향" },
  { id: "floral", label: "꽃처럼 향긋하고 은은한 향" },
  { id: "creamy", label: "부드럽고 크리미한 느낌" },
  { id: "coffee", label: "커피처럼 진하고 로스티한 풍미" },
  { id: "spicy", label: "생강·향신료처럼 알싸한 풍미" },
  { id: "smoky", label: "훈연향이 느껴지는 스모키한 풍미" },
] as const;
export type FlavorAnswerId = (typeof FLAVOR_OPTIONS)[number]["id"];

export const BASE_SPIRIT_OPTIONS = [
  { id: "gin", label: "gin" }, { id: "vodka", label: "vodka" },
  { id: "rum", label: "rum" }, { id: "tequila", label: "tequila" },
  { id: "whiskey", label: "whiskey" }, { id: "mezcal", label: "mezcal" },
] as const;
export type BaseSpiritAnswerId = (typeof BASE_SPIRIT_OPTIONS)[number]["id"];

export type CoreQuestionId = "sweet" | "sour" | "bitter" | "alcohol-intensity" | "refreshing";
export type MultiQuestionId = "preferred-flavors" | "avoided-flavors" | "preferred-base-spirits";
export type AssessmentQuestionId = CoreQuestionId | MultiQuestionId;
export type Option = { readonly id: string; readonly label: string };
export type SingleQuestion = { readonly kind: "single"; readonly id: CoreQuestionId; readonly title: string; readonly options: readonly { readonly id: ScaleAnswerId; readonly label: string }[] };
export type MultiQuestion = { readonly kind: "multi"; readonly id: MultiQuestionId; readonly title: string; readonly description: string; readonly maxSelections?: number; readonly options: readonly Option[] };
export type AssessmentQuestion = SingleQuestion | MultiQuestion;

const scale = (labels: readonly string[]): SingleQuestion["options"] => SCALE_ANSWER_IDS.map((id, index) => ({ id, label: labels[index] ?? "" }));

export const ASSESSMENT_QUESTIONS = [
  { kind: "single", id: "sweet", title: "칵테일의 단맛은 어느 정도가 좋아요?", options: scale(["거의 달지 않은 게 좋아요", "단맛은 살짝만 있으면 좋아요", "적당히 달콤한 게 좋아요", "꽤 달콤한 게 좋아요", "확실하게 달콤한 게 좋아요", "잘 모르겠어요"]) },
  { kind: "single", id: "sour", title: "새콤한 맛은 어느 정도가 좋아요?", options: scale(["신맛은 거의 없는 게 좋아요", "은은한 산미 정도가 좋아요", "적당히 새콤한 게 좋아요", "꽤 새콤한 게 좋아요", "입맛이 확 살아날 만큼 새콤한 게 좋아요", "잘 모르겠어요"]) },
  { kind: "single", id: "bitter", title: "쌉싸름한 맛은 어느 정도가 좋아요?", options: scale(["쓴맛은 없는 게 좋아요", "아주 약하면 괜찮아요", "적당한 쌉싸름함은 좋아요", "쌉싸름한 맛을 꽤 좋아해요", "강한 쓴맛도 즐기는 편이에요", "잘 모르겠어요"]) },
  { kind: "single", id: "alcohol-intensity", title: "술의 맛과 향은 얼마나 느껴지는 게 좋아요?", options: scale(["술맛이 거의 느껴지지 않는 게 좋아요", "술맛은 은은한 정도가 좋아요", "적당히 느껴지는 게 좋아요", "술의 존재감이 뚜렷한 게 좋아요", "강하고 진한 술맛을 좋아해요", "잘 모르겠어요"]) },
  { kind: "single", id: "refreshing", title: "가볍고 청량한 느낌은 얼마나 좋아하나요?", options: scale(["묵직하고 진한 쪽이 더 좋아요", "청량감은 적은 편이 좋아요", "어느 쪽이든 적당한 게 좋아요", "가볍고 산뜻한 칵테일이 좋아요", "아주 시원하고 청량한 느낌이 좋아요", "잘 모르겠어요"]) },
  { kind: "multi", id: "preferred-flavors", title: "어떤 풍미에 가장 끌리나요?", description: "최대 2개까지 선택해 주세요. 없다면 선택하지 않고 다음으로 이동할 수 있어요.", maxSelections: 2, options: FLAVOR_OPTIONS },
  { kind: "multi", id: "avoided-flavors", title: "반대로, 가능하면 피하고 싶은 풍미가 있나요?", description: "해당하는 풍미를 모두 선택해 주세요. 선호 풍미와 같은 항목은 동시에 선택할 수 없어요.", maxSelections: undefined, options: FLAVOR_OPTIONS },
  { kind: "multi", id: "preferred-base-spirits", title: "좋아하거나 평소 끌리는 베이스 술이 있나요?", description: "최대 2개까지 선택해 주세요. 잘 모르겠다면 선택하지 않아도 돼요.", maxSelections: 2, options: BASE_SPIRIT_OPTIONS },
] as const satisfies readonly AssessmentQuestion[];
