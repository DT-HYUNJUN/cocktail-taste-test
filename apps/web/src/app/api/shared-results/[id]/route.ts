import { NextResponse } from "next/server";

import { callSharedResultApi } from "@/shared/lib/server/shared-result-api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{22}$/.test(id)) {
    return NextResponse.json({ message: "Shared result not found" }, { status: 404 });
  }

  try {
    const response = await callSharedResultApi("GET", `shared-results/${id}`);
    const responseBody: unknown = await response.json().catch(() => ({ message: "Invalid API response" }));
    return NextResponse.json(responseBody, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Shared result API is unavailable" }, { status: 503 });
  }
}
