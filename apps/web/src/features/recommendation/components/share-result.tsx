"use client";

import type { RecommendationResponse } from "@cocktail-taste-test/contracts";
import { useState } from "react";

import { createResultImage } from "../lib/create-result-image";
import { DIMENSION_LABELS, getCocktailDisplayName, SCORE_LABELS } from "./result-labels";

type ShareResultProps = {
  result: RecommendationResponse;
};

type ShareStatus = "idle" | "shared" | "copied" | "failed";
type SaveStatus = "idle" | "saved" | "failed";

function createShareText(result: RecommendationResponse) {
  const recommendation = result.recommendations[0];
  const cocktailLine = recommendation
    ? `추천 칵테일: ${getCocktailDisplayName(recommendation.cocktail.id, recommendation.cocktail.name)}`
    : "나만의 칵테일 취향 프로필을 완성했어요.";
  const topDimensions = [...result.profile.dimensions]
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ dimension, score }) => `${DIMENSION_LABELS[dimension]} ${SCORE_LABELS[score]}`)
    .join(" · ");

  return ["나의 칵테일 취향 테스트 결과 🍸", cocktailLine, topDimensions ? `주요 취향: ${topDimensions}` : null, "너에게 어울리는 칵테일도 확인해 봐!"].filter(Boolean).join("\n");
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

export function ShareResult({ result }: ShareResultProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const [isSharing, setIsSharing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSaving, setIsSaving] = useState(false);

  const share = async () => {
    const url = new URL("/", window.location.origin).toString();
    const text = createShareText(result);

    setIsSharing(true);
    setStatus("idle");

    try {
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
    <section className="rounded-card border border-[#F1D8C8] bg-[#FFF7F1] p-6 text-center sm:p-8" aria-labelledby="share-result-title">
      <p className="text-xs font-bold tracking-[0.14em] text-[#B74716]">SHARE YOUR RESULT</p>
      <h2 id="share-result-title" className="mt-2 text-xl font-bold text-foreground sm:text-2xl">
        이 결과를 친구에게 공유해 보세요
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">내 추천 칵테일과 주요 취향을 보내고, 친구에게도 어울리는 한 잔을 찾아보라고 알려주세요.</p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={share}
          disabled={isSharing || isSaving}
          className="w-full rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground transition-all duration-200 hover:brightness-95 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:w-auto sm:min-w-64"
        >
          {isSharing ? "공유 준비 중…" : "결과 친구에게 공유하기"}
        </button>

        <button
          type="button"
          onClick={saveImage}
          disabled={isSharing || isSaving}
          className="w-full rounded-full border border-[#E0BCA5] bg-white px-8 py-4 text-base font-bold text-[#A94417] transition-all duration-200 hover:bg-[#FFF0E6] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B74716] sm:w-auto sm:min-w-64"
        >
          {isSaving ? "이미지 만드는 중…" : "결과 이미지 저장하기"}
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
