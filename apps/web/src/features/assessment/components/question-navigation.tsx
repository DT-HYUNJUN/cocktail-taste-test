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
    <nav className="mt-8 flex items-center gap-3 sm:gap-4" aria-label="질문 이동">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirst || isPending}
        className="
          inline-flex min-h-13 flex-1 items-center justify-center
          rounded-button border border-border bg-surface px-4 py-3
          text-sm font-semibold text-foreground
          transition-colors hover:border-primary/60
          focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-primary
          disabled:cursor-not-allowed disabled:opacity-40
          disabled:hover:border-border
          sm:flex-none sm:px-6 sm:text-base
        "
      >
        이전 질문
      </button>

      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue || isPending}
        aria-busy={isPending}
        className="
          inline-flex min-h-13 flex-1 items-center justify-center gap-2
          rounded-button bg-primary px-4 py-3
          text-sm font-semibold text-primary-foreground
          transition-colors hover:bg-[#F15F20]
          focus-visible:outline-2 focus-visible:outline-offset-2
          focus-visible:outline-primary
          disabled:cursor-not-allowed disabled:opacity-40
          disabled:hover:bg-primary
          sm:ml-auto sm:flex-none sm:px-6 sm:text-base
        "
      >
        {isPending ? "추천을 준비하는 중..." : isLast ? "결과 확인하기" : "다음 질문"}

        {!isPending && <span aria-hidden="true">→</span>}
      </button>
    </nav>
  );
}
