import type { RefObject } from "react";

type QuestionHeaderProps = {
  index: number;
  total: number;
  title: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
};

export function QuestionHeader({ index, total, title, titleRef }: QuestionHeaderProps) {
  const current = index + 1;
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <header className="mb-8">
      {/* 테스트명 및 현재 질문 */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-foreground">칵테일 취향 테스트</span>

        <span className="text-sm font-bold tabular-nums text-[#B74716]" aria-label={`질문 ${current} / ${total}`}>
          {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* 진행률 */}
      <div role="progressbar" aria-label="질문 진행률" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} />
      </div>

      {/* 질문 제목 */}
      <div className="mt-10">
        <p className="mb-3 text-sm font-bold tracking-[0.12em] text-[#B74716]">QUESTION {String(current).padStart(2, "0")}</p>

        <h1 ref={titleRef} id="question-title" tabIndex={-1} className="text-2xl font-bold leading-snug tracking-tight text-foreground outline-none sm:text-3xl">
          {title}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">가장 가까운 취향을 선택해 주세요.</p>
      </div>
    </header>
  );
}
