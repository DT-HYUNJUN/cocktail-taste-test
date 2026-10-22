import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("POST /api/recommendations", () => {
  it("proxies the request to the configured NestJS API", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ profile: {}, recommendations: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: JSON.stringify({ answers: [] }) }));
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(new URL("http://localhost:3001/recommendations"), expect.objectContaining({ method: "POST", body: JSON.stringify({ answers: [] }) }));
  });

  it("returns 503 without API configuration and 502 when the API is unavailable", async () => {
    vi.stubEnv("API_BASE_URL", "");
    expect((await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: "{}" }))).status).toBe(503);
    vi.stubEnv("API_BASE_URL", "http://localhost:3001");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect((await POST(new Request("http://localhost/api/recommendations", { method: "POST", body: "{}" }))).status).toBe(502);
  });
});
