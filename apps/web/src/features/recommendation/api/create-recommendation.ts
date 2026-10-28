import { parseRecommendationResponse, type CreateRecommendationRequest, type RecommendationResponse } from "@cocktail-taste-test/contracts";

export class RecommendationRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecommendationRequestError";
  }
}

export async function createRecommendation(request: CreateRecommendationRequest): Promise<RecommendationResponse> {
  let response: Response;
  try {
    response = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new RecommendationRequestError("추천 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 400) {
      throw new RecommendationRequestError("답변이 올바르지 않습니다. 답변을 확인한 뒤 다시 시도해 주세요.");
    }

    throw new RecommendationRequestError("추천 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
  }

  try {
    return parseRecommendationResponse(body);
  } catch {
    throw new RecommendationRequestError("추천 서버에서 올바르지 않은 응답을 받았습니다.");
  }
}
