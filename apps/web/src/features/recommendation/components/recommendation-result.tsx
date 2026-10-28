"use client";

import type { RecommendationResponse } from "@cocktail-taste-test/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAssessmentStore } from "../../assessment/model/assessment-store";
import { clearRecommendationResult, loadRecommendationResult } from "../model/result-snapshot";
import { RecommendationCard } from "./recommendation-card";
import { TasteProfile } from "./taste-profile";
import { createMockRecommendationResponse } from "../model/mock-recommendation";

export function RecommendationResult() {
  const router = useRouter();
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [hasRecovered, setHasRecovered] = useState(false);

  // useEffect(() => {
  //   let active = true;
  //   const recovered = loadRecommendationResult();
  //   queueMicrotask(() => {
  //     if (!active) return;
  //     setResult(recovered);
  //     setHasRecovered(true);
  //   });
  //   return () => {
  //     active = false;
  //   };
  // }, []);

  useEffect(() => {
    let active = true;

    const recovered = loadRecommendationResult();

    const useMock = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_MOCK_RECOMMENDATIONS === "true" && recovered !== null && recovered.recommendations.length === 0;

    const displayResult = useMock ? createMockRecommendationResponse(recovered.profile) : recovered;

    queueMicrotask(() => {
      if (!active) return;

      setResult(displayResult);
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
    return (
      <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5" aria-busy="true" aria-live="polite">
        추천 결과를 불러오는 중입니다.
      </section>
    );
  }

  if (result === null) {
    return (
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 text-center">
        <h1 className="text-3xl font-semibold text-stone-950">저장된 추천 결과가 없어요</h1>
        <p className="mt-4 leading-7 text-stone-600">취향 테스트를 완료하면 이곳에서 추천 결과를 확인할 수 있습니다.</p>
        <Link href="/test" className="mt-8 rounded-lg bg-stone-950 px-5 py-3 font-medium text-white">
          취향 테스트로 이동
        </Link>
      </section>
    );
  }

  const recommendation = result.recommendations[0];

  const isMockResult = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_MOCK_RECOMMENDATIONS === "true" && recommendation?.cocktail.id.startsWith("mock-") === true;

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <header>
        <p className="text-xs font-bold tracking-[0.16em] text-[#B74716]">{recommendation ? "YOUR PERFECT SIP" : "YOUR TASTE RESULT"}</p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{recommendation ? "당신을 위한 한 잔을 찾았어요!" : "취향 분석을 완료했어요!"}</h1>

        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
          {recommendation ? "당신의 취향을 담은 특별한 칵테일 한 잔을 소개할게요." : "8개의 질문으로 알아본 당신의 취향을 아래에서 확인해 보세요."}
        </p>
      </header>

      {/* 추천 칵테일 */}
      <section className="mt-10" aria-labelledby="recommendations-title">
        {/* <h2 id="recommendations-title" className="text-2xl font-bold text-foreground">
          {recommendation ? "당신의 칵테일" : "추천 결과"}
        </h2> */}
        {isMockResult && (
          <p className="mt-3 rounded-xl border border-border bg-[#FFF0E6] px-4 py-3 text-sm text-[#A94417]">현재 표시된 칵테일은 UI 개발을 위한 샘플 데이터입니다. 실제 추천 결과가 아닙니다.</p>
        )}
        {/* {recommendation ? (
          <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-semibold text-stone-950">현재 추천할 수 있는 칵테일이 없어요</h3>
            <p className="mt-3 text-stone-600">취향 프로필은 정상적으로 생성되었습니다. 추천 가능한 칵테일이 준비되면 결과를 확인할 수 있어요.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-6">
            {recommendation.map((item) => (
              <RecommendationCard key={item.cocktail.id} item={item} />
            ))}
          </div>
        )} */}
        {recommendation ? (
          <RecommendationCard item={recommendation} />
        ) : (
          <div className="rounded-card border border-border bg-surface p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">아직 추천할 수 있는 칵테일이 없어요</h3>
            <p className="mt-3 text-sm text-muted-foreground">취향 분석은 완료됐어요. 추천 칵테일이 준비되면 이곳에서 확인할 수 있어요.</p>
          </div>
        )}
      </section>

      {/* 취향표 */}
      <section className="mt-12" aria-label="나의 취향 분석">
        <TasteProfile profile={result.profile} />
      </section>

      <div className="mt-10 flex justify-center sm:mt-12">
        <button
          type="button"
          onClick={restart}
          className="
            w-full rounded-full
            bg-primary px-8 py-4
            text-base font-bold text-primary-foreground
            transition-all duration-200
            hover:brightness-95
            active:scale-[0.98]
            focus-visible:outline-2
            focus-visible:outline-offset-4
            focus-visible:outline-primary
            sm:w-auto sm:min-w-56
          "
        >
          취향 테스트 다시 하기
        </button>
      </div>
    </div>
  );
}
