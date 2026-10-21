"use client";

import { useEffect, useRef, useState } from "react";
import { serializeAssessmentAnswers, type AssessmentAnswer } from "../model/answers";
import { hydrateAssessmentStore, useAssessmentStore } from "../model/assessment-store";
import { ASSESSMENT_QUESTIONS } from "../model/questions";
import { AssessmentComplete } from "./assessment-complete";
import { MultiChoiceQuestion } from "./multi-choice-question";
import { QuestionHeader } from "./question-header";
import { QuestionNavigation } from "./question-navigation";
import { SingleChoiceQuestion } from "./single-choice-question";

export function Assessment() {
  const currentIndex = useAssessmentStore((state) => state.currentIndex);
  const answers = useAssessmentStore((state) => state.answers);
  const hasHydrated = useAssessmentStore((state) => state.hasHydrated);
  const selectSingle = useAssessmentStore((state) => state.selectSingle);
  const toggleMulti = useAssessmentStore((state) => state.toggleMulti);
  const confirmEmptyMulti = useAssessmentStore((state) => state.confirmEmptyMulti);
  const moveNext = useAssessmentStore((state) => state.moveNext);
  const movePrevious = useAssessmentStore((state) => state.movePrevious);
  const returnToLastQuestion = useAssessmentStore((state) => state.returnToLastQuestion);
  const [completedAnswers, setCompletedAnswers] = useState<AssessmentAnswer[] | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const question = ASSESSMENT_QUESTIONS[currentIndex] ?? ASSESSMENT_QUESTIONS[0];
  const answer = answers[question.id];
  const selections = Array.isArray(answer) ? answer : [];

  useEffect(() => { void hydrateAssessmentStore(); }, []);
  useEffect(() => {
    if (hasHydrated && completedAnswers === null) titleRef.current?.focus();
  }, [currentIndex, completedAnswers, hasHydrated]);

  if (!hasHydrated) {
    return <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-5" aria-busy="true" aria-live="polite">진행 상태를 불러오는 중입니다.</section>;
  }

  const continueAssessment = () => {
    setCompletionError(null);
    if (question.kind === "multi" && answer === undefined) confirmEmptyMulti(question.id);
    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      moveNext();
      return;
    }
    const serialized = serializeAssessmentAnswers(useAssessmentStore.getState().answers);
    if (serialized === null) {
      setCompletionError("모든 질문에 유효한 답변이 필요합니다. 이전 질문의 답변을 확인해 주세요.");
      return;
    }
    setCompletedAnswers(serialized);
  };

  if (completedAnswers !== null) {
    return <AssessmentComplete onEdit={() => { setCompletedAnswers(null); returnToLastQuestion(); }} />;
  }

  const canContinue = question.kind === "multi" || typeof answer === "string";
  const conflictingSelections = question.id === "preferred-flavors"
    ? answers["avoided-flavors"]
    : question.id === "avoided-flavors"
      ? answers["preferred-flavors"]
      : [];

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-12" aria-labelledby="question-title">
      <QuestionHeader index={currentIndex} total={ASSESSMENT_QUESTIONS.length} title={question.title} titleRef={titleRef} />
      <div className="flex-1">
        {question.kind === "single" ? (
          <SingleChoiceQuestion question={question} answer={typeof answer === "string" ? answer : undefined} onChange={(value) => { setCompletionError(null); selectSingle(question.id, value); }} />
        ) : (
          <MultiChoiceQuestion question={question} selections={selections} conflictingSelections={conflictingSelections ?? []} onToggle={(value) => { setCompletionError(null); toggleMulti(question.id, value); }} />
        )}
        {completionError && <p className="mt-4 text-sm font-medium text-red-700" role="alert">{completionError}</p>}
      </div>
      <QuestionNavigation isFirst={currentIndex === 0} isLast={currentIndex === ASSESSMENT_QUESTIONS.length - 1} canContinue={canContinue} onPrevious={movePrevious} onContinue={continueAssessment} />
    </section>
  );
}
