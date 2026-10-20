type AssessmentCompleteProps = { onEdit: () => void };

export function AssessmentComplete({ onEdit }: AssessmentCompleteProps) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-5 text-center">
      <p className="mb-3 text-sm font-semibold text-amber-800">취향 테스트 완료</p>
      <h1 className="text-3xl font-semibold tracking-tight text-stone-950">답변이 모두 저장되었어요.</h1>
      <p className="mt-4 leading-7 text-stone-600">추천 API 연결 전 임시 완료 화면입니다. 아직 추천 결과는 생성하지 않습니다.</p>
      <button type="button" onClick={onEdit} className="mt-8 rounded-lg border border-stone-300 bg-white px-5 py-3 font-medium text-stone-900">답변 수정하기</button>
    </section>
  );
}
