"use client";

import { useEffect, useRef, useState } from "react";
import { serializeAssessmentAnswers, type AssessmentAnswer, type AssessmentAnswers } from "../model/answers";
import { ASSESSMENT_QUESTIONS } from "../model/questions";
import { AssessmentComplete } from "./assessment-complete";
import { MultiChoiceQuestion } from "./multi-choice-question";
import { QuestionHeader } from "./question-header";
import { QuestionNavigation } from "./question-navigation";
import { SingleChoiceQuestion } from "./single-choice-question";

export function Assessment() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [completedAnswers, setCompletedAnswers] = useState<AssessmentAnswer[] | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const question = ASSESSMENT_QUESTIONS[index] ?? ASSESSMENT_QUESTIONS[0];
  const answer = answers[question.id];
  const selections = Array.isArray(answer) ? answer : [];

  useEffect(() => {
    if (completedAnswers === null) titleRef.current?.focus();
  }, [index, completedAnswers]);

  const selectSingle = (value: string) => {
    setCompletionError(null);
    setAnswers((current) => ({ ...current, [question.id]: value }));
  };
  const toggleMulti = (value: string) => {
    if (question.kind !== "multi") return;
    const next = selections.includes(value) ? selections.filter((item) => item !== value) : [...selections, value];
    if (question.maxSelections !== undefined && next.length > question.maxSelections) return;
    setCompletionError(null);
    setAnswers((current) => ({ ...current, [question.id]: next }));
  };
  const movePrevious = () => setIndex((current) => Math.max(0, current - 1));
  const continueAssessment = () => {
    const nextAnswers = question.kind === "multi" && answer === undefined
      ? { ...answers, [question.id]: [] }
      : answers;
    if (nextAnswers !== answers) setAnswers(nextAnswers);

    if (index < ASSESSMENT_QUESTIONS.length - 1) {
      setIndex((current) => Math.min(ASSESSMENT_QUESTIONS.length - 1, current + 1));
      return;
    }
    const serialized = serializeAssessmentAnswers(nextAnswers);
    if (serialized === null) {
      setCompletionError("모든 질문에 유효한 답변이 필요합니다. 이전 질문의 답변을 확인해 주세요.");
      return;
    }
    setCompletedAnswers(serialized);
  };

  if (completedAnswers !== null) {
    return <AssessmentComplete onEdit={() => { setCompletedAnswers(null); setIndex(ASSESSMENT_QUESTIONS.length - 1); }} />;
  }

  const canContinue = question.kind === "multi" || typeof answer === "string";
  const conflictingSelections = question.id === "preferred-flavors"
    ? answers["avoided-flavors"]
    : question.id === "avoided-flavors"
      ? answers["preferred-flavors"]
      : [];

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12" aria-labelledby="question-title">
      <QuestionHeader index={index} total={ASSESSMENT_QUESTIONS.length} title={question.title} titleRef={titleRef} />
      <div className="flex-1">
        {question.kind === "single" ? (
          <SingleChoiceQuestion question={question} answer={typeof answer === "string" ? answer : undefined} onChange={selectSingle} />
        ) : (
          <MultiChoiceQuestion question={question} selections={selections} conflictingSelections={Array.isArray(conflictingSelections) ? conflictingSelections : []} onToggle={toggleMulti} />
        )}
        {completionError && <p className="mt-4 text-sm font-medium text-red-700" role="alert">{completionError}</p>}
      </div>
      <QuestionNavigation isFirst={index === 0} isLast={index === ASSESSMENT_QUESTIONS.length - 1} canContinue={canContinue} onPrevious={movePrevious} onContinue={continueAssessment} />
    </section>
  );
}
