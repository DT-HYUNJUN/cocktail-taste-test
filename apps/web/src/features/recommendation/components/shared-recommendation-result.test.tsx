import type { SharedResultResponse } from "@cocktail-taste-test/contracts";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SharedRecommendationResult } from "./shared-recommendation-result";

const loadSharedResultMock = vi.hoisted(() => vi.fn());

vi.mock("../api/shared-results", () => ({ loadSharedResult: loadSharedResultMock }));

const shared: SharedResultResponse = {
  result: {
    profile: {
      dimensions: [{ dimension: "sweet", score: 3 }],
      preferredFlavors: [],
      avoidedFlavors: [],
      preferredBaseSpirits: [],
    },
    recommendations: [],
  },
  createdAt: "2026-11-17T00:00:00.000Z",
  expiresAt: "2026-12-17T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  loadSharedResultMock.mockReset();
});

describe("SharedRecommendationResult", () => {
  it("shows a friend's result and a test CTA", async () => {
    loadSharedResultMock.mockResolvedValue(shared);
    render(<SharedRecommendationResult id="abcdefghijklmnopqrstuv" />);

    expect(await screen.findByRole("heading", { name: "친구의 칵테일 취향 결과예요" })).not.toBeNull();
    expect(screen.getByRole("region", { name: "친구의 취향 프로필" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "나도 테스트하기" }).getAttribute("href")).toBe("/test");
  });

  it("shows an expired-link message without hiding the test CTA", async () => {
    loadSharedResultMock.mockRejectedValue(new Error("not-found"));
    render(<SharedRecommendationResult id="abcdefghijklmnopqrstuv" />);

    expect(await screen.findByRole("heading", { name: "공유 결과를 찾을 수 없어요" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "나도 테스트하기" }).getAttribute("href")).toBe("/test");
  });
});
