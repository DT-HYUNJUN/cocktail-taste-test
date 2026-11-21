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
import { RecommendationLoading } from "../../recommendation/ui/recommendation-loading";

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

  useEffect(() => {
    void hydrateAssessmentStore();
  }, []);
  useEffect(() => {
    if (hasHydrated && !recommendation.isSuccess) titleRef.current?.focus();
  }, [currentIndex, hasHydrated, recommendation.isSuccess]);

  if (!hasHydrated) {
    return (
      <section className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-5" aria-busy="true" aria-live="polite">
        <p className="rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-muted-foreground">지난 취향을 다시 꺼내는 중이에요...</p>
      </section>
    );
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
    recommendation.mutate(
      { answers: serialized },
      {
        onSuccess: (result) => {
          if (saveRecommendationResult(result) === null) {
            setCompletionError("추천 결과를 안전하게 저장하지 못했습니다. 다시 시도해 주세요.");
            recommendation.reset();
            return;
          }
          router.push("/result");
        },
      },
    );
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

  if (recommendation.isPending || recommendation.isSuccess) {
    return <RecommendationLoading />;
  }

  const canContinue = question.kind === "multi" || typeof answer === "string";
  const conflictingSelections = question.id === "preferred-flavors" ? answers["avoided-flavors"] : question.id === "avoided-flavors" ? answers["preferred-flavors"] : [];

  return (
    <section className="relative mx-auto w-full max-w-4xl px-4 py-6 sm:px-8 sm:py-10 lg:py-12" aria-labelledby="question-title">
      <div aria-hidden="true" className="absolute top-24 -left-10 size-36 rounded-full bg-lilac/35 blur-3xl" />
      <div aria-hidden="true" className="absolute right-0 bottom-20 size-40 rounded-full bg-lime/30 blur-3xl" />

      <div key={question.id} className="question-transition relative rounded-image border border-border bg-surface p-5 shadow-[0_24px_70px_rgba(48,35,43,0.08)] sm:p-8 lg:p-10">
        <QuestionHeader index={currentIndex} total={ASSESSMENT_QUESTIONS.length} title={question.title} titleRef={titleRef} />
        <div>
          {question.kind === "single" ? (
            <SingleChoiceQuestion
              question={question}
              answer={typeof answer === "string" ? answer : undefined}
              onChange={(value) => {
                setCompletionError(null);
                recommendation.reset();
                selectSingle(question.id, value);
              }}
            />
          ) : (
            <MultiChoiceQuestion
              question={question}
              selections={selections}
              conflictingSelections={conflictingSelections ?? []}
              onToggle={(value) => {
                setCompletionError(null);
                recommendation.reset();
                toggleMulti(question.id, value);
              }}
            />
          )}
          {completionError && (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
              {completionError}
            </p>
          )}
          {recommendation.isError && (
            <div className="mt-5 rounded-card border border-red-200 bg-red-50 p-5" role="alert">
              <p className="text-sm font-semibold text-red-800">잠깐, 잔을 준비하다 문제가 생겼어요. {recommendation.error.message}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={submitAssessment} className="rounded-button bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={() => {
                    recommendation.reset();
                    returnToLastQuestion();
                  }}
                  className="rounded-button border-2 border-border bg-surface px-5 py-2.5 text-sm font-bold text-foreground"
                >
                  답변 수정하기
                </button>
              </div>
            </div>
          )}
        </div>
        <QuestionNavigation
          isFirst={currentIndex === 0}
          isLast={currentIndex === ASSESSMENT_QUESTIONS.length - 1}
          canContinue={canContinue}
          isPending={recommendation.isPending}
          onPrevious={movePrevious}
          onContinue={continueAssessment}
        />
      </div>
    </section>
  );
}
