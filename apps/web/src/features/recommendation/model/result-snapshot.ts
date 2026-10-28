import { parseRecommendationResponse, type RecommendationResponse } from "@cocktail-taste-test/contracts";

export const RECOMMENDATION_RESULT_STORAGE_KEY = "cocktail-taste-test:recommendation-result";
export const RECOMMENDATION_RESULT_SCHEMA_VERSION = 1;

type ResultSnapshot = {
  version: typeof RECOMMENDATION_RESULT_SCHEMA_VERSION;
  result: RecommendationResponse;
};

let memoryResult: RecommendationResponse | null = null;

function getSessionStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveRecommendationResult(value: unknown): RecommendationResponse | null {
  let result: RecommendationResponse;
  try {
    result = parseRecommendationResponse(value);
  } catch {
    return null;
  }

  memoryResult = result;
  try {
    getSessionStorage()?.setItem(
      RECOMMENDATION_RESULT_STORAGE_KEY,
      JSON.stringify({
        version: RECOMMENDATION_RESULT_SCHEMA_VERSION,
        result,
      } satisfies ResultSnapshot),
    );
  } catch {
    // The in-memory snapshot keeps client navigation usable when storage is blocked.
  }
  return result;
}

export function loadRecommendationResult(): RecommendationResponse | null {
  let raw: string | null = null;
  try {
    raw = getSessionStorage()?.getItem(RECOMMENDATION_RESULT_STORAGE_KEY) ?? null;
  } catch {
    return memoryResult;
  }
  if (raw === null) return memoryResult;

  try {
    const snapshot: unknown = JSON.parse(raw);
    if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) throw new Error("Invalid snapshot");
    const candidate = snapshot as Record<string, unknown>;
    if (candidate.version !== RECOMMENDATION_RESULT_SCHEMA_VERSION) throw new Error("Unsupported snapshot version");
    const result = parseRecommendationResponse(candidate.result);
    memoryResult = result;
    return result;
  } catch {
    try {
      getSessionStorage()?.removeItem(RECOMMENDATION_RESULT_STORAGE_KEY);
    } catch {
      /* no-op */
    }
    memoryResult = null;
    return null;
  }
}

export function clearRecommendationResult(): void {
  memoryResult = null;
  try {
    getSessionStorage()?.removeItem(RECOMMENDATION_RESULT_STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
