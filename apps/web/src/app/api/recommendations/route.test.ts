import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { reportRecommendationErrorMock } = vi.hoisted(() => ({
  reportRecommendationErrorMock: vi.fn(),
}));

vi.mock("@/shared/lib/sentry/report-recommendation-error", () => ({
  reportRecommendationError: reportRecommendationErrorMock,
}));

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://localhost:3001");
  vi.stubEnv("API_HMAC_SECRET", "web-route-test-secret-at-least-32");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/recommendations", () => {
  it("proxies the request to the configured NestJS API", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ profile: {}, recommendations: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: JSON.stringify({ answers: [] }) }));
    expect(response.status).toBe(200);
    const body = JSON.stringify({ answers: [] });
    const timestamp = "1700000000000";
    const signature = createHmac("sha256", "web-route-test-secret-at-least-32").update([timestamp, "POST", "/recommendations", body].join("\n")).digest("hex");
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://localhost:3001/recommendations"),
      expect.objectContaining({
        method: "POST",
        body,
        headers: expect.objectContaining({
          "X-Cocktail-Timestamp": timestamp,
          "X-Cocktail-Signature": signature,
        }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("reports an upstream failure after two failed attempts", async () => {
    reportRecommendationErrorMock.mockClear();

    const fetchMock = vi.fn().mockRejectedValue(new Error("SECRET_VALUE_SHOULD_NOT_BE_SENT"));

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    expect(reportRecommendationErrorMock).toHaveBeenCalledExactlyOnceWith("upstream");
  });

  it("returns 503 and reports incomplete server-side configuration", async () => {
    reportRecommendationErrorMock.mockClear();

    vi.stubEnv("API_BASE_URL", "");

    const missingBaseUrlResponse = await POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(missingBaseUrlResponse.status).toBe(503);
    expect(reportRecommendationErrorMock).toHaveBeenCalledExactlyOnceWith("configuration");

    reportRecommendationErrorMock.mockClear();

    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubEnv("API_HMAC_SECRET", "");

    const missingSecretResponse = await POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(missingSecretResponse.status).toBe(503);
    expect(reportRecommendationErrorMock).toHaveBeenCalledExactlyOnceWith("configuration");
  });

  it("retries one transient response with a fresh timestamp and signature", async () => {
    reportRecommendationErrorMock.mockClear();
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ recommendations: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: "{}" }));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    const secondHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>;
    expect(secondHeaders["X-Cocktail-Timestamp"]).not.toBe(firstHeaders["X-Cocktail-Timestamp"]);
    expect(secondHeaders["X-Cocktail-Signature"]).not.toBe(firstHeaders["X-Cocktail-Signature"]);
    expect(reportRecommendationErrorMock).not.toHaveBeenCalled();
  });

  it("returns 504 and reports a timeout after two attempts", async () => {
    reportRecommendationErrorMock.mockClear();

    const timeout = new DOMException("timed out", "TimeoutError");
    const fetchMock = vi.fn().mockRejectedValue(timeout);

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(504);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    expect(reportRecommendationErrorMock).toHaveBeenCalledExactlyOnceWith("timeout");
  });

  it("does not retry a permanent upstream response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "bad request" }), { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: "{}" }));
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports an upstream response failure after two retryable responses", async () => {
    reportRecommendationErrorMock.mockClear();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unavailable" }), {
          status: 503,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Bad Gateway" }), {
          status: 502,
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    expect(reportRecommendationErrorMock).toHaveBeenCalledExactlyOnceWith("upstream-response");
  });

  it("reports configuration errors for invalid API URLs", async () => {
    const invalidUrls = ["not-a-valid-url", "ftp://localhost:3001"];

    for (const invalidUrl of invalidUrls) {
      reportRecommendationErrorMock.mockClear();

      vi.stubEnv("API_BASE_URL", invalidUrl);

      const response = await POST(
        new Request("http://localhost/api/recommendations", {
          method: "POST",
          body: "{}",
        }),
      );

      expect(response.status).toBe(503);

      expect(reportRecommendationErrorMock).toHaveBeenCalledExactlyOnceWith("configuration");
    }
  });

  it("waits for Sentry reporting before returning an error response", async () => {
    reportRecommendationErrorMock.mockReset();

    let finishReporting!: () => void;

    const reportingPromise = new Promise<void>((resolve) => {
      finishReporting = resolve;
    });

    reportRecommendationErrorMock.mockReturnValueOnce(reportingPromise);

    vi.stubEnv("API_BASE_URL", "");

    let responseCompleted = false;

    const responsePromise = POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        body: "{}",
      }),
    ).then((response) => {
      responseCompleted = true;
      return response;
    });

    try {
      await Promise.resolve();

      expect(reportRecommendationErrorMock).toHaveBeenCalledExactlyOnceWith("configuration");

      expect(responseCompleted).toBe(false);
    } finally {
      finishReporting();
    }

    const response = await responsePromise;

    expect(response.status).toBe(503);
    expect(responseCompleted).toBe(true);
  });
});
