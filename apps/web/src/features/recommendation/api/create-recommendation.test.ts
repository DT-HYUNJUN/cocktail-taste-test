import { afterEach, describe, expect, it, vi } from "vitest";
import type { CreateRecommendationRequest } from "@cocktail-taste-test/contracts";
import { createRecommendation, RecommendationRequestError } from "./create-recommendation";

const request: CreateRecommendationRequest = { answers: [
  { questionId: "sweet", answerId: "medium" },
  { questionId: "sour", answerId: "high" },
  { questionId: "bitter", answerId: "low" },
  { questionId: "alcohol-intensity", answerId: "medium" },
  { questionId: "refreshing", answerId: "very-high" },
  { questionId: "preferred-flavors", answerIds: ["citrus"] },
  { questionId: "avoided-flavors", answerIds: [] },
  { questionId: "preferred-base-spirits", answerIds: ["gin"] },
] };

const validResponse = {
  profile: { dimensions: [{ dimension: "sweet", score: 3 }], preferredFlavors: ["citrus"], avoidedFlavors: [], preferredBaseSpirits: ["gin"] },
  recommendations: [],
};

afterEach(() => vi.unstubAllGlobals());

describe("createRecommendation", () => {
  it("posts answers and returns a validated backend response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(validResponse), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createRecommendation(request)).resolves.toEqual(validResponse);
    expect(fetchMock).toHaveBeenCalledWith("/api/recommendations", expect.objectContaining({ method: "POST", body: JSON.stringify(request) }));
  });

  it("rejects malformed success responses at runtime", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ profile: {}, recommendations: [] }), { status: 200 })));
    await expect(createRecommendation({ answers: [] })).rejects.toEqual(expect.objectContaining({ message: "추천 서버에서 올바르지 않은 응답을 받았습니다." }));
  });

  it("maps network and HTTP failures to user-safe errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("secret network detail")));
    await expect(createRecommendation({ answers: [] })).rejects.toBeInstanceOf(RecommendationRequestError);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "bad" }), { status: 400 })));
    await expect(createRecommendation({ answers: [] })).rejects.toThrow("추천을 불러오지 못했습니다");
  });
});
