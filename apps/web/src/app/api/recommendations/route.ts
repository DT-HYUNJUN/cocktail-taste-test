import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 12_000;

function readTimeoutMs(): number {
  const raw = process.env.API_REQUEST_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("API_REQUEST_TIMEOUT_MS must be a positive integer");
  }
  return value;
}

function signRequest(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update([timestamp, "POST", "/recommendations", body].join("\n")).digest("hex");
}

async function callRecommendationApi(url: URL, secret: string, body: string, timestampMs: number): Promise<Response> {
  const timestamp = String(timestampMs);
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cocktail-Timestamp": timestamp,
      "X-Cocktail-Signature": signRequest(secret, timestamp, body),
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(readTimeoutMs()),
  });
}

export async function POST(request: Request) {
  const apiBaseUrl = process.env.API_BASE_URL?.trim();
  const secret = process.env.API_HMAC_SECRET?.trim();

  if (!apiBaseUrl || !secret || secret.length < 32) {
    return NextResponse.json({ message: "Recommendation API is not configured" }, { status: 503 });
  }

  let body: string;

  try {
    body = JSON.stringify(await request.json());
  } catch {
    return NextResponse.json({ message: "Invalid JSON request" }, { status: 400 });
  }

  // 여기부터 수정
  let url: URL;

  try {
    const baseUrl = new URL(apiBaseUrl);

    if (!["http:", "https:"].includes(baseUrl.protocol) || (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:")) {
      throw new Error("Invalid API protocol");
    }

    url = new URL("recommendations", apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`);
  } catch {
    return NextResponse.json({ message: "Recommendation API is not configured" }, { status: 503 });
  }
  // 여기까지 수정

  let lastTimestamp = 0;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    lastTimestamp = Math.max(Date.now(), lastTimestamp + 1);
    try {
      const response = await callRecommendationApi(url, secret, body, lastTimestamp);
      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === 1) {
        const responseBody: unknown = await response.json().catch(() => ({ message: "Invalid API response" }));
        return NextResponse.json(responseBody, { status: response.status });
      }
    } catch (error) {
      if (attempt === 0) continue;
      const timedOut = typeof error === "object" && error !== null && "name" in error && error.name === "TimeoutError";
      return NextResponse.json(
        {
          message: timedOut ? "Recommendation API timed out" : "Recommendation API is unavailable",
        },
        { status: timedOut ? 504 : 502 },
      );
    }
  }

  return NextResponse.json({ message: "Recommendation API is unavailable" }, { status: 502 });
}
