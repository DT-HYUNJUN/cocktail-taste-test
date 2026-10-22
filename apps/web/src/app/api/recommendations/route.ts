import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiBaseUrl = process.env.API_BASE_URL?.trim();
  if (!apiBaseUrl) {
    return NextResponse.json({ message: "Recommendation API is not configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON request" }, { status: 400 });
  }

  try {
    const response = await fetch(new URL("recommendations", apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const responseBody: unknown = await response.json().catch(() => ({ message: "Invalid API response" }));
    return NextResponse.json(responseBody, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Recommendation API is unavailable" }, { status: 502 });
  }
}
