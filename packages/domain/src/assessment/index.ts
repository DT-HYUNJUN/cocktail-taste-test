import { BASE_SPIRITS, FLAVORS } from '../vocabulary/index.js';
import type { BaseSpirit, Flavor, TasteDimension } from '../vocabulary/index.js';
import type { TasteScore, UserTasteProfile } from '../profile/index.js';

export const CORE_QUESTION_IDS = ['sweet', 'sour', 'bitter', 'alcohol-intensity', 'refreshing'] as const;
export const MULTI_QUESTION_IDS = ['preferred-flavors', 'avoided-flavors', 'preferred-base-spirits'] as const;
export const ASSESSMENT_QUESTION_IDS = [...CORE_QUESTION_IDS, ...MULTI_QUESTION_IDS] as const;
export const SCALE_ANSWER_IDS = ['very-low', 'low', 'medium', 'high', 'very-high', 'unknown'] as const;
export type CoreQuestionId = (typeof CORE_QUESTION_IDS)[number];
export type MultiQuestionId = (typeof MULTI_QUESTION_IDS)[number];
export type AssessmentQuestionId = (typeof ASSESSMENT_QUESTION_IDS)[number];
export type ScaleAnswerId = (typeof SCALE_ANSWER_IDS)[number];
export type AssessmentAnswer =
  | { questionId: CoreQuestionId; answerId: ScaleAnswerId }
  | { questionId: MultiQuestionId; answerIds: string[] };

export class AssessmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssessmentValidationError';
  }
}

const coreToDimension: Record<CoreQuestionId, TasteDimension> = {
  sweet: 'sweet', sour: 'sour', bitter: 'bitter',
  'alcohol-intensity': 'alcoholIntensity', refreshing: 'refreshing',
};
const scoreById: Record<Exclude<ScaleAnswerId, 'unknown'>, TasteScore> = {
  'very-low': 1, low: 2, medium: 3, high: 4, 'very-high': 5,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const includes = (items: readonly string[], value: unknown): value is string =>
  typeof value === 'string' && items.includes(value);

/** Runtime validation is required because HTTP/JSON inputs are untrusted. */
export function validateAssessmentAnswers(input: unknown): AssessmentAnswer[] {
  if (!Array.isArray(input) || input.length !== ASSESSMENT_QUESTION_IDS.length) {
    throw new AssessmentValidationError('Exactly eight question answers are required');
  }
  const seen = new Set<string>();
  const answers: AssessmentAnswer[] = [];
  for (const raw of input as unknown[]) {
    if (!isRecord(raw) || !includes(ASSESSMENT_QUESTION_IDS, raw.questionId)) {
      throw new AssessmentValidationError('Unknown or missing questionId');
    }
    const id = raw.questionId as AssessmentQuestionId;
    if (seen.has(id)) throw new AssessmentValidationError(`Duplicate question: ${id}`);
    seen.add(id);
    if (includes(CORE_QUESTION_IDS, id)) {
      if (!includes(SCALE_ANSWER_IDS, raw.answerId) || 'answerIds' in raw || Object.keys(raw).some(k => !['questionId', 'answerId'].includes(k))) {
        throw new AssessmentValidationError(`Invalid scale answer: ${id}`);
      }
      answers.push({ questionId: id as CoreQuestionId, answerId: raw.answerId as ScaleAnswerId });
    } else {
      if (!Array.isArray(raw.answerIds) || 'answerId' in raw || Object.keys(raw).some(k => !['questionId', 'answerIds'].includes(k))) {
        throw new AssessmentValidationError(`Invalid multi-select answer: ${id}`);
      }
      const values: unknown[] = raw.answerIds;
      const vocabulary: readonly string[] = id === 'preferred-base-spirits' ? BASE_SPIRITS : FLAVORS;
      const max = id === 'avoided-flavors' ? FLAVORS.length : 2;
      if (values.length > max || values.some(v => !includes(vocabulary, v)) || new Set(values).size !== values.length) {
        throw new AssessmentValidationError(`Invalid selections: ${id}`);
      }
      answers.push({ questionId: id as MultiQuestionId, answerIds: values as string[] });
    }
  }
  for (const id of ASSESSMENT_QUESTION_IDS) {
    if (!seen.has(id)) throw new AssessmentValidationError(`Missing question: ${id}`);
  }
  const preferred = (answers.find(a => a.questionId === 'preferred-flavors') as { answerIds: string[] }).answerIds;
  const avoided = (answers.find(a => a.questionId === 'avoided-flavors') as { answerIds: string[] }).answerIds;
  if (preferred.some(v => avoided.includes(v))) {
    throw new AssessmentValidationError('Preferred and avoided flavors must not overlap');
  }
  return answers;
}

/** Direct mapping only: unknown core dimensions are absent, never score 3. */
export function transformAssessmentAnswers(input: unknown): UserTasteProfile {
  const answers = validateAssessmentAnswers(input);
  const byId = new Map(answers.map(a => [a.questionId, a]));
  const dimensions: UserTasteProfile['dimensions'] = {};
  for (const id of CORE_QUESTION_IDS) {
    const answer = byId.get(id) as { answerId: ScaleAnswerId };
    if (answer.answerId !== 'unknown') dimensions[coreToDimension[id]] = scoreById[answer.answerId];
  }
  const values = (id: MultiQuestionId) => (byId.get(id) as { answerIds: string[] }).answerIds;
  const sorted = <T extends string>(items: string[], order: readonly T[]): T[] =>
    order.filter(item => items.includes(item));
  return {
    dimensions,
    preferredFlavors: sorted<Flavor>(values('preferred-flavors'), FLAVORS),
    avoidedFlavors: sorted<Flavor>(values('avoided-flavors'), FLAVORS),
    preferredBaseSpirits: sorted<BaseSpirit>(values('preferred-base-spirits'), BASE_SPIRITS),
  };
}
