import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "취향 선택",
    description: "8개의 질문에 답해요",
  },
  {
    number: "02",
    title: "취향 분석",
    description: "좋아하는 맛을 알아봐요",
  },
  {
    number: "03",
    title: "칵테일 발견",
    description: "나에게 맞는 한 잔을 찾아요",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <header className="flex h-20 items-center">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight">
            <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              🍹
            </span>
            <span>칵테일 취향 테스트</span>
          </Link>
        </header>

        <section
          className="
            grid gap-x-12 gap-y-6 py-8
            md:min-h-[560px]
            md:grid-cols-2
            md:grid-rows-[auto_auto]
            md:items-center
            md:py-12
          "
        >
          {/* 1. 서비스 소개 및 CTA */}
          <div className="flex flex-col items-start gap-6 md:col-start-1 md:row-start-1 md:self-end">
            <p className="text-sm font-bold tracking-[0.15em] text-[#B74716]">FIND YOUR PERFECT SIP</p>

            <h1 className="text-4xl leading-[1.25] font-bold tracking-tight sm:text-5xl lg:text-[52px]">
              오늘의 취향을 담은
              <br />
              <span className="text-[#C34A19]">한 잔,</span> 찾아볼까요?
            </h1>

            <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
              달콤한 맛부터 상큼한 맛까지.
              <br />
              8개의 질문으로 나에게 어울리는 칵테일을 찾아보세요.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm">✨ 8개 질문</span>
              <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm">🍸 취향 기반 추천</span>
            </div>

            <Link
              href="/test"
              className="inline-flex min-h-13 items-center justify-center gap-3 rounded-button bg-primary px-7 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              내 칵테일 찾기
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* 2. 칵테일 이미지 */}
          <div className="relative hidden md:col-start-2 md:row-span-2 md:row-start-1 md:block">
            <div aria-hidden="true" className="absolute -top-5 -right-3 size-28 rounded-full bg-lemon/70 blur-2xl" />

            <div className="relative aspect-[5/4] overflow-hidden rounded-image bg-coral/20 md:aspect-[4/5]">
              <Image src="/images/cocktail-hero.jpeg" alt="과일로 장식된 화려한 칵테일" fill priority sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
            </div>

            <div className="absolute -bottom-4 -left-3 rounded-2xl border border-border bg-surface px-5 py-3 shadow-lg sm:-left-6">
              <p className="text-xs text-muted-foreground">YOUR TASTE, YOUR COCKTAIL</p>
              <p className="mt-1 font-semibold">당신만의 한 잔을 발견하세요</p>
            </div>
          </div>

          {/* 3. 테스트 진행 과정 */}
          <div className="w-full max-w-md border-t border-border pt-6 md:col-start-1 md:row-start-2 md:self-start">
            <h2 className="mb-4 text-xs font-bold tracking-[0.15em] text-muted-foreground">HOW IT WORKS</h2>

            <ol className="space-y-3">
              {steps.map((step) => (
                <li key={step.number} className="flex items-center gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#B74716]">{step.number}</span>

                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
