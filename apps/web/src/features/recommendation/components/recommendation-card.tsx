import type { RecommendationItem } from "@cocktail-taste-test/contracts";
import { DIMENSION_LABELS, FLAVOR_LABELS, SCORE_LABELS, SPIRIT_LABELS } from "./result-labels";
import { RecommendationReasons } from "./recommendation-reasons";

export function RecommendationCard({ item }: { item: RecommendationItem }) {
  const { cocktail } = item;

  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* 칵테일 이미지 */}
        <div className="relative aspect-[4/5] bg-[#FFF0E6] md:aspect-auto md:min-h-[420px]">
          {cocktail.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cocktail.imageUrl} alt={`${cocktail.name} 칵테일`} className="absolute inset-0 h-full w-full object-cover object-center" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" role="img" aria-label={`${cocktail.name} 이미지 준비 중`}>
              <span aria-hidden="true" className="text-7xl">
                🍸
              </span>
              <span className="text-sm font-medium text-[#A94417]">이미지 준비 중</span>
            </div>
          )}
        </div>

        {/* 칵테일 정보 */}
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#B74716]">YOUR COCKTAIL</p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{cocktail.name}</h3>

          {/* 풍미 / 베이스 태그 */}
          <div className="mt-5 flex flex-wrap gap-2">
            {cocktail.flavors.map((value) => (
              <span key={value} className="rounded-full bg-[#FFF0E6] px-3 py-1.5 text-xs font-semibold text-[#A94417]">
                {FLAVOR_LABELS[value]}
              </span>
            ))}

            {cocktail.baseSpirits.map((value) => (
              <span key={value} className="rounded-full bg-[#FFF3CC] px-3 py-1.5 text-xs font-semibold text-[#705200]">
                {SPIRIT_LABELS[value]}
              </span>
            ))}
          </div>

          {/* 추천 이유 */}
          <div className="mt-7 border-t border-border pt-6">
            <h4 className="text-base font-bold text-foreground">이 칵테일이 어울리는 이유</h4>

            {item.reasons.length > 0 ? (
              <div className="mt-3">
                <RecommendationReasons reasons={item.reasons} />
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-muted-foreground">취향 정보를 바탕으로 선정된 칵테일이에요.</p>
            )}
          </div>
        </div>
      </div>

      {/* 칵테일 특성 */}
      <div className="border-t border-border px-6 py-6 sm:px-8">
        <h4 className="mb-4 text-sm font-bold text-foreground">이 칵테일의 특징</h4>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(cocktail.dimensions).map(([dimension, score]) => (
            <div key={dimension} className="rounded-xl bg-background p-3">
              <dt className="text-xs font-medium text-muted-foreground">{DIMENSION_LABELS[dimension as keyof typeof DIMENSION_LABELS]}</dt>

              <dd className="mt-1 text-sm font-bold text-foreground">{SCORE_LABELS[score]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
