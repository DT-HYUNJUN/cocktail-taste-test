import type { CreateRecommendationRequest, RecommendationResponse } from "@cocktail-taste-test/contracts";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShareResult } from "./share-result";

const createResultImageMock = vi.hoisted(() => vi.fn());
const createSharedResultMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/create-result-image", () => ({
  createResultImage: createResultImageMock,
}));
vi.mock("../api/shared-results", () => ({
  createSharedResult: createSharedResultMock,
}));

const answers: CreateRecommendationRequest["answers"] = [
  { questionId: "sweet", answerId: "low" },
  { questionId: "sour", answerId: "very-high" },
  { questionId: "bitter", answerId: "low" },
  { questionId: "alcohol-intensity", answerId: "medium" },
  { questionId: "refreshing", answerId: "high" },
  { questionId: "preferred-flavors", answerIds: ["citrus"] },
  { questionId: "avoided-flavors", answerIds: [] },
  { questionId: "preferred-base-spirits", answerIds: ["tequila"] },
];

const result: RecommendationResponse = {
  profile: {
    dimensions: [
      { dimension: "sweet", score: 2 },
      { dimension: "sour", score: 5 },
      { dimension: "refreshing", score: 4 },
    ],
    preferredFlavors: ["citrus"],
    avoidedFlavors: [],
    preferredBaseSpirits: ["tequila"],
  },
  recommendations: [
    {
      rank: 1,
      cocktail: {
        id: "margarita",
        name: "Margarita",
        imageUrl: null,
        dimensions: { sweet: 2, sour: 5, bitter: 1, alcoholIntensity: 3, refreshing: 4 },
        flavors: ["citrus"],
        baseSpirits: ["tequila"],
      },
      reasons: [{ type: "core-match", dimensions: ["sour", "refreshing"] }],
    },
  ],
};

beforeEach(() => {
  createSharedResultMock.mockResolvedValue({ shareId: "abcdefghijklmnopqrstuv", expiresAt: "2026-12-17T00:00:00.000Z" });
});

afterEach(() => {
  cleanup();
  createResultImageMock.mockReset();
  createSharedResultMock.mockReset();
});

describe("ShareResult", () => {
  it("opens the native share sheet with a Korean result summary", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });

    render(<ShareResult result={result} answers={[...answers]} />);
    fireEvent.click(screen.getByRole("button", { name: "친구에게 공유" }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));

    expect(share.mock.calls[0]?.[0]).toMatchObject({
      title: "칵테일 취향 테스트 결과",
      url: "http://localhost:3000/results/abcdefghijklmnopqrstuv",
    });
    expect(share.mock.calls[0]?.[0].text).toContain("추천 칵테일: 마가리타");
    expect(share.mock.calls[0]?.[0].text).toContain("주요 취향: 산미 매우 높음 · 청량감 높음 · 단맛 낮음");
  });

  it("copies the result and test link when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<ShareResult result={result} answers={[...answers]} />);
    fireEvent.click(screen.getByRole("button", { name: "친구에게 공유" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));

    expect(writeText.mock.calls[0]?.[0]).toContain("추천 칵테일: 마가리타");
    expect(writeText.mock.calls[0]?.[0]).toContain("http://localhost:3000/results/abcdefghijklmnopqrstuv");
    expect(screen.getByRole("status").textContent).toBe("공유 문구와 링크를 복사했어요.");
  });

  it("downloads a generated PNG result card", async () => {
    const blob = new Blob(["image"], { type: "image/png" });
    const createObjectUrl = vi.fn().mockReturnValue("blob:result-image");
    const revokeObjectUrl = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    createResultImageMock.mockResolvedValue({ blob, fileName: "cocktail-taste-margarita.png" });
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });

    render(<ShareResult result={result} answers={[...answers]} />);
    fireEvent.click(screen.getByRole("button", { name: "이미지 저장" }));

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));

    expect(createResultImageMock).toHaveBeenCalledWith(result);
    expect(createObjectUrl).toHaveBeenCalledWith(blob);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:result-image");
    expect(screen.getByRole("status").textContent).toBe("결과 이미지를 저장했어요.");
    click.mockRestore();
  });
});
