import { SharedRecommendationResult } from "@/features/recommendation/components/shared-recommendation-result";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "공유된 칵테일 취향 결과",
  robots: { index: false, follow: false },
};

export default async function SharedResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-background">
      <SharedRecommendationResult id={id} />
    </main>
  );
}
