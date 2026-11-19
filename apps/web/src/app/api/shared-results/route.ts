import { NextResponse } from "next/server";

import { callSharedResultApi } from "@/shared/lib/server/shared-result-api";

export async function POST(request: Request) {
  let body: string;
  try {
    body = JSON.stringify(await request.json());
  } catch {
    return NextResponse.json({ message: "Invalid JSON request" }, { status: 400 });
  }

  try {
    const response = await callSharedResultApi("POST", "shared-results", body);
    const responseBody: unknown = await response.json().catch(() => ({ message: "Invalid API response" }));
    return NextResponse.json(responseBody, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Shared result API is unavailable" }, { status: 503 });
  }
}
