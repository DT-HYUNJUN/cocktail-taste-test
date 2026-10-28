import type { RecommendationItem, RecommendationResponse } from "@cocktail-taste-test/contracts";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAssessmentStore } from "../../assessment/model/assessment-store";
import { clearRecommendationResult, loadRecommendationResult, saveRecommendationResult } from "../model/result-snapshot";
import { RecommendationResult } from "./recommendation-result";

const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

function createRecommendation(id: string, rank: number, reasons: RecommendationItem["reasons"] = []): RecommendationItem {
  return {
    rank,
    cocktail: {
      id,
      name: `Cocktail ${id}`,
      imageUrl: null,
      dimensions: {
        sweet: 3,
        sour: 4,
        bitter: 2,
        alcoholIntensity: 3,
        refreshing: 5,
      },
      flavors: ["citrus"],
      baseSpirits: ["gin"],
    },
    reasons,
  };
}

function createResult(): RecommendationResponse {
  return {
    profile: {
      dimensions: [
        { dimension: "sweet", score: 2 },
        { dimension: "refreshing", score: 4 },
      ],
      preferredFlavors: ["citrus"],
      avoidedFlavors: ["smoky"],
      preferredBaseSpirits: ["gin"],
    },
    recommendations: [
      createRecommendation("first", 1, [
        {
          type: "core-match",
          dimensions: ["sweet", "refreshing"],
        },
        {
          type: "flavor-match",
          flavors: ["citrus"],
        },
        {
          type: "base-spirit-match",
          baseSpirits: ["gin"],
        },
      ]),
      createRecommendation("second", 2),
      createRecommendation("third", 3),
      createRecommendation("fourth", 4),
      createRecommendation("fifth", 5),
    ],
  };
}

beforeEach(() => {
  sessionStorage.clear();
  clearRecommendationResult();
  pushMock.mockClear();

  useAssessmentStore.setState({
    currentIndex: 7,
    answers: { sweet: "medium" },
    hasHydrated: true,
  });
});

afterEach(cleanup);

describe("RecommendationResult", () => {
  it("displays only the first API recommendation", async () => {
    const result = createResult();

    saveRecommendationResult(result);
    render(<RecommendationResult />);

    expect(
      await screen.findByRole("heading", {
        name: "당신을 위한 한 잔을 찾았어요!",
      }),
    ).toBeVisible();

    const cards = screen.getAllByRole("article");

    // UI 정책: 추천 데이터는 여러 개여도 한 개만 표시한다.
    expect(cards).toHaveLength(1);

    expect(cards[0]).toHaveTextContent(result.recommendations[0].cocktail.name);

    // 후순위 추천은 화면에 노출하지 않는다.
    for (const item of result.recommendations.slice(1)) {
      expect(screen.queryByText(item.cocktail.name)).not.toBeInTheDocument();
    }
  });

  it("displays the user's taste profile", async () => {
    saveRecommendationResult(createResult());
    render(<RecommendationResult />);

    const profile = await screen.findByRole("region", {
      name: "나의 취향 프로필",
    });

    expect(profile).toBeVisible();

    // 응답한 취향 차원이 표시되는지 확인
    expect(within(profile).getAllByText("단맛").length).toBeGreaterThan(0);
    expect(within(profile).getAllByText("청량감").length).toBeGreaterThan(0);

    // 응답하지 않은 취향 차원은 표시하지 않는다.
    expect(within(profile).queryByText("산미")).not.toBeInTheDocument();
  });

  it("displays recommendation reasons for the selected cocktail", async () => {
    saveRecommendationResult(createResult());
    render(<RecommendationResult />);

    const card = await screen.findByRole("article");

    expect(
      within(card).getByRole("heading", {
        name: "이 칵테일이 어울리는 이유",
      }),
    ).toBeVisible();

    expect(within(card).getByText("선호하는 단맛·청량감과 잘 어울려요")).toBeVisible();
  });

  it("handles an empty recommendation list", async () => {
    const result = createResult();

    saveRecommendationResult({
      ...result,
      recommendations: [],
    });

    render(<RecommendationResult />);

    expect(
      await screen.findByRole("heading", {
        name: "취향 분석을 완료했어요!",
      }),
    ).toBeVisible();

    expect(screen.getByText("아직 추천할 수 있는 칵테일이 없어요")).toBeVisible();

    expect(
      screen.getByRole("region", {
        name: "나의 취향 프로필",
      }),
    ).toBeVisible();

    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows guidance when no saved result exists", async () => {
    render(<RecommendationResult />);

    expect(
      await screen.findByRole("heading", {
        name: "저장된 추천 결과가 없어요",
      }),
    ).toBeVisible();

    expect(
      screen.getByRole("link", {
        name: "취향 테스트로 이동",
      }),
    ).toHaveAttribute("href", "/test");
  });

  it("clears result and assessment state before restarting", async () => {
    saveRecommendationResult(createResult());
    render(<RecommendationResult />);

    fireEvent.click(
      await screen.findByRole("button", {
        name: "취향 테스트 다시 하기",
      }),
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/test");
    });

    expect(useAssessmentStore.getState().currentIndex).toBe(0);
    expect(useAssessmentStore.getState().answers).toEqual({});
    expect(loadRecommendationResult()).toBeNull();
  });
});
