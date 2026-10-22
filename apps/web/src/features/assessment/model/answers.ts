import {
  ASSESSMENT_QUESTIONS,
  SCALE_ANSWER_IDS,
  type BaseSpiritAnswerId,
  type CoreQuestionId,
  type FlavorAnswerId,
  type MultiQuestionId,
  type ScaleAnswerId,
} from "./questions";

export type AssessmentAnswers = Partial<
  Record<CoreQuestionId, ScaleAnswerId>
  & Record<"preferred-flavors" | "avoided-flavors", FlavorAnswerId[]>
  & Record<"preferred-base-spirits", BaseSpiritAnswerId[]>
>;
export type AssessmentAnswer =
  | { questionId: CoreQuestionId; answerId: ScaleAnswerId }
  | { questionId: MultiQuestionId; answerIds: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function validatePartialAssessmentAnswers(value: unknown): AssessmentAnswers | null {
  if (!isRecord(value)) return null;
  const questionIds = new Set<string>(ASSESSMENT_QUESTIONS.map(({ id }) => id));
  if (Object.keys(value).some((id) => !questionIds.has(id))) return null;

  const validated: AssessmentAnswers = {};
  for (const question of ASSESSMENT_QUESTIONS) {
    if (!(question.id in value)) continue;
    const answer = value[question.id];
    if (question.kind === "single") {
      if (typeof answer !== "string" || !SCALE_ANSWER_IDS.some((id) => id === answer)) return null;
      validated[question.id] = answer as ScaleAnswerId;
      continue;
    }
    if (!Array.isArray(answer) || answer.some((item) => typeof item !== "string")) return null;
    const values = answer as string[];
    if (new Set(values).size !== values.length || values.some((item) => !question.options.some(({ id }) => id === item))) return null;
    if (question.maxSelections !== undefined && values.length > question.maxSelections) return null;
    if (question.id === "preferred-base-spirits") validated[question.id] = [...values] as BaseSpiritAnswerId[];
    else validated[question.id] = [...values] as FlavorAnswerId[];
  }
  const preferred = validated["preferred-flavors"];
  const avoided = validated["avoided-flavors"];
  if (preferred?.some((item) => avoided?.includes(item))) return null;
  return validated;
}

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
