export function RecommendationLoading() {
  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center overflow-hidden px-5 text-center" role="status" aria-label="칵테일 취향 분석 중" aria-busy="true">
      <div aria-hidden="true" className="absolute top-[8%] -left-20 size-40 rounded-full bg-lilac/40 blur-3xl" />
      <div aria-hidden="true" className="absolute top-1/2 -right-16 size-32 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-[6%] -left-[5.5rem] size-44 rounded-full bg-lime/35 blur-3xl" />

      <div className="relative flex size-28 items-center justify-center rounded-[2.25rem] border border-primary/25 bg-primary/10 shadow-[0_10px_0_rgba(201,77,61,0.14)]">
        <span className="animate-[bounce_1.4s_ease-in-out_infinite] text-6xl motion-reduce:animate-none" aria-hidden="true">🍸</span>
      </div>

      <div className="relative mt-9">
        <p className="font-mono text-xs font-bold tracking-[0.18em] text-accent-foreground">MIXING YOUR TASTE</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">취향을 한 잔에 담는 중이에요</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">달콤함과 쌉싸름함 사이,<br className="sm:hidden" /> 딱 맞는 균형을 찾고 있어요.</p>
      </div>

      <div className="relative mt-7 flex flex-wrap justify-center gap-2" aria-hidden="true">
        {[
          ["단맛 재기", "0ms"],
          ["향 고르기", "250ms"],
          ["한 잔 찾기", "500ms"],
        ].map(([label, delay]) => <span key={label} className="animate-pulse rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground motion-reduce:animate-none" style={{ animationDelay: delay }}>{label}</span>)}
      </div>

      <span className="sr-only">칵테일 취향을 분석하고 있습니다. 잠시만 기다려 주세요.</span>
    </section>
  );
}
