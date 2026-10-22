import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearRecommendationResult, loadRecommendationResult, RECOMMENDATION_RESULT_SCHEMA_VERSION, RECOMMENDATION_RESULT_STORAGE_KEY, saveRecommendationResult } from "./result-snapshot";

const result = {
  profile: { dimensions: [{ dimension: "sweet" as const, score: 3 as const }], preferredFlavors: ["citrus" as const], avoidedFlavors: [], preferredBaseSpirits: ["gin" as const] },
  recommendations: [],
};

beforeEach(() => { sessionStorage.clear(); clearRecommendationResult(); });
afterEach(() => vi.restoreAllMocks());

describe("recommendation result snapshot", () => {
  it("stores and restores a versioned validated result", () => {
    expect(saveRecommendationResult(result)).toEqual(result);
    expect(JSON.parse(sessionStorage.getItem(RECOMMENDATION_RESULT_STORAGE_KEY) ?? "").version).toBe(RECOMMENDATION_RESULT_SCHEMA_VERSION);
    expect(loadRecommendationResult()).toEqual(result);
  });

  it("discards invalid JSON, incompatible versions, and invalid responses", () => {
    sessionStorage.setItem(RECOMMENDATION_RESULT_STORAGE_KEY, "{");
    expect(loadRecommendationResult()).toBeNull();
    sessionStorage.setItem(RECOMMENDATION_RESULT_STORAGE_KEY, JSON.stringify({ version: 99, result }));
    expect(loadRecommendationResult()).toBeNull();
    sessionStorage.setItem(RECOMMENDATION_RESULT_STORAGE_KEY, JSON.stringify({ version: 1, result: { profile: {}, recommendations: [] } }));
    expect(loadRecommendationResult()).toBeNull();
    expect(sessionStorage.getItem(RECOMMENDATION_RESULT_STORAGE_KEY)).toBeNull();
  });

  it("uses memory when sessionStorage access fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(saveRecommendationResult(result)).toEqual(result);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(loadRecommendationResult()).toEqual(result);
  });

  it("rejects invalid data before saving", () => {
    expect(saveRecommendationResult({ recommendations: [] })).toBeNull();
    expect(sessionStorage.getItem(RECOMMENDATION_RESULT_STORAGE_KEY)).toBeNull();
  });
});
