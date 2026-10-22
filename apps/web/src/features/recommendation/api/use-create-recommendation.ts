"use client";

import { useMutation } from "@tanstack/react-query";
import { createRecommendation } from "./create-recommendation";

export function useCreateRecommendation() {
  return useMutation({ mutationFn: createRecommendation, retry: false });
}
