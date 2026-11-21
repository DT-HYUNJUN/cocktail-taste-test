import Image from "next/image";
import Link from "next/link";

type ResultStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  action?: { href: string; label: string };
  busy?: boolean;
};

export function ResultState({ eyebrow, title, description, icon, action, busy = false }: ResultStateProps) {
  return (
    <section className="relative isolate flex min-h-screen overflow-hidden px-5 py-6" aria-busy={busy || undefined} aria-live={busy ? "polite" : undefined}>
      <div aria-hidden="true" className="absolute -left-24 top-16 size-64 rounded-full bg-lilac/45 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-12 size-72 rounded-full bg-lime/35 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col">
        <Link href="/" aria-label="칵테일 취향 테스트 홈" className="flex w-fit items-center gap-3 font-bold tracking-tight focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
          <Image src="/icon.svg" alt="" width={40} height={40} aria-hidden="true" className="size-10 rounded-xl" />
          <span className="hidden sm:inline">칵테일 취향 테스트</span>
        </Link>

        <div className="mx-auto my-auto flex max-w-xl flex-col items-center py-16 text-center">
          <div className="relative flex size-24 items-center justify-center rounded-[2rem] border border-primary/20 bg-primary/10 shadow-[0_9px_0_rgba(201,77,61,0.12)]">
            <span aria-hidden="true" className={busy ? "animate-pulse text-5xl motion-reduce:animate-none" : "text-5xl"}>{icon}</span>
          </div>
          <p className="mt-9 font-mono text-xs font-bold tracking-[0.18em] text-accent-foreground">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>

          {action ? (
            <Link href={action.href} className="mt-8 inline-flex min-h-14 items-center justify-center rounded-button bg-primary px-8 py-3.5 text-base font-bold text-primary-foreground shadow-[0_8px_0_var(--primary-shadow)] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_4px_0_var(--primary-shadow)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              {action.label}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
