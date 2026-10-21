import type { RecommendationReason } from "@cocktail-taste-test/contracts";
import { DIMENSION_LABELS, FLAVOR_LABELS, SPIRIT_LABELS } from "./result-labels";

function reasonText(reason: RecommendationReason): string {
  if (reason.type === "core-match") return `선호하는 ${reason.dimensions.map((value) => DIMENSION_LABELS[value]).join("·")}과 잘 어울려요`;
  if (reason.type === "flavor-match") return `좋아하는 ${reason.flavors.map((value) => FLAVOR_LABELS[value]).join("·")} 풍미가 있어요`;
  return `선호하는 ${reason.baseSpirits.map((value) => SPIRIT_LABELS[value]).join("·")} 베이스 칵테일이에요`;
}

export function RecommendationReasons({ reasons }: { reasons: RecommendationReason[] }) {
  if (reasons.length === 0) return <p className="text-sm text-stone-500">표시할 추천 이유가 없습니다.</p>;
  return <ul className="space-y-2">{reasons.map((reason) => <li key={reason.type} className="text-sm leading-6 text-stone-700">{reasonText(reason)}</li>)}</ul>;
}
