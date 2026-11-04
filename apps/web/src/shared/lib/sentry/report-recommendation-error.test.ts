import * as Sentry from "@sentry/nextjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reportRecommendationError } from "./report-recommendation-error";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  flush: vi.fn(),
}));

beforeEach(() => {
  vi.stubEnv("SENTRY_DSN", "https://example@example.com/1");
  vi.mocked(Sentry.captureException).mockClear();
  vi.mocked(Sentry.flush).mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("reportRecommendationError", () => {
  it("does not throw when Sentry flush fails", async () => {
    vi.mocked(Sentry.flush).mockRejectedValueOnce(new Error("Sentry transport unavailable"));

    await expect(reportRecommendationError("upstream")).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.flush).toHaveBeenCalledExactlyOnceWith(2000);
  });

  it("skips Sentry reporting when SENTRY_DSN is missing", async () => {
    vi.stubEnv("SENTRY_DSN", "");

    await expect(reportRecommendationError("configuration")).resolves.toBeUndefined();

    expect(Sentry.captureException).not.toHaveBeenCalled();
    expect(Sentry.flush).not.toHaveBeenCalled();
  });

  it("does not throw when Sentry captureException fails", async () => {
    vi.mocked(Sentry.captureException).mockImplementationOnce(() => {
      throw new Error("Sentry capture failed");
    });

    await expect(reportRecommendationError("upstream")).resolves.toBeUndefined();

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(Sentry.flush).not.toHaveBeenCalled();
  });
});
