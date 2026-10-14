import { describe, expect, it } from 'vitest';
import { calculateRecommendationMatch } from './index.js';
import type { CocktailProfile, UserTasteProfile } from '../profile/index.js';

const cocktail: CocktailProfile = {
  id: 'mojito', name: 'Mojito',
  dimensions: { sweet: 3, sour: 4, bitter: 1, alcoholIntensity: 2, refreshing: 5 },
  flavors: ['herbal', 'citrus'], baseSpirits: ['rum'],
};
const user: UserTasteProfile = {
  dimensions: { sweet: 1, sour: 5, bitter: 1, alcoholIntensity: 1, refreshing: 5 },
  preferredFlavors: ['herbal', 'citrus'], avoidedFlavors: ['smoky'],
  preferredBaseSpirits: ['rum'],
};

describe('RecommendationMatch v1', () => {
  it('calculates each known core distance and preserves separate evidence', () => {
    expect(calculateRecommendationMatch(user, cocktail)).toEqual({
      cocktailId: 'mojito', totalCoreDistance: 4,
      dimensionDistances: { sweet: 2, sour: 1, bitter: 0, alcoholIntensity: 1, refreshing: 0 },
      preferredFlavorMatches: ['citrus', 'herbal'],
      avoidedFlavorCollisions: [], preferredBaseSpiritMatches: ['rum'],
    });
  });

  it('excludes unknown core dimensions instead of substituting 3', () => {
    const partial = { ...user, dimensions: { sour: 4, refreshing: 5 } } satisfies UserTasteProfile;
    expect(calculateRecommendationMatch(partial, cocktail).dimensionDistances).toEqual({ sour: 0, refreshing: 0 });
    expect(calculateRecommendationMatch(partial, cocktail).totalCoreDistance).toBe(0);
  });

  it('retains avoidance collisions independently from preferred matches', () => {
    const conflicting = { ...user, avoidedFlavors: ['herbal', 'smoky'] } satisfies UserTasteProfile;
    const result = calculateRecommendationMatch(conflicting, cocktail);
    expect(result.preferredFlavorMatches).toEqual(['citrus', 'herbal']);
    expect(result.avoidedFlavorCollisions).toEqual(['herbal']);
  });

  it('is insensitive to order and duplicates in secondary selections', () => {
    const changed = {
      ...user, preferredFlavors: ['citrus', 'herbal', 'citrus'],
      preferredBaseSpirits: ['rum', 'rum'],
    } satisfies UserTasteProfile;
    expect(calculateRecommendationMatch(changed, cocktail)).toEqual(calculateRecommendationMatch(user, cocktail));
  });

  it('handles empty preferences and entirely unknown core dimensions', () => {
    const empty: UserTasteProfile = {
      dimensions: {}, preferredFlavors: [], avoidedFlavors: [], preferredBaseSpirits: [],
    };
    expect(calculateRecommendationMatch(empty, cocktail)).toEqual({
      cocktailId: 'mojito', totalCoreDistance: 0, dimensionDistances: {},
      preferredFlavorMatches: [], avoidedFlavorCollisions: [], preferredBaseSpiritMatches: [],
    });
  });

  it('does not mutate input profiles', () => {
    const beforeUser = structuredClone(user);
    const beforeCocktail = structuredClone(cocktail);
    calculateRecommendationMatch(user, cocktail);
    expect(user).toEqual(beforeUser);
    expect(cocktail).toEqual(beforeCocktail);
  });
});
