"use client";

import { useState } from "react";
import { ASSESSMENT_QUESTIONS } from "../model/questions";

type Answers = Partial<Record<(typeof ASSESSMENT_QUESTIONS)[number]["id"], string | string[]>>;

export function Assessment() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const question = ASSESSMENT_QUESTIONS[index] ?? ASSESSMENT_QUESTIONS[0];
  const answer = answers[question.id];
  const selections = Array.isArray(answer) ? answer : [];
  const preferred = answers["preferred-flavors"];
  const avoided = answers["avoided-flavors"];

  const selectSingle = (value: string) => setAnswers((current) => ({ ...current, [question.id]: value }));
  const toggleMulti = (value: string) => {
    if (question.kind !== "multi") return;
    const next = selections.includes(value) ? selections.filter((item) => item !== value) : [...selections, value];
    if (question.maxSelections !== undefined && next.length > question.maxSelections) return;
    setAnswers((current) => ({ ...current, [question.id]: next }));
  };
  const goNext = () => {
    if (question.kind === "multi" && answer === undefined) setAnswers((current) => ({ ...current, [question.id]: [] }));
    setIndex((current) => Math.min(current + 1, ASSESSMENT_QUESTIONS.length - 1));
  };
  const canContinue = question.kind === "multi" || typeof answer === "string";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12" aria-labelledby="question-title">
      <header className="mb-8">
        <div className="mb-3 flex items-center justify-between text-sm font-medium text-stone-600">
          <span>취향 테스트</span>
          <span aria-label={`질문 ${index + 1} / ${ASSESSMENT_QUESTIONS.length}`}>{index + 1} / {ASSESSMENT_QUESTIONS.length}</span>
        </div>
        <progress className="h-2 w-full accent-amber-700" value={index + 1} max={ASSESSMENT_QUESTIONS.length} aria-label="질문 진행률" />
      </header>
      <div className="flex-1">
        <p className="mb-3 text-sm font-semibold text-amber-800">Q{index + 1}</p>
        <h1 id="question-title" tabIndex={-1} className="text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">{question.title}</h1>
        {question.kind === "multi" && <p id="question-help" className="mt-3 text-sm leading-6 text-stone-600">{question.description}</p>}
        <fieldset className="mt-7 grid gap-3" aria-describedby={question.kind === "multi" ? "question-help" : undefined}>
          <legend className="sr-only">{question.title}</legend>
          {question.options.map((option) => {
            const checked = question.kind === "single" ? answer === option.id : selections.includes(option.id);
            const conflicts = question.id === "preferred-flavors"
              ? Array.isArray(avoided) && avoided.includes(option.id)
              : question.id === "avoided-flavors" && Array.isArray(preferred) && preferred.includes(option.id);
            const atLimit = question.kind === "multi" && question.maxSelections !== undefined && selections.length >= question.maxSelections && !checked;
            const disabled = Boolean(conflicts || atLimit);
            return (
              <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${checked ? "border-amber-700 bg-amber-50 ring-1 ring-amber-700" : "border-stone-300 bg-white hover:border-stone-500"} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}>
                <input type={question.kind === "single" ? "radio" : "checkbox"} name={question.id} value={option.id} checked={checked} disabled={disabled} onChange={() => question.kind === "single" ? selectSingle(option.id) : toggleMulti(option.id)} className="h-4 w-4 accent-amber-700" />
                <span className="leading-6 text-stone-900">{option.label}</span>
              </label>
            );
          })}
        </fieldset>
      </div>
      <nav className="mt-8 flex items-center justify-between gap-4" aria-label="질문 이동">
        <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0} className="rounded-lg border border-stone-300 px-5 py-3 font-medium text-stone-800 disabled:cursor-not-allowed disabled:opacity-40">이전 질문</button>
        <button type="button" onClick={goNext} disabled={!canContinue || index === ASSESSMENT_QUESTIONS.length - 1} className="rounded-lg bg-stone-950 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">다음 질문</button>
      </nav>
    </section>
  );
}
