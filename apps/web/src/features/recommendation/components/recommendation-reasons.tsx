import type { RecommendationReason } from "@cocktail-taste-test/contracts";
import { getRecommendationReasonText } from "./result-labels";

export function RecommendationReasons({ reasons }: { reasons: RecommendationReason[] }) {
  if (reasons.length === 0) return <p className="text-sm text-stone-500">표시할 추천 이유가 없습니다.</p>;
  return (
    <ul className="space-y-2.5">
      {reasons.map((reason) => (
        <li key={reason.type} className="flex gap-2.5 text-sm leading-6 text-stone-700">
          <span aria-hidden="true" className="mt-1.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#FFF0E6] text-[10px] font-bold leading-none text-[#B74716]">
            ✓
          </span>
          <span>{getRecommendationReasonText(reason)}</span>
        </li>
      ))}
    </ul>
  );
}
