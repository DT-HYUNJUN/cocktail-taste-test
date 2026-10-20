import {
  ASSESSMENT_QUESTIONS,
  SCALE_ANSWER_IDS,
  type AssessmentQuestionId,
  type CoreQuestionId,
  type MultiQuestionId,
  type ScaleAnswerId,
} from "./questions";

export type AssessmentAnswers = Partial<Record<AssessmentQuestionId, string | string[]>>;
export type AssessmentAnswer =
  | { questionId: CoreQuestionId; answerId: ScaleAnswerId }
  | { questionId: MultiQuestionId; answerIds: string[] };

export function serializeAssessmentAnswers(answers: AssessmentAnswers): AssessmentAnswer[] | null {
  const preferred = answers["preferred-flavors"];
  const avoided = answers["avoided-flavors"];
  if (!Array.isArray(preferred) || !Array.isArray(avoided) || preferred.some((value) => avoided.includes(value))) return null;

  const serialized: AssessmentAnswer[] = [];
  for (const question of ASSESSMENT_QUESTIONS) {
    const answer = answers[question.id];
    if (question.kind === "single") {
      if (typeof answer !== "string" || !SCALE_ANSWER_IDS.some((id) => id === answer)) return null;
      serialized.push({ questionId: question.id, answerId: answer as ScaleAnswerId });
      continue;
    }
    if (!Array.isArray(answer)) return null;
    if (new Set(answer).size !== answer.length || answer.some((value) => !question.options.some(({ id }) => id === value))) return null;
    if (question.maxSelections !== undefined && answer.length > question.maxSelections) return null;
    serialized.push({ questionId: question.id, answerIds: [...answer] });
  }
  return serialized;
}
