import * as Sentry from "@sentry/nextjs";

export type RecommendationErrorCategory = "configuration" | "timeout" | "upstream" | "upstream-response";

export async function reportRecommendationError(category: RecommendationErrorCategory): Promise<void> {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  try {
    Sentry.captureException(new Error(`Recommendation API ${category} failure`), {
      tags: {
        errorCategory: category,
        source: "nextjs-recommendation-api",
      },
    });
    await Sentry.flush(2000);
  } catch {
    // Sentry 전송 실패가 API 응답에 영향을 주지 않도록 처리한다.
  }
}
