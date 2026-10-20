import type { RefObject } from "react";

type QuestionHeaderProps = {
  index: number;
  total: number;
  title: string;
  titleRef: RefObject<HTMLHeadingElement | null>;
};

export function QuestionHeader({ index, total, title, titleRef }: QuestionHeaderProps) {
  return (
    <header className="mb-8">
      <div className="mb-3 flex items-center justify-between text-sm font-medium text-stone-600">
        <span>취향 테스트</span>
        <span aria-label={`질문 ${index + 1} / ${total}`}>{index + 1} / {total}</span>
      </div>
      <progress className="h-2 w-full accent-amber-700" value={index + 1} max={total} aria-label="질문 진행률" />
      <p className="mb-3 mt-8 text-sm font-semibold text-amber-800">Q{index + 1}</p>
      <h1 ref={titleRef} id="question-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-stone-950 outline-none sm:text-3xl">{title}</h1>
    </header>
  );
}
