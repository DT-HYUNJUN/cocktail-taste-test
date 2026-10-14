import { TASTE_DIMENSIONS, FLAVORS, BASE_SPIRITS } from '../vocabulary/index.js';
import type { Flavor, BaseSpirit, TasteDimension } from '../vocabulary/index.js';
import type { CocktailId, CocktailProfile, UserTasteProfile } from '../profile/index.js';

/** Internal evidence only. Never expose this structure as a public recommendation DTO. */
export type RecommendationMatch = {
  cocktailId: CocktailId;
  totalCoreDistance: number;
  dimensionDistances: Partial<Record<TasteDimension, number>>;
  preferredFlavorMatches: Flavor[];
  avoidedFlavorCollisions: Flavor[];
  preferredBaseSpiritMatches: BaseSpirit[];
};

/** Calculates evidence, not a weighted score or a ranking. */
export function calculateRecommendationMatch(
  user: UserTasteProfile,
  cocktail: CocktailProfile,
): RecommendationMatch {
  const dimensionDistances: Partial<Record<TasteDimension, number>> = {};
  let totalCoreDistance = 0;
  for (const dimension of TASTE_DIMENSIONS) {
    const userScore = user.dimensions[dimension];
    if (userScore === undefined) continue;
    const distance = Math.abs(userScore - cocktail.dimensions[dimension]);
    dimensionDistances[dimension] = distance;
    totalCoreDistance += distance;
  }

  const intersection = <T extends string>(
    vocabulary: readonly T[], preferences: readonly T[], available: readonly T[],
  ): T[] => {
    const preferredSet = new Set(preferences);
    const availableSet = new Set(available);
    return vocabulary.filter(value => preferredSet.has(value) && availableSet.has(value));
  };

  return {
    cocktailId: cocktail.id,
    totalCoreDistance,
    dimensionDistances,
    preferredFlavorMatches: intersection(FLAVORS, user.preferredFlavors, cocktail.flavors),
    avoidedFlavorCollisions: intersection(FLAVORS, user.avoidedFlavors, cocktail.flavors),
    preferredBaseSpiritMatches: intersection(BASE_SPIRITS, user.preferredBaseSpirits, cocktail.baseSpirits),
  };
}
