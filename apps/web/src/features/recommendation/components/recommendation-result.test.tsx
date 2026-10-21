import type { RecommendationItem, RecommendationResponse } from "@cocktail-taste-test/contracts";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAssessmentStore } from "../../assessment/model/assessment-store";
import { clearRecommendationResult, loadRecommendationResult, saveRecommendationResult } from "../model/result-snapshot";
import { RecommendationResult } from "./recommendation-result";

const pushMock = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

const cocktail = (id: string, rank: number, reasons: RecommendationItem["reasons"] = []): RecommendationItem => ({
  rank,
  cocktail: {
    id, name: `Cocktail ${id}`, imageUrl: rank === 1 ? "https://example.com/cocktail.jpg" : null,
    dimensions: { sweet: 3, sour: 4, bitter: 2, alcoholIntensity: 3, refreshing: 5 },
    flavors: ["citrus"], baseSpirits: ["gin"],
  },
  reasons,
});

const result: RecommendationResponse = {
  profile: {
    dimensions: [{ dimension: "sweet", score: 2 }, { dimension: "refreshing", score: 4 }],
    preferredFlavors: ["citrus"], avoidedFlavors: ["smoky"], preferredBaseSpirits: ["gin"],
  },
  recommendations: [
    cocktail("z-first", 1, [
      { type: "core-match", dimensions: ["sweet", "refreshing"] },
      { type: "flavor-match", flavors: ["citrus"] },
      { type: "base-spirit-match", baseSpirits: ["gin"] },
    ]),
    cocktail("a-second", 2), cocktail("third", 3), cocktail("fourth", 4), cocktail("fifth", 5), cocktail("sixth", 6),
  ],
};

beforeEach(() => {
  sessionStorage.clear();
  clearRecommendationResult();
  pushMock.mockClear();
  useAssessmentStore.setState({ currentIndex: 7, answers: { sweet: "medium" }, hasHydrated: true });
});
afterEach(cleanup);

describe("RecommendationResult", () => {
  it("renders known profile evidence, at most five API-ordered cards, and all reason types", async () => {
    saveRecommendationResult(result);
    render(<RecommendationResult />);
    expect(await screen.findByRole("heading", { name: "당신의 칵테일 취향 결과" })).toBeVisible();
    expect(screen.getByText("낮음 · 2/5")).toBeVisible();
    expect(screen.getByText("높음 · 4/5")).toBeVisible();
    expect(within(screen.getByRole("region", { name: "나의 취향 프로필" })).queryByText("산미")).not.toBeInTheDocument();
    const cards = screen.getAllByRole("article");
    expect(cards).toHaveLength(5);
    expect(cards[0]).toHaveTextContent("Cocktail z-first");
    expect(cards[1]).toHaveTextContent("Cocktail a-second");
    expect(screen.queryByText("Cocktail sixth")).not.toBeInTheDocument();
    expect(screen.getByText("선호하는 단맛·청량감과 잘 어울려요")).toBeVisible();
    expect(screen.getByText("좋아하는 시트러스 풍미가 있어요")).toBeVisible();
    expect(screen.getByText("선호하는 진 베이스 칵테일이에요")).toBeVisible();
    expect(screen.getAllByText("표시할 추천 이유가 없습니다.").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Cocktail a-second 이미지 없음" })).toBeVisible();
  });

  it("treats an empty recommendation list as a normal result", async () => {
    saveRecommendationResult({ ...result, recommendations: [] });
    render(<RecommendationResult />);
    expect(await screen.findByText("현재 추천할 수 있는 칵테일이 없어요")).toBeVisible();
    expect(screen.getByRole("heading", { name: "나의 취향 프로필" })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows guidance when opened without a result", async () => {
    render(<RecommendationResult />);
    expect(await screen.findByRole("heading", { name: "저장된 추천 결과가 없어요" })).toBeVisible();
    expect(screen.getByRole("link", { name: "취향 테스트로 이동" })).toHaveAttribute("href", "/test");
  });

  it("clears result and assessment state before starting again", async () => {
    saveRecommendationResult(result);
    render(<RecommendationResult />);
    fireEvent.click(await screen.findByRole("button", { name: "다시 테스트하기" }));
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/test"));
    expect(useAssessmentStore.getState().currentIndex).toBe(0);
    expect(useAssessmentStore.getState().answers).toEqual({});
    expect(loadRecommendationResult()).toBeNull();
  });
});
