"use client";

import type { RecommendationResponse } from "@cocktail-taste-test/contracts";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hydrateAssessmentStore, useAssessmentStore } from "../../assessment/model/assessment-store";
import { serializeAssessmentAnswers } from "../../assessment/model/answers";
import { clearRecommendationResult, loadRecommendationResult } from "../model/result-snapshot";
import { RecommendationCard } from "./recommendation-card";
import { ResultState } from "./result-state";
import { ShareResult } from "./share-result";
import { TasteProfile } from "./taste-profile";

export function RecommendationResult() {
  const router = useRouter();
  const assessmentAnswers = useAssessmentStore((state) => state.answers);
  const assessmentHasHydrated = useAssessmentStore((state) => state.hasHydrated);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [hasRecovered, setHasRecovered] = useState(false);

  useEffect(() => {
    if (!assessmentHasHydrated) void hydrateAssessmentStore();
  }, [assessmentHasHydrated]);

  useEffect(() => {
    let active = true;

    const recovered = loadRecommendationResult();

    queueMicrotask(() => {
      if (!active) return;

      setResult(recovered);
      setHasRecovered(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const restart = () => {
    useAssessmentStore.getState().resetAssessment();
    clearRecommendationResult();
    router.push("/test");
  };

  if (!hasRecovered) {
    return <ResultState eyebrow="POURING YOUR RESULT" title="결과를 잔에 담는 중이에요" description="당신의 취향과 추천 칵테일을 불러오고 있어요." icon="🍸" busy />;
  }

  if (result === null) {
    return <ResultState eyebrow="EMPTY GLASS" title="저장된 추천 결과가 없어요" description="취향 테스트를 완료하면 당신에게 꼭 맞는 한 잔을 이곳에서 확인할 수 있어요." icon="🥃" action={{ href: "/test", label: "취향 테스트로 이동" }} />;
  }

  const recommendation = result.recommendations[0];

  return (
    <div className="relative mx-auto w-full max-w-6xl overflow-hidden px-5 pb-8 pt-4 sm:px-8 sm:pb-12 sm:pt-6 lg:pb-12 lg:pt-6">
      <div aria-hidden="true" className="absolute top-10 -left-20 size-40 rounded-full bg-lilac/35 blur-3xl" />
      <div aria-hidden="true" className="absolute top-[34rem] -right-16 size-36 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-24 -left-20 size-44 rounded-full bg-lime/30 blur-3xl" />

      {!recommendation ? (
        <header className="relative max-w-3xl">
          <p className="text-xs font-bold tracking-[0.16em] text-[#B74716]">{recommendation ? "YOUR PERFECT SIP" : "YOUR TASTE RESULT"}</p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">{recommendation ? "찾았다, 당신의 한 잔!" : "당신의 취향을 찾았어요!"}</h1>

          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            {recommendation ? "여덟 번의 선택 끝에 도착한 한 잔이에요. 꽤 근사한 취향을 가지고 계시네요." : "8개의 질문으로 알아본 당신의 취향을 아래에서 확인해 보세요."}
          </p>
        </header>
      ) : null}

      <section className={`relative ${recommendation ? "mt-0" : "mt-10"}`} aria-labelledby="recommendations-title">
        {recommendation ? (
          <RecommendationCard
            item={recommendation}
            profile={result.profile}
            actions={<ShareResult result={result} answers={serializeAssessmentAnswers(assessmentAnswers)} variant="hero" />}
          />
        ) : (
          <div className="relative overflow-hidden rounded-card border border-primary/20 bg-primary/5 p-8 text-center shadow-[0_14px_40px_rgba(48,35,43,0.06)]">
            <span aria-hidden="true" className="absolute -right-5 -top-7 text-8xl text-lime/55">✦</span>
            <span aria-hidden="true" className="text-4xl">🍹</span>
            <h3 className="mt-4 text-xl font-bold text-foreground">아직 추천할 수 있는 칵테일이 없어요</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">취향 분석은 잘 끝났어요. 아래에서 나의 취향 프로필을 먼저 확인해 보세요.</p>
          </div>
        )}
      </section>

      {!recommendation ? (
        <section className="relative mx-auto mt-10 max-w-4xl lg:max-w-6xl" aria-label="나의 취향 분석">
          <TasteProfile profile={result.profile} />
        </section>
      ) : null}

      <div className="relative mx-auto mt-10 flex max-w-4xl justify-center lg:max-w-6xl">
        <button
          type="button"
          onClick={restart}
          className="
            min-h-14 w-full rounded-button
            border border-transparent bg-primary px-8 py-3.5
            text-base font-bold text-primary-foreground
            shadow-[0_8px_0_var(--primary-shadow)]
            transition-transform duration-200
            hover:-translate-y-0.5
            active:translate-y-1 active:shadow-[0_4px_0_var(--primary-shadow)]
            focus-visible:outline-2
            focus-visible:outline-offset-4
            focus-visible:outline-foreground
            sm:w-auto sm:min-w-56
            motion-reduce:transition-none motion-reduce:hover:translate-y-0
          "
        >
          취향 테스트 다시 하기
        </button>
      </div>
    </div>
  );
}
