import type { RecommendationItem, UserTasteSummary } from "@cocktail-taste-test/contracts";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { CocktailImage } from "../ui/cocktail-image";
import { TasteRadarChart } from "../ui/taste-radar-chart";
import { RecommendationReasons } from "./recommendation-reasons";
import { DIMENSION_LABELS, FLAVOR_LABELS, getCocktailDescription, getCocktailDisplayName, SCORE_LABELS, SPIRIT_LABELS } from "./result-labels";

type RecommendationCardProps = {
  item: RecommendationItem;
  profile?: UserTasteSummary;
  actions?: ReactNode;
  perspective?: "owner" | "shared";
};

export function RecommendationCard({ item, profile, actions, perspective = "owner" }: RecommendationCardProps) {
  const { cocktail } = item;
  const displayName = getCocktailDisplayName(cocktail.id, cocktail.name);
  const description = getCocktailDescription(cocktail.id);

  return (
    <article className="mx-auto w-full max-w-6xl">
      <header className="flex items-center justify-between items-start gap-4 px-1">
        <Link
          href="/"
          aria-label="칵테일 취향 테스트 홈"
          className="flex items-center gap-3 font-bold tracking-tight focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          <Image src="/icon.svg" alt="" width={40} height={40} aria-hidden="true" className="size-10 rounded-xl" />
          <span className="hidden sm:inline">칵테일 취향 테스트</span>
        </Link>
        <div className="shrink-0">{actions}</div>
      </header>

      <section className="mt-7 grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-12" aria-labelledby="recommended-cocktail-title">
        <div className="order-2 lg:order-1 lg:pl-10">
          <p className="text-lg font-extrabold text-foreground sm:text-2xl">{perspective === "shared" ? "친구와 가장 잘 어울리는 칵테일은" : "당신과 가장 잘 어울리는 칵테일은"}</p>
          <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-1">
            <div className="relative w-fit">
              <h1 id="recommended-cocktail-title" className="relative z-10 text-5xl font-black tracking-[-0.08em] text-foreground sm:text-6xl lg:text-7xl">
                {displayName}
              </h1>
              <span aria-hidden="true" className="absolute -bottom-1 left-0 h-2 w-full -rotate-1 rounded-full bg-lime" />
            </div>
            <p className="pb-1 text-xl font-black italic text-primary sm:text-2xl">{cocktail.name}</p>
          </div>
          {description ? <p className="mt-7 max-w-xl text-sm leading-7 text-foreground/80 sm:text-base">{description}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {cocktail.flavors.map((value) => (
              <span key={value} className="rounded-full bg-lime/55 px-5 py-2.5 text-sm font-bold text-plum">
                ◇ {FLAVOR_LABELS[value]}
              </span>
            ))}
            {cocktail.baseSpirits.map((value) => (
              <span key={value} className="rounded-full bg-lilac/55 px-5 py-2.5 text-sm font-bold text-plum">
                ♙ {SPIRIT_LABELS[value]}
              </span>
            ))}
          </div>
        </div>

        <div className="order-1 relative mx-auto w-full max-w-md lg:order-2 lg:mr-8 lg:max-w-sm">
          <div aria-hidden="true" className="absolute -inset-x-5 inset-y-8 -z-10 rotate-3 rounded-[38%] bg-lilac/55" />
          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-[#FFF0E6] shadow-[0_20px_55px_rgba(48,35,43,0.1)]">
            <CocktailImage cocktailId={cocktail.id} imageUrl={cocktail.imageUrl} name={displayName} fit="contain" />
          </div>
        </div>
      </section>

      <div className="mt-9 grid gap-5 lg:grid-cols-[1.55fr_0.9fr]">
        {profile ? (
          <section
            className="rounded-[1.75rem] border border-border bg-surface p-5 shadow-[0_14px_40px_rgba(48,35,43,0.07)] sm:p-7"
            aria-label={perspective === "shared" ? "친구의 취향 프로필" : "나의 취향 프로필"}
          >
            <h2 className="flex items-center gap-3 text-xl font-black text-foreground sm:text-2xl">
              <span aria-hidden="true" className="text-violet-700">
                ▥
              </span>
              {perspective === "shared" ? "친구의 취향 프로필" : "당신의 취향 프로필"}
            </h2>
            <div className="mt-4 grid items-center gap-5 sm:grid-cols-[0.9fr_1.1fr]">
              <TasteRadarChart dimensions={profile.dimensions} />
              <dl className="space-y-4 sm:border-l sm:border-border sm:pl-7">
                {profile.dimensions.map(({ dimension, score }) => (
                  <div key={dimension} className="grid grid-cols-[3.5rem_1fr_2rem] items-center gap-3">
                    <dt className="text-sm font-semibold text-foreground">{DIMENSION_LABELS[dimension]}</dt>
                    <dd className="contents">
                      <div
                        className="h-2 overflow-hidden rounded-full bg-border"
                        role="meter"
                        aria-label={`${DIMENSION_LABELS[dimension]} ${score}점`}
                        aria-valuemin={1}
                        aria-valuemax={5}
                        aria-valuenow={score}
                      >
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(score / 5) * 100}%` }} />
                      </div>
                      <span className="text-right text-sm font-bold tabular-nums text-foreground">{score}/5</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        ) : null}

        <section
          className="relative flex min-h-72 flex-col justify-center overflow-hidden rounded-[1.75rem] border border-border bg-surface p-7 shadow-[0_14px_40px_rgba(48,35,43,0.07)]"
          aria-labelledby="recommendation-reasons-title"
        >
          <span aria-hidden="true" className="absolute left-5 top-5 text-3xl text-lime">
            ✦
          </span>
          <p className="mx-auto w-fit -rotate-3 rounded-lg border border-lime bg-lime/70 px-4 py-2 text-sm font-black text-plum">바텐더의 한마디!</p>
          <h2 id="recommendation-reasons-title" className="sr-only">
            이 칵테일이 어울리는 이유
          </h2>
          <p className="mx-auto mt-6 max-w-sm text-center text-base font-bold leading-8 text-foreground">
            “가볍게 첫 모금을 즐기고, 천천히 이어지는 풍미를 느껴보세요. 오늘의 취향에 딱 맞는 한 잔이에요!”
          </p>
          <span aria-hidden="true" className="mx-auto mt-5 h-1.5 w-24 -rotate-2 rounded-full bg-lime" />
        </section>
      </div>

      <section className="mt-6 rounded-[1.5rem] border border-lime/60 bg-lime/15 px-6 py-5 lg:py-4" aria-label="취향 포인트">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <h2 className="shrink-0 text-base font-black text-foreground">
            <span aria-hidden="true">💡 </span>취향 포인트
          </h2>
          <span aria-hidden="true" className="hidden h-7 w-px bg-border lg:block" />
          <div className="min-w-0 flex-1 [&_ul]:grid [&_ul]:gap-3 [&_ul]:lg:grid-cols-3 [&_li]:text-foreground">
            {item.reasons.length > 0 ? <RecommendationReasons reasons={item.reasons} /> : <p className="text-sm text-muted-foreground">당신의 취향과 가장 가까운 특징을 가진 칵테일이에요.</p>}
          </div>
        </div>
      </section>

      <section className="sr-only" aria-labelledby="cocktail-taste-title">
        <h2 id="cocktail-taste-title">이 한 잔의 맛</h2>
        {Object.entries(cocktail.dimensions).map(([dimension, score]) => (
          <div key={dimension}>
            <div role="meter" aria-label={`${DIMENSION_LABELS[dimension as keyof typeof DIMENSION_LABELS]} ${score}점`} aria-valuemin={1} aria-valuemax={5} aria-valuenow={score} />
            <span>{SCORE_LABELS[score]}</span>
          </div>
        ))}
      </section>
    </article>
  );
}
