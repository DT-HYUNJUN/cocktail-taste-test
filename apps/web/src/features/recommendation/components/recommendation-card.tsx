import type { RecommendationItem } from "@cocktail-taste-test/contracts";
import { DIMENSION_LABELS, FLAVOR_LABELS, SCORE_LABELS, SPIRIT_LABELS } from "./result-labels";
import { RecommendationReasons } from "./recommendation-reasons";

export function RecommendationCard({ item }: { item: RecommendationItem }) {
  const { cocktail } = item;
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {cocktail.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cocktail.imageUrl} alt={`${cocktail.name} 칵테일`} className="h-52 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-stone-100 text-sm font-medium text-stone-500" role="img" aria-label={`${cocktail.name} 이미지 없음`}>이미지 준비 중</div>
      )}
      <div className="p-5 sm:p-6">
        <p className="text-sm font-semibold text-amber-800">추천 순서 {item.rank}</p>
        <h3 className="mt-1 text-2xl font-semibold text-stone-950">{cocktail.name}</h3>
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(cocktail.dimensions).map(([dimension, score]) => (
            <div key={dimension} className="rounded-lg bg-stone-50 p-3">
              <dt className="text-xs font-medium text-stone-500">{DIMENSION_LABELS[dimension as keyof typeof DIMENSION_LABELS]}</dt>
              <dd className="mt-1 text-sm font-semibold text-stone-900">{SCORE_LABELS[score]}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          {cocktail.flavors.map((value) => <span key={value} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">{FLAVOR_LABELS[value]}</span>)}
          {cocktail.baseSpirits.map((value) => <span key={value} className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-800">{SPIRIT_LABELS[value]}</span>)}
        </div>
        <div className="mt-5 border-t border-stone-200 pt-5"><h4 className="mb-2 font-semibold text-stone-900">추천 이유</h4><RecommendationReasons reasons={item.reasons} /></div>
      </div>
    </article>
  );
}
