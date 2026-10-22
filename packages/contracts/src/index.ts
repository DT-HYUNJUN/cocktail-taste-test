export const FLAVORS = [
  'citrus', 'fruity', 'tropical', 'herbal', 'floral',
  'creamy', 'coffee', 'spicy', 'smoky',
] as const;
export const BASE_SPIRITS = ['gin', 'vodka', 'rum', 'tequila', 'whiskey', 'mezcal'] as const;
export const TASTE_DIMENSIONS = ['sweet', 'sour', 'bitter', 'alcoholIntensity', 'refreshing'] as const;
export const CORE_QUESTION_IDS = ['sweet', 'sour', 'bitter', 'alcohol-intensity', 'refreshing'] as const;
export const MULTI_QUESTION_IDS = ['preferred-flavors', 'avoided-flavors', 'preferred-base-spirits'] as const;
export const SCALE_ANSWER_IDS = ['very-low', 'low', 'medium', 'high', 'very-high', 'unknown'] as const;

export type Flavor = (typeof FLAVORS)[number];
export type BaseSpirit = (typeof BASE_SPIRITS)[number];
export type TasteDimension = (typeof TASTE_DIMENSIONS)[number];
export type TasteScore = 1 | 2 | 3 | 4 | 5;
export type CoreQuestionId = (typeof CORE_QUESTION_IDS)[number];
export type MultiQuestionId = (typeof MULTI_QUESTION_IDS)[number];
export type ScaleAnswerId = (typeof SCALE_ANSWER_IDS)[number];
export type AssessmentAnswer =
  | { questionId: CoreQuestionId; answerId: ScaleAnswerId }
  | { questionId: MultiQuestionId; answerIds: string[] };
export type CreateRecommendationRequest = { answers: AssessmentAnswer[] };

export type TasteDimensionSummary = { dimension: TasteDimension; score: TasteScore };
export type UserTasteSummary = {
  dimensions: TasteDimensionSummary[];
  preferredFlavors: Flavor[];
  avoidedFlavors: Flavor[];
  preferredBaseSpirits: BaseSpirit[];
};
export type CocktailSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  dimensions: Record<TasteDimension, TasteScore>;
  flavors: Flavor[];
  baseSpirits: BaseSpirit[];
};
export type RecommendationReason =
  | { type: 'core-match'; dimensions: TasteDimension[] }
  | { type: 'flavor-match'; flavors: Flavor[] }
  | { type: 'base-spirit-match'; baseSpirits: BaseSpirit[] };
export type RecommendationItem = { rank: number; cocktail: CocktailSummary; reasons: RecommendationReason[] };
export type RecommendationResponse = { profile: UserTasteSummary; recommendations: RecommendationItem[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isMember = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && values.includes(value as T);
const isArrayOf = <T>(value: unknown, guard: (item: unknown) => item is T): value is T[] =>
  Array.isArray(value) && value.every(guard);
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).every((key) => keys.includes(key));
const isScore = (value: unknown): value is TasteScore =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;

function isDimensionSummary(value: unknown): value is TasteDimensionSummary {
  return isRecord(value) && hasOnlyKeys(value, ['dimension', 'score']) &&
    isMember(TASTE_DIMENSIONS, value.dimension) && isScore(value.score);
}

function isReason(value: unknown): value is RecommendationReason {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  if (value.type === 'core-match') return hasOnlyKeys(value, ['type', 'dimensions']) && isArrayOf(value.dimensions, (item): item is TasteDimension => isMember(TASTE_DIMENSIONS, item));
  if (value.type === 'flavor-match') return hasOnlyKeys(value, ['type', 'flavors']) && isArrayOf(value.flavors, (item): item is Flavor => isMember(FLAVORS, item));
  if (value.type === 'base-spirit-match') return hasOnlyKeys(value, ['type', 'baseSpirits']) && isArrayOf(value.baseSpirits, (item): item is BaseSpirit => isMember(BASE_SPIRITS, item));
  return false;
}

function isCocktail(value: unknown): value is CocktailSummary {
  if (!isRecord(value) || !hasOnlyKeys(value, ['id', 'name', 'imageUrl', 'dimensions', 'flavors', 'baseSpirits'])) return false;
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || !(value.imageUrl === null || typeof value.imageUrl === 'string')) return false;
  const dimensions = value.dimensions;
  if (!isRecord(dimensions) || !hasOnlyKeys(dimensions, TASTE_DIMENSIONS) || !TASTE_DIMENSIONS.every((key) => isScore(dimensions[key]))) return false;
  return isArrayOf(value.flavors, (item): item is Flavor => isMember(FLAVORS, item)) &&
    isArrayOf(value.baseSpirits, (item): item is BaseSpirit => isMember(BASE_SPIRITS, item));
}

