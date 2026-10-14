import { describe, expect, it } from 'vitest';
import type { CocktailProfile, UserTasteProfile } from '../profile/index.js';
import { buildRecommendationResult } from './index.js';

const dimensions = { sweet: 3, sour: 4, bitter: 1, alcoholIntensity: 2, refreshing: 5 } as const;
const user: UserTasteProfile = {
  dimensions: { sour: 4, refreshing: 5 },
  preferredFlavors: ['herbal', 'citrus'], avoidedFlavors: ['smoky'], preferredBaseSpirits: ['rum'],
};
const cocktails: CocktailProfile[] = [
  { id: 'tom-collins', name: 'Tom Collins', dimensions, flavors: ['citrus'], baseSpirits: ['gin'] },
  { id: 'mojito', name: 'Mojito', dimensions, flavors: ['herbal', 'citrus'], baseSpirits: ['rum'] },
];

describe('RecommendationResult v1', () => {
  it('RR-001/002 ranks by policy with consecutive one-based ordinals', () => {
    const result = buildRecommendationResult(user, cocktails);
    expect(result.recommendations.map(item => [item.rank, item.cocktail.id])).toEqual([[1, 'mojito'], [2, 'tom-collins']]);
  });
  it('RR-003 rejects duplicate cocktail IDs', () => {
    expect(() => buildRecommendationResult(user, [cocktails[0]!, cocktails[0]!])).toThrow('Duplicate cocktail ID');
  });
  it('RR-004/005/006/011 emits only actual positive structured reasons', () => {
    const { reasons } = buildRecommendationResult(user, cocktails).recommendations[0]!;
    expect(reasons).toEqual([
      { type: 'core-match', dimensions: ['refreshing', 'sour'] },
      { type: 'flavor-match', flavors: ['citrus', 'herbal'] },
      { type: 'base-spirit-match', baseSpirits: ['rum'] },
    ]);
  });
  it('RR-007 excludes all internal ranking and evidence fields', () => {
    const result = buildRecommendationResult(user, cocktails);
    expect(Object.keys(result.recommendations[0]!)).toEqual(['rank', 'cocktail', 'reasons']);
    expect(Object.keys(result.recommendations[0]!.cocktail)).toEqual(['id', 'name', 'imageUrl', 'dimensions', 'flavors', 'baseSpirits']);
  });
  it('RR-008 retains unknown omission and explicitly known neutral 3', () => {
    const result = buildRecommendationResult({ ...user, dimensions: { sweet: 3 } }, []);
    expect(result.profile.dimensions).toEqual([{ dimension: 'sweet', score: 3 }]);
    expect(result.recommendations).toEqual([]);
  });
  it('RR-009/013 preserves determinism under input and preference permutations', () => {
    const a = buildRecommendationResult(user, cocktails);
    const b = buildRecommendationResult({ ...user, preferredFlavors: ['citrus', 'herbal'] }, [...cocktails].reverse());
    expect(b).toEqual(a);
  });
  it('RR-012 emits canonical vocabulary order without duplicates', () => {
    const result = buildRecommendationResult({ ...user, preferredFlavors: ['herbal', 'citrus', 'herbal'] }, cocktails);
    expect(result.profile.preferredFlavors).toEqual(['citrus', 'herbal']);
    expect(result.recommendations[0]!.cocktail.flavors).toEqual(['citrus', 'herbal']);
  });
  it('returns null images by default and accepts optional display enrichment', () => {
    expect(buildRecommendationResult(user, cocktails).recommendations[0]!.cocktail.imageUrl).toBeNull();
    expect(buildRecommendationResult(user, cocktails, { imageUrlsByCocktailId: { mojito: 'https://example.com/mojito.png' } }).recommendations[0]!.cocktail.imageUrl).toBe('https://example.com/mojito.png');
  });
  it('does not mutate input data', () => {
    const before = JSON.stringify({ user, cocktails });
    buildRecommendationResult(user, cocktails);
    expect(JSON.stringify({ user, cocktails })).toBe(before);
  });
  it('returns an empty result for zero eligible cocktails', () => {
    expect(buildRecommendationResult(user, []).recommendations).toEqual([]);
  });
});
