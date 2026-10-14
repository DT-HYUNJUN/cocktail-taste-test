import { BASE_SPIRITS, FLAVORS, TASTE_DIMENSIONS } from '../vocabulary/index.js';
import type { BaseSpirit, Flavor, TasteDimension } from '../vocabulary/index.js';
import type { CocktailProfile, UserTasteProfile } from '../profile/index.js';

export type CoreMatchReason = { type: 'core-match'; dimensions: TasteDimension[] };
export type FlavorMatchReason = { type: 'flavor-match'; flavors: Flavor[] };
export type BaseSpiritMatchReason = { type: 'base-spirit-match'; baseSpirits: BaseSpirit[] };
export type RecommendationReason = CoreMatchReason | FlavorMatchReason | BaseSpiritMatchReason;

/** Pure, positive-only evidence builder; never changes ranking or produces prose. */
export function buildRecommendationReasons(
  user: UserTasteProfile,
  cocktail: CocktailProfile,
): RecommendationReason[] {
  const core = TASTE_DIMENSIONS
    .flatMap((dimension, canonicalIndex) => {
      const userScore = user.dimensions[dimension];
      if (userScore === undefined) return [];
      const distance = Math.abs(userScore - cocktail.dimensions[dimension]);
      if (distance > 1) return [];
      return [{ dimension, distance, distinctiveness: Math.abs(userScore - 3), canonicalIndex }];
    })
    .sort((a, b) => a.distance - b.distance || b.distinctiveness - a.distinctiveness || a.canonicalIndex - b.canonicalIndex)
    .slice(0, 2)
    .map(({ dimension }) => dimension);

  const preferredFlavors = new Set(user.preferredFlavors);
  const cocktailFlavors = new Set(cocktail.flavors);
  const flavors = FLAVORS.filter(flavor => preferredFlavors.has(flavor) && cocktailFlavors.has(flavor)).slice(0, 2);

  const preferredBaseSpirits = new Set(user.preferredBaseSpirits);
  const cocktailBaseSpirits = new Set(cocktail.baseSpirits);
  const baseSpirits = BASE_SPIRITS.filter(spirit => preferredBaseSpirits.has(spirit) && cocktailBaseSpirits.has(spirit)).slice(0, 1);

  const reasons: RecommendationReason[] = [];
  if (core.length > 0) reasons.push({ type: 'core-match', dimensions: core });
  if (flavors.length > 0) reasons.push({ type: 'flavor-match', flavors });
  if (baseSpirits.length > 0) reasons.push({ type: 'base-spirit-match', baseSpirits });
  return reasons;
}
