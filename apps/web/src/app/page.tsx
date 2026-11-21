import Image from "next/image";
import Link from "next/link";

import { SessionCocktailImage } from "@/features/landing";

const steps = [
  { number: "01", title: "취향 선택", description: "8개의 질문에 답해요" },
  { number: "02", title: "취향 분석", description: "좋아하는 맛을 알아봐요" },
  { number: "03", title: "칵테일 발견", description: "나에게 맞는 한 잔을 찾아요" },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div aria-hidden="true" className="absolute top-24 -left-20 size-56 rounded-full bg-lilac/45 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-8 size-64 rounded-full bg-lime/35 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <header className="flex h-20 items-center sm:h-24">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
            <Image src="/icon.svg" alt="" width={40} height={40} aria-hidden="true" className="size-10 rounded-xl" />
            <span>칵테일 취향 테스트</span>
          </Link>
        </header>

        <section className="grid gap-x-16 gap-y-10 pb-10 pt-6 md:min-h-[calc(100vh-6rem)] md:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.75fr)] md:grid-rows-[1fr_auto] md:items-center md:pb-8 md:pt-2 lg:gap-x-24">
          <div className="relative flex flex-col items-start md:self-center">
            <div aria-hidden="true" className="absolute -left-2 top-9 hidden h-2 w-16 -rotate-3 rounded-full bg-lime sm:block" />

            <p className="font-mono text-xs font-bold tracking-[0.2em] text-accent-foreground sm:text-sm">FIND YOUR PERFECT SIP</p>

            <h1 className="mt-6 max-w-3xl text-4xl leading-[1.08] font-extrabold tracking-[-0.045em] text-foreground min-[360px]:text-[2.75rem] sm:text-6xl lg:text-7xl">
              당신의 입맛은
              <br />
              어떤 <span className="relative isolate inline-block text-primary"><span aria-hidden="true" className="absolute inset-x-0 bottom-1 -z-10 h-3 -rotate-1 bg-lime/70" />칵테일</span>일까요?
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              달콤함, 상큼함, 쌉싸름함 사이에서
              <br className="hidden sm:block" /> 8가지 질문으로 나만의 한 잔을 발견해 보세요.
            </p>

            <div className="mt-8 flex w-full flex-col items-start gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-5">
              <Link href="/test" className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-button bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_4px_0_var(--primary-shadow)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto">
                내 칵테일 찾기
                <span aria-hidden="true" className="text-xl">→</span>
              </Link>
              <p className="text-sm font-semibold text-muted-foreground">8문항 · 약 1분</p>
            </div>
          </div>

          <div className="relative hidden md:block md:self-center">
            <div aria-hidden="true" className="absolute -top-7 -right-7 size-24 rotate-12 rounded-[2rem] bg-lime" />
            <div aria-hidden="true" className="absolute -bottom-6 -left-7 size-20 -rotate-12 rounded-full bg-lilac" />
            <SessionCocktailImage />
          </div>

          <div className="border-y border-border py-5 md:col-span-2 md:py-4">
            <div className="grid gap-5 sm:grid-cols-3 sm:gap-0">
              {steps.map((step, index) => (
                <div key={step.number} className={`flex items-center gap-4 sm:px-5 lg:px-8 ${index > 0 ? "sm:border-l sm:border-border" : ""}`}>
                  <span className="font-mono text-sm font-bold text-primary" aria-hidden="true">{step.number}</span>
                  <div>
                    <h2 className="text-sm font-bold">{step.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
