import type { RefObject } from "react";
import Image from "next/image";
import Link from "next/link";

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
    <header className="mb-8 sm:mb-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-bold text-foreground focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
          <Image src="/icon.svg" alt="" width={32} height={32} aria-hidden="true" className="size-8 rounded-lg" />
          <span>칵테일 취향 테스트</span>
        </Link>

        <span className="font-mono text-sm font-bold tabular-nums text-accent-foreground" aria-label={`질문 ${current} / ${total}`}>
          {String(current).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div role="progressbar" aria-label="질문 진행률" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} className="h-2.5 w-full overflow-hidden rounded-full bg-[#F0E3D9]">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-9 text-center sm:mt-11">
        <p className="mb-3 font-mono text-xs font-bold tracking-[0.18em] text-accent-foreground">QUESTION {String(current).padStart(2, "0")}</p>

        <h1 ref={titleRef} id="question-title" tabIndex={-1} className="text-2xl font-extrabold leading-snug tracking-[-0.025em] text-foreground outline-none sm:text-4xl">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">정답은 없어요. 지금 끌리는 쪽을 골라주세요.</p>
      </div>
    </header>
  );
}