export function isRecommendationResponse(value: unknown): value is RecommendationResponse {
  if (!isRecord(value) || !hasOnlyKeys(value, ['profile', 'recommendations']) || !isRecord(value.profile)) return false;
  const profile = value.profile;
  if (!hasOnlyKeys(profile, ['dimensions', 'preferredFlavors', 'avoidedFlavors', 'preferredBaseSpirits'])) return false;
  const validProfile = isArrayOf(profile.dimensions, isDimensionSummary) &&
    isArrayOf(profile.preferredFlavors, (item): item is Flavor => isMember(FLAVORS, item)) &&
    isArrayOf(profile.avoidedFlavors, (item): item is Flavor => isMember(FLAVORS, item)) &&
    isArrayOf(profile.preferredBaseSpirits, (item): item is BaseSpirit => isMember(BASE_SPIRITS, item));
  if (!validProfile || !isArrayOf(value.recommendations, (item): item is RecommendationItem =>
    isRecord(item) && hasOnlyKeys(item, ['rank', 'cocktail', 'reasons']) &&
    typeof item.rank === 'number' && Number.isInteger(item.rank) && item.rank >= 1 &&
    isCocktail(item.cocktail) && isArrayOf(item.reasons, isReason)) || value.recommendations.length > 5) return false;

  const response = value as RecommendationResponse;
  const profileDimensions = new Map(response.profile.dimensions.map(({ dimension, score }) => [dimension, score]));
  if (profileDimensions.size !== response.profile.dimensions.length) return false;
  const cocktailIds = new Set<string>();
  const reasonOrder = ['core-match', 'flavor-match', 'base-spirit-match'] as const;

  return response.recommendations.every((item, index) => {
    if (item.rank !== index + 1 || cocktailIds.has(item.cocktail.id)) return false;
    cocktailIds.add(item.cocktail.id);
    if (new Set(item.cocktail.flavors).size !== item.cocktail.flavors.length || new Set(item.cocktail.baseSpirits).size !== item.cocktail.baseSpirits.length) return false;
    let previousReasonIndex = -1;
    return item.reasons.every((reason) => {
      const currentReasonIndex = reasonOrder.indexOf(reason.type);
      if (currentReasonIndex <= previousReasonIndex) return false;
      previousReasonIndex = currentReasonIndex;
      if (reason.type === 'core-match') {
        return reason.dimensions.length > 0 && reason.dimensions.length <= 2 && new Set(reason.dimensions).size === reason.dimensions.length &&
          reason.dimensions.every((dimension) => {
            const score = profileDimensions.get(dimension);
            return score !== undefined && Math.abs(score - item.cocktail.dimensions[dimension]) <= 1;
          });
      }
      if (reason.type === 'flavor-match') {
        return reason.flavors.length > 0 && reason.flavors.length <= 2 && new Set(reason.flavors).size === reason.flavors.length &&
          reason.flavors.every((flavor) => response.profile.preferredFlavors.includes(flavor) && item.cocktail.flavors.includes(flavor));
      }
      return reason.baseSpirits.length === 1 && response.profile.preferredBaseSpirits.includes(reason.baseSpirits[0]!) && item.cocktail.baseSpirits.includes(reason.baseSpirits[0]!);
    });
  });
}

export function parseRecommendationResponse(value: unknown): RecommendationResponse {
  if (!isRecommendationResponse(value)) throw new Error('Invalid recommendation response');
  return value;
}
