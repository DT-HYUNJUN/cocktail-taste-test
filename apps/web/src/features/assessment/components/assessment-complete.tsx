import type { RecommendationResponse } from "@cocktail-taste-test/contracts";

type AssessmentCompleteProps = { result: RecommendationResponse; onEdit: () => void };

export function AssessmentComplete({ result, onEdit }: AssessmentCompleteProps) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-5 text-center">
      <p className="mb-3 text-sm font-semibold text-amber-800">취향 테스트 완료</p>
      <h1 className="text-3xl font-semibold tracking-tight text-stone-950">추천 결과를 받았어요</h1>
      <p className="mt-4 leading-7 text-stone-600">추천 API가 {result.recommendations.length}개의 결과를 반환했습니다. 상세 결과 화면은 다음 단계에서 연결합니다.</p>
      <button type="button" onClick={onEdit} className="mt-8 rounded-lg border border-stone-300 bg-white px-5 py-3 font-medium text-stone-900">답변 수정하기</button>
    </section>
  );
}
