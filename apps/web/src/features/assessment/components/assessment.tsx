"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateRecommendation } from "../../recommendation/api/use-create-recommendation";
import { clearRecommendationResult, saveRecommendationResult } from "../../recommendation/model/result-snapshot";
import { serializeAssessmentAnswers } from "../model/answers";
import { hydrateAssessmentStore, useAssessmentStore } from "../model/assessment-store";
import { ASSESSMENT_QUESTIONS } from "../model/questions";
import { MultiChoiceQuestion } from "./multi-choice-question";
import { QuestionHeader } from "./question-header";
import { QuestionNavigation } from "./question-navigation";
import { SingleChoiceQuestion } from "./single-choice-question";

export function Assessment() {
  const router = useRouter();
  const currentIndex = useAssessmentStore((state) => state.currentIndex);
  const answers = useAssessmentStore((state) => state.answers);
  const hasHydrated = useAssessmentStore((state) => state.hasHydrated);
  const selectSingle = useAssessmentStore((state) => state.selectSingle);
  const toggleMulti = useAssessmentStore((state) => state.toggleMulti);
  const confirmEmptyMulti = useAssessmentStore((state) => state.confirmEmptyMulti);
  const moveNext = useAssessmentStore((state) => state.moveNext);
  const movePrevious = useAssessmentStore((state) => state.movePrevious);
  const returnToLastQuestion = useAssessmentStore((state) => state.returnToLastQuestion);
  const recommendation = useCreateRecommendation();
  const [completionError, setCompletionError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const question = ASSESSMENT_QUESTIONS[currentIndex] ?? ASSESSMENT_QUESTIONS[0];
  const answer = answers[question.id];
  const selections = Array.isArray(answer) ? answer : [];

  useEffect(() => { void hydrateAssessmentStore(); }, []);
  useEffect(() => {
    if (hasHydrated && !recommendation.isSuccess) titleRef.current?.focus();
  }, [currentIndex, hasHydrated, recommendation.isSuccess]);

  if (!hasHydrated) {
    return <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-5" aria-busy="true" aria-live="polite">진행 상태를 불러오는 중입니다.</section>;
  }

  const submitAssessment = () => {
    if (recommendation.isPending) return;
    setCompletionError(null);
    const serialized = serializeAssessmentAnswers(useAssessmentStore.getState().answers);
    if (serialized === null) {
      setCompletionError("모든 질문에 유효한 답변이 필요합니다. 이전 질문의 답변을 확인해 주세요.");
      return;
    }
    clearRecommendationResult();
    recommendation.mutate({ answers: serialized }, {
      onSuccess: (result) => {
        if (saveRecommendationResult(result) === null) {
          setCompletionError("추천 결과를 안전하게 저장하지 못했습니다. 다시 시도해 주세요.");
          recommendation.reset();
          return;
        }
        router.push("/result");
      },
    });
  };

  const continueAssessment = () => {
    if (recommendation.isPending) return;
    setCompletionError(null);
    if (question.kind === "multi" && answer === undefined) confirmEmptyMulti(question.id);
    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      moveNext();
      return;
    }
    const state = useAssessmentStore.getState();
    if (question.kind === "multi" && state.answers[question.id] === undefined) state.confirmEmptyMulti(question.id);
    submitAssessment();
  };

  if (recommendation.isSuccess) {
    return <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-5" aria-busy="true" aria-live="polite">결과 화면으로 이동하는 중입니다.</section>;
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
          <SingleChoiceQuestion question={question} answer={typeof answer === "string" ? answer : undefined} onChange={(value) => { setCompletionError(null); recommendation.reset(); selectSingle(question.id, value); }} />
        ) : (
          <MultiChoiceQuestion question={question} selections={selections} conflictingSelections={conflictingSelections ?? []} onToggle={(value) => { setCompletionError(null); recommendation.reset(); toggleMulti(question.id, value); }} />
        )}
        {completionError && <p className="mt-4 text-sm font-medium text-red-700" role="alert">{completionError}</p>}
        {recommendation.isError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
            <p className="text-sm font-medium text-red-800">{recommendation.error.message}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={submitAssessment} className="rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white">다시 시도</button>
              <button type="button" onClick={() => { recommendation.reset(); returnToLastQuestion(); }} className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-900">답변 수정하기</button>
            </div>
          </div>
        )}
      </div>
      <QuestionNavigation isFirst={currentIndex === 0} isLast={currentIndex === ASSESSMENT_QUESTIONS.length - 1} canContinue={canContinue} isPending={recommendation.isPending} onPrevious={movePrevious} onContinue={continueAssessment} />
    </section>
  );
}
