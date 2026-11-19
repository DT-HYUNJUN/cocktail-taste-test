import { createHmac } from "node:crypto";

import { loadApiHmacSecret } from "./api-hmac-secret";

const DEFAULT_TIMEOUT_MS = 12_000;

function readTimeoutMs(): number {
  const value = Number(process.env.API_REQUEST_TIMEOUT_MS?.trim() || DEFAULT_TIMEOUT_MS);
  if (!Number.isInteger(value) || value < 1) throw new Error("Invalid API timeout");
  return value;
}

export async function callSharedResultApi(method: "GET" | "POST", path: string, body = ""): Promise<Response> {
  const apiBaseUrl = process.env.API_BASE_URL?.trim();
  if (!apiBaseUrl) throw new Error("API is not configured");

  const baseUrl = new URL(apiBaseUrl);
  if (!["http:", "https:"].includes(baseUrl.protocol) || (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:")) {
    throw new Error("Invalid API protocol");
  }

  const url = new URL(path, apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`);
  const secret = await loadApiHmacSecret();
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", secret).update([timestamp, method, url.pathname, body].join("\n")).digest("hex");

  return fetch(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      "X-Cocktail-Timestamp": timestamp,
      "X-Cocktail-Signature": signature,
    },
    ...(body ? { body } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(readTimeoutMs()),
  });
}
