"use client";

import type { SharedResultResponse } from "@cocktail-taste-test/contracts";
import Link from "next/link";
import { useEffect, useState } from "react";

import { loadSharedResult } from "../api/shared-results";
import { RecommendationCard } from "./recommendation-card";
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
    return <section className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5" aria-busy="true">공유 결과를 불러오는 중입니다.</section>;
  }

  if (state.status !== "ready") {
    return (
      <section className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 text-center">
        <h1 className="text-3xl font-bold text-foreground">{state.status === "not-found" ? "공유 결과를 찾을 수 없어요" : "공유 결과를 불러오지 못했어요"}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{state.status === "not-found" ? "링크가 만료되었거나 올바르지 않을 수 있어요." : "잠시 후 다시 시도하거나 나만의 테스트를 시작해 보세요."}</p>
        <Link href="/test" className="mt-8 rounded-full bg-primary px-7 py-3.5 font-bold text-primary-foreground">나도 테스트하기</Link>
      </section>
    );
  }

  const { result } = state.shared;
  const recommendation = result.recommendations[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <header>
        <p className="text-xs font-bold tracking-[0.16em] text-[#B74716]">SHARED TASTE RESULT</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">친구의 칵테일 취향 결과예요</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">추천 칵테일과 취향 프로필을 확인하고, 나에게 어울리는 한 잔도 찾아보세요.</p>
      </header>

      <section className="mt-10" aria-label="친구의 추천 칵테일">
        {recommendation ? <RecommendationCard item={recommendation} /> : <p className="rounded-card border border-border bg-surface p-8 text-center">추천 칵테일 없이 취향 프로필만 공유된 결과예요.</p>}
      </section>

      <section className="mt-12" aria-label="친구의 취향 분석">
        <TasteProfile profile={result.profile} perspective="shared" />
      </section>

      <section className="mt-10 rounded-card border border-[#F1D8C8] bg-[#FFF7F1] p-6 text-center sm:p-8">
        <h2 className="text-2xl font-bold text-foreground">나에게 어울리는 칵테일은 뭘까요?</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">8가지 질문에 답하고 나만의 취향 프로필과 추천 칵테일을 확인해 보세요.</p>
        <Link href="/test" className="mt-6 inline-flex rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground">나도 테스트하기</Link>
      </section>
    </div>
  );
}
