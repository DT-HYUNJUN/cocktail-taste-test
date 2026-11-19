import {
  parseCreateSharedResultResponse,
  parseSharedResultResponse,
  type CreateSharedResultRequest,
  type CreateSharedResultResponse,
  type SharedResultResponse,
} from "@cocktail-taste-test/contracts";

export async function createSharedResult(request: CreateSharedResultRequest): Promise<CreateSharedResultResponse> {
  const response = await fetch("/api/shared-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error("Unable to create shared result");
  return parseCreateSharedResultResponse(await response.json());
}

export async function loadSharedResult(id: string): Promise<SharedResultResponse> {
  const response = await fetch(`/api/shared-results/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!response.ok) throw new Error(response.status === 404 ? "not-found" : "unavailable");
  return parseSharedResultResponse(await response.json());
}
