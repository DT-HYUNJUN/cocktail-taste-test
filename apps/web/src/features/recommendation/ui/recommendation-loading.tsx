export function RecommendationLoading() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full flex-col items-center justify-center gap-5 px-5" role="status" aria-label="칵테일 취향 분석 중" aria-busy="true">
      <div className="flex size-24 items-center justify-center rounded-full bg-[#FFF0E6]">
        <span className="animate-pulse text-5xl motion-reduce:animate-none" aria-hidden="true">
          🍸
        </span>
      </div>

      <div className="flex items-center gap-2" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="size-2 animate-pulse rounded-full bg-primary motion-reduce:animate-none"
            style={{
              animationDelay: `${index * 200}ms`,
            }}
          />
        ))}
      </div>

      <span className="sr-only">칵테일 취향을 분석하고 있습니다. 잠시만 기다려 주세요.</span>
    </section>
  );
}
