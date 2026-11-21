"use client";

import type { CreateRecommendationRequest, RecommendationResponse } from "@cocktail-taste-test/contracts";
import { useRef, useState } from "react";

import { createSharedResult } from "../api/shared-results";
import { createResultImage } from "../lib/create-result-image";
import { DIMENSION_LABELS, getCocktailDisplayName, SCORE_LABELS } from "./result-labels";

type ShareResultProps = {
  result: RecommendationResponse;
  answers: CreateRecommendationRequest["answers"] | null;
  variant?: "default" | "hero";
};

type ShareStatus = "idle" | "shared" | "copied" | "failed";
type SaveStatus = "idle" | "saved" | "failed";

function Share2Icon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98" />
      <path d="m15.41 6.51-6.82 3.98" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function createShareText(result: RecommendationResponse) {
  const recommendation = result.recommendations[0];
  const cocktailLine = recommendation ? `추천 칵테일: ${getCocktailDisplayName(recommendation.cocktail.id, recommendation.cocktail.name)}` : "나만의 칵테일 취향 프로필을 완성했어요.";
  const topDimensions = [...result.profile.dimensions]
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ dimension, score }) => `${DIMENSION_LABELS[dimension]} ${SCORE_LABELS[score]}`)
    .join(" · ");

  return ["나의 칵테일 취향 테스트 결과 🍸", cocktailLine, topDimensions ? `주요 취향: ${topDimensions}` : null, "내 결과를 확인하고, 너에게 어울리는 칵테일도 찾아봐!"].filter(Boolean).join("\n");
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Copy failed");
}

export function ShareResult({ result, answers, variant = "default" }: ShareResultProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [isSharing, setIsSharing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);
  const sharedUrlRef = useRef<string | null>(null);

  const share = async () => {
    const text = createShareText(result);

    setIsSharing(true);
    setStatus("idle");

    try {
      if (answers === null) throw new Error("Assessment answers are unavailable");
      if (sharedUrlRef.current === null) {
        const { shareId } = await createSharedResult({ answers });
        sharedUrlRef.current = new URL(`/results/${shareId}`, window.location.origin).toString();
      }
      const url = sharedUrlRef.current;

      if (navigator.share) {
        await navigator.share({ title: "칵테일 취향 테스트 결과", text, url });
        setStatus("shared");
        return;
      }

      await copyText(`${text}\n${url}`);
      setStatus("copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      setStatus("failed");
    } finally {
      setIsSharing(false);
    }
  };

  const saveImage = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const { blob, fileName } = await createResultImage(result);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("failed");
    } finally {
      setIsSaving(false);
    }
  };

  const statusMessage = {
    idle: null,
    shared: "결과를 공유했어요.",
    copied: "공유 문구와 링크를 복사했어요.",
    failed: "공유하지 못했어요. 잠시 후 다시 시도해 주세요.",
  }[status];

  return (
    <section className="flex flex-col items-end" aria-labelledby="share-result-title">
      <h2 id="share-result-title" className="sr-only">
        결과 공유 및 저장
      </h2>

      <div className={variant === "hero" ? "flex flex-row gap-3" : "flex flex-col gap-3 sm:flex-row"}>
        <button
          type="button"
          onClick={share}
          disabled={isSharing || isSaving}
          className={
            variant === "hero"
              ? "flex size-10 items-center justify-center rounded-full border border-plum/20 bg-surface/80 text-plum transition hover:border-primary/45 hover:bg-surface disabled:opacity-60"
              : "flex w-full items-center justify-center gap-2 rounded-button bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_5px_0_var(--primary-shadow)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-auto"
          }
          aria-label="친구에게 공유"
        >
          <Share2Icon />
          {variant === "hero" ? null : isSharing ? "공유 준비 중…" : "친구에게 공유"}
        </button>

        <button
          type="button"
          onClick={saveImage}
          disabled={isSharing || isSaving}
          className={
            variant === "hero"
              ? "flex size-10 items-center justify-center rounded-full border border-plum/20 bg-surface/80 text-plum transition hover:border-primary/45 hover:bg-surface disabled:opacity-60"
              : "flex w-full items-center justify-center gap-2 rounded-button border border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/45 active:translate-y-0 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-auto"
          }
          aria-label="이미지 저장"
        >
          <DownloadIcon />
          {variant === "hero" ? null : isSaving ? "이미지 만드는 중…" : "이미지 저장"}
        </button>
      </div>

      {statusMessage ? (
        <p className={`mt-3 text-sm font-medium ${status === "failed" ? "text-red-700" : "text-[#A94417]"}`} role={status === "failed" ? "alert" : "status"}>
          {statusMessage}
        </p>
      ) : null}

      {saveStatus !== "idle" ? (
        <p className={`mt-3 text-sm font-medium ${saveStatus === "failed" ? "text-red-700" : "text-[#A94417]"}`} role={saveStatus === "failed" ? "alert" : "status"}>
          {saveStatus === "saved" ? "결과 이미지를 저장했어요." : "이미지를 만들지 못했어요. 잠시 후 다시 시도해 주세요."}
        </p>
      ) : null}
    </section>
  );
}
