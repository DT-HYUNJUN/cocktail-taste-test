"use client";

import type { SharedResultResponse } from "@cocktail-taste-test/contracts";
import Link from "next/link";
import { useEffect, useState } from "react";

import { loadSharedResult } from "../api/shared-results";
import { RecommendationCard } from "./recommendation-card";
import { ResultState } from "./result-state";
import { TasteProfile } from "./taste-profile";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; shared: SharedResultResponse }
  | { status: "not-found" | "unavailable" };

export function SharedRecommendationResult({ id }: { id: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    loadSharedResult(id)
      .then((shared) => {
        if (active) setState({ status: "ready", shared });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ status: error instanceof Error && error.message === "not-found" ? "not-found" : "unavailable" });
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (state.status === "loading") {
    return <ResultState eyebrow="OPENING THE INVITE" title="친구의 한 잔을 여는 중이에요" description="공유된 취향과 추천 칵테일을 불러오고 있어요." icon="🍸" busy />;
  }

  if (state.status !== "ready") {
    return <ResultState eyebrow={state.status === "not-found" ? "THE ICE HAS MELTED" : "A SMALL SPILL"} title={state.status === "not-found" ? "공유 결과를 찾을 수 없어요" : "공유 결과를 불러오지 못했어요"} description={state.status === "not-found" ? "링크가 만료되었거나 올바르지 않은 것 같아요. 대신 나만의 한 잔을 찾아볼까요?" : "잠시 후 다시 시도하거나, 기다리는 동안 나만의 취향 테스트를 시작해 보세요."} icon={state.status === "not-found" ? "🧊" : "💧"} action={{ href: "/test", label: "나도 테스트하기" }} />;
  }

  const { result } = state.shared;
  const recommendation = result.recommendations[0];

  return (
    <div className="relative mx-auto w-full max-w-6xl overflow-hidden px-5 pb-8 pt-4 sm:px-8 sm:pb-12 sm:pt-6 lg:pb-12 lg:pt-6">
      <div aria-hidden="true" className="absolute top-10 -left-20 size-40 rounded-full bg-lilac/35 blur-3xl" />
      <div aria-hidden="true" className="absolute top-[34rem] -right-16 size-36 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-24 -left-20 size-44 rounded-full bg-lime/30 blur-3xl" />

      {!recommendation ? <header className="relative max-w-3xl">
        <p className="text-xs font-bold tracking-[0.16em] text-[#B74716]">SHARED TASTE RESULT</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">친구의 한 잔, 슬쩍 구경할까요?</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">추천 칵테일과 취향 프로필을 확인하고, 다음 잔의 주인공도 되어 보세요.</p>
      </header> : null}

      <section className={`relative ${recommendation ? "mt-0" : "mt-10"}`} aria-label="친구의 추천 칵테일">
        {recommendation ? <RecommendationCard item={recommendation} profile={result.profile} perspective="shared" /> : <p className="rounded-card border border-border bg-surface p-8 text-center">추천 칵테일 없이 취향 프로필만 공유된 결과예요.</p>}
      </section>

      {!recommendation ? (
        <section className="relative mx-auto mt-10 max-w-4xl lg:max-w-6xl" aria-label="친구의 취향 분석">
          <TasteProfile profile={result.profile} perspective="shared" />
        </section>
      ) : null}

      <section className="relative mx-auto mt-10 max-w-4xl rounded-card border border-primary/25 bg-primary/10 p-6 text-center sm:p-8 lg:max-w-6xl">
        <p className="text-xs font-bold tracking-[0.14em] text-accent-foreground">YOUR TURN</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground">그럼, 내 잔에는 뭐가 담길까요?</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">8가지 질문에 답하고 나만의 취향 프로필과 추천 칵테일을 확인해 보세요.</p>
        <Link href="/test" className="mt-6 inline-flex rounded-button bg-primary px-8 py-4 text-base font-bold text-primary-foreground">나도 테스트하기</Link>
      </section>
    </div>
  );
}
