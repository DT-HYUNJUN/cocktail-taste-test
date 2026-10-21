"use client";

import type { RecommendationResponse } from "@cocktail-taste-test/contracts";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAssessmentStore } from "../../assessment/model/assessment-store";
import { clearRecommendationResult, loadRecommendationResult } from "../model/result-snapshot";
import { RecommendationCard } from "./recommendation-card";
import { TasteProfile } from "./taste-profile";

export function RecommendationResult() {
  const router = useRouter();
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [hasRecovered, setHasRecovered] = useState(false);

  useEffect(() => {
    let active = true;
    const recovered = loadRecommendationResult();
    queueMicrotask(() => {
      if (!active) return;
      setResult(recovered);
      setHasRecovered(true);
    });
    return () => { active = false; };
  }, []);

  const restart = () => {
    useAssessmentStore.getState().resetAssessment();
    clearRecommendationResult();
    router.push("/test");
  };

  if (!hasRecovered) {
    return <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5" aria-busy="true" aria-live="polite">추천 결과를 불러오는 중입니다.</section>;
  }

  if (result === null) {
    return (
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 text-center">
        <h1 className="text-3xl font-semibold text-stone-950">저장된 추천 결과가 없어요</h1>
        <p className="mt-4 leading-7 text-stone-600">취향 테스트를 완료하면 이곳에서 추천 결과를 확인할 수 있습니다.</p>
        <Link href="/test" className="mt-8 rounded-lg bg-stone-950 px-5 py-3 font-medium text-white">취향 테스트로 이동</Link>
      </section>
    );
  }

  const recommendations = result.recommendations.slice(0, 5);
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <header>
        <p className="text-sm font-semibold text-amber-800">Cocktail Taste Test</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">당신의 칵테일 취향 결과</h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-600">응답에서 확인된 취향과 추천 칵테일을 정리했어요. 추천 순서는 화면 표시를 위한 순서이며 절대적인 우열을 뜻하지 않습니다.</p>
      </header>
      <div className="mt-8"><TasteProfile profile={result.profile} /></div>
      <section className="mt-10" aria-labelledby="recommendations-title">
        <h2 id="recommendations-title" className="text-2xl font-semibold text-stone-950">추천 칵테일</h2>
        {recommendations.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <h3 className="text-xl font-semibold text-stone-950">현재 추천할 수 있는 칵테일이 없어요</h3>
            <p className="mt-3 text-stone-600">취향 프로필은 정상적으로 생성되었습니다. 추천 가능한 칵테일이 준비되면 결과를 확인할 수 있어요.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-6">{recommendations.map((item) => <RecommendationCard key={item.cocktail.id} item={item} />)}</div>
        )}
      </section>
      <div className="mt-10 flex justify-center"><button type="button" onClick={restart} className="rounded-lg bg-stone-950 px-6 py-3 font-medium text-white">다시 테스트하기</button></div>
    </div>
  );
}
