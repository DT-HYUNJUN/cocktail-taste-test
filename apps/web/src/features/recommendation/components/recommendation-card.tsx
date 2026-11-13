import type { RecommendationItem } from "@cocktail-taste-test/contracts";
import { DIMENSION_LABELS, FLAVOR_LABELS, getCocktailDescription, getCocktailDisplayName, SCORE_LABELS, SPIRIT_LABELS } from "./result-labels";
import { RecommendationReasons } from "./recommendation-reasons";
import { CocktailImage } from "../ui/cocktail-image";

export function RecommendationCard({ item }: { item: RecommendationItem }) {
  const { cocktail } = item;
  const displayName = getCocktailDisplayName(cocktail.id, cocktail.name);
  const description = getCocktailDescription(cocktail.id);

  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* 칵테일 이미지 */}
        <CocktailImage cocktailId={cocktail.id} imageUrl={cocktail.imageUrl} name={displayName} />

        {/* 칵테일 정보 */}
        <div className="flex flex-col p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#B74716]">YOUR COCKTAIL</p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{displayName}</h3>

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

          {description ? <p className="mt-5 text-sm leading-6 text-muted-foreground">{description}</p> : null}

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

          {/* 칵테일 특성 */}
          <div className="mt-7 border-t border-border pt-6">
            <h4 className="text-base font-bold text-foreground">이 칵테일의 맛</h4>

            <dl className="mt-4 space-y-3">
              {Object.entries(cocktail.dimensions).map(([dimension, score]) => (
                <div key={dimension} className="grid grid-cols-[3.5rem_minmax(0,1fr)_4rem] items-center gap-3">
                  <dt className="text-xs font-semibold text-foreground">{DIMENSION_LABELS[dimension as keyof typeof DIMENSION_LABELS]}</dt>

                  <dd className="contents">
                    <div
                      className="h-2 overflow-hidden rounded-full bg-[#F2EAE4]"
                      role="meter"
                      aria-label={`${DIMENSION_LABELS[dimension as keyof typeof DIMENSION_LABELS]} ${score}점`}
                      aria-valuemin={1}
                      aria-valuemax={5}
                      aria-valuenow={score}
                    >
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(score / 5) * 100}%` }} />
                    </div>

                    <span className="text-right text-xs font-semibold text-muted-foreground">{SCORE_LABELS[score]}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </article>
  );
}
