import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

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
    const signature = createHmac("sha256", "web-route-test-secret-at-least-32")
      .update([timestamp, "POST", "/recommendations", body].join("\n"))
      .digest("hex");
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

  it("returns 503 without complete server-side configuration", async () => {
    vi.stubEnv("API_BASE_URL", "");
    expect((await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: "{}" }))).status).toBe(503);
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubEnv("API_HMAC_SECRET", "");
    expect((await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: "{}" }))).status).toBe(503);
  });

  it("retries one transient response with a fresh timestamp and signature", async () => {
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
  });

  it("returns 504 after two timeouts", async () => {
    const timeout = new DOMException("timed out", "TimeoutError");
    const fetchMock = vi.fn().mockRejectedValue(timeout);
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: "{}" }));
    expect(response.status).toBe(504);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a permanent upstream response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "bad request" }), { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: "{}" }));
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
