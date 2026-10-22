type QuestionNavigationProps = {
  isFirst: boolean;
  isLast: boolean;
  canContinue: boolean;
  isPending?: boolean;
  onPrevious: () => void;
  onContinue: () => void;
};

export function QuestionNavigation({ isFirst, isLast, canContinue, isPending = false, onPrevious, onContinue }: QuestionNavigationProps) {
  return (
    <nav className="mt-8 flex items-center justify-between gap-4" aria-label="질문 이동">
      <button type="button" onClick={onPrevious} disabled={isFirst || isPending} className="rounded-lg border border-stone-300 px-5 py-3 font-medium text-stone-800 disabled:cursor-not-allowed disabled:opacity-40">이전 질문</button>
      <button type="button" onClick={onContinue} disabled={!canContinue || isPending} aria-busy={isPending} className="rounded-lg bg-stone-950 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">{isPending ? "추천을 준비하는 중..." : isLast ? "결과 확인하기" : "다음 질문"}</button>
    </nav>
  );
}
