import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callSharedResultApi } from "./shared-result-api";

beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://localhost:3001");
  vi.stubEnv("API_HMAC_SECRET", "shared-result-test-secret-at-least-32");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("callSharedResultApi", () => {
  it.each([
    ["POST", "shared-results", JSON.stringify({ answers: [] })],
    ["GET", "shared-results/abcdefghijklmnopqrstuv", ""],
  ] as const)("signs %s requests for the exact upstream path", async (method, path, body) => {
    const dateSpy = vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await callSharedResultApi(method, path, body);

    const url = new URL(`http://localhost:3001/${path}`);
    const signature = createHmac("sha256", "shared-result-test-secret-at-least-32")
      .update(["1700000000000", method, url.pathname, body].join("\n"))
      .digest("hex");
    expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({
      method,
      headers: expect.objectContaining({
        "X-Cocktail-Timestamp": "1700000000000",
        "X-Cocktail-Signature": signature,
      }),
    }));
    dateSpy.mockRestore();
  });
});
