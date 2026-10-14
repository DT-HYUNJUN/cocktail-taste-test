import { BASE_SPIRITS, FLAVORS, TASTE_DIMENSIONS } from '../vocabulary/index.js';
import type { BaseSpirit, Flavor, TasteDimension } from '../vocabulary/index.js';
import type { CocktailId, CocktailProfile, TasteDimensions, TasteScore, UserTasteProfile } from '../profile/index.js';
import { calculateRecommendationMatch } from '../recommendation-match/index.js';
import { rankRecommendationMatches } from '../ranking-policy/index.js';
import { buildRecommendationReasons } from '../reason-builder/index.js';
import type { RecommendationReason } from '../reason-builder/index.js';

export type TasteDimensionSummary = { dimension: TasteDimension; score: TasteScore };
export type UserTasteSummary = {
  dimensions: TasteDimensionSummary[];
  preferredFlavors: Flavor[];
  avoidedFlavors: Flavor[];
  preferredBaseSpirits: BaseSpirit[];
};
export type CocktailSummary = {
  id: CocktailId;
  name: string;
  imageUrl: string | null;
  dimensions: TasteDimensions;
  flavors: Flavor[];
  baseSpirits: BaseSpirit[];
};
export type RecommendationItem = {
  /** One-based display position; NOT a semantic dominance indicator. */
  rank: number;
  cocktail: CocktailSummary;
  reasons: RecommendationReason[];
};
export type RecommendationResult = {
  profile: UserTasteSummary;
  recommendations: RecommendationItem[];
};

/** Optional display-only image enrichment. Missing entries become null. */
export type RecommendationResultOptions = {
  imageUrlsByCocktailId?: Readonly<Partial<Record<CocktailId, string | null>>>;
};

const canonicalIntersection = <T extends string>(vocabulary: readonly T[], selected: readonly T[]): T[] => {
  const set = new Set(selected);
  return vocabulary.filter(value => set.has(value));
};

/** Build the public v1 result from an already eligible candidate set. Does not filter or truncate. */
export function buildRecommendationResult(
  user: UserTasteProfile,
  eligibleCocktails: readonly CocktailProfile[],
  options: RecommendationResultOptions = {},
): RecommendationResult {
  const byId = new Map<CocktailId, CocktailProfile>();
  for (const cocktail of eligibleCocktails) {
    if (byId.has(cocktail.id)) throw new Error(`Duplicate cocktail ID: ${cocktail.id}`);
    byId.set(cocktail.id, cocktail);
  }

  const ranked = rankRecommendationMatches(
    eligibleCocktails.map(cocktail => calculateRecommendationMatch(user, cocktail)),
  );

  return {
    profile: {
      dimensions: TASTE_DIMENSIONS.flatMap(dimension => {
        const score = user.dimensions[dimension];
        return score === undefined ? [] : [{ dimension, score }];
      }),
      preferredFlavors: canonicalIntersection(FLAVORS, user.preferredFlavors),
      avoidedFlavors: canonicalIntersection(FLAVORS, user.avoidedFlavors),
      preferredBaseSpirits: canonicalIntersection(BASE_SPIRITS, user.preferredBaseSpirits),
    },
    recommendations: ranked.map(({ match, presentationRank }) => {
      const cocktail = byId.get(match.cocktailId);
      if (!cocktail) throw new Error(`Missing cocktail: ${match.cocktailId}`);
      return {
        rank: presentationRank,
        cocktail: {
          id: cocktail.id,
          name: cocktail.name,
          imageUrl: options.imageUrlsByCocktailId?.[cocktail.id] ?? null,
          dimensions: { ...cocktail.dimensions },
          flavors: canonicalIntersection(FLAVORS, cocktail.flavors),
          baseSpirits: canonicalIntersection(BASE_SPIRITS, cocktail.baseSpirits),
        },
        reasons: buildRecommendationReasons(user, cocktail),
      };
    }),
  };
}
