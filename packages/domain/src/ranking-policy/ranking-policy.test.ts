import { describe, expect, it } from 'vitest';
import type { RecommendationMatch } from '../recommendation-match/index.js';
import { compareRecommendationMatches as compare, rankRecommendationMatches as rank } from './index.js';

const make = (id: string, core: number, flavor = 0, avoided = 0, spirit = 0): RecommendationMatch => ({
  cocktailId: id,
  totalCoreDistance: core,
  dimensionDistances: {},
  preferredFlavorMatches: ['citrus', 'herbal', 'floral'].slice(0, flavor) as RecommendationMatch['preferredFlavorMatches'],
  avoidedFlavorCollisions: ['smoky', 'coffee'].slice(0, avoided) as RecommendationMatch['avoidedFlavorCollisions'],
  preferredBaseSpiritMatches: ['gin', 'rum'].slice(0, spirit) as RecommendationMatch['preferredBaseSpiritMatches'],
});

const relation = (a: RecommendationMatch, b: RecommendationMatch) => compare(a, b);

describe('Ranking Policy v1 synthetic cases', () => {
  it('RP-001 material Core advantage wins', () => expect(relation(make('a', 2), make('b', 4))).toBe('dominates'));
  it('RP-002 secondary advantages cannot reverse material Core', () => expect(relation(make('a', 2), make('b', 4, 3, 0, 2))).toBe('dominates'));
  it('RP-003 gap 2 is material', () => expect(relation(make('a', 3), make('b', 5, 3))).toBe('dominates'));
  it('RP-004 same Core better Flavor', () => expect(relation(make('a', 2, 2), make('b', 2, 1))).toBe('dominates'));
  it('RP-005 same Core better BaseSpirit', () => expect(relation(make('a', 2, 0, 0, 1), make('b', 2))).toBe('dominates'));
  it('RP-006 fewer avoided collisions', () => expect(relation(make('a', 2), make('b', 2, 0, 1))).toBe('dominates'));
  it('RP-007 better Core versus better Flavor', () => expect(relation(make('a', 2), make('b', 3, 1))).toBe('incomparable'));
  it('RP-008 better Core versus better BaseSpirit', () => expect(relation(make('a', 2), make('b', 3, 0, 0, 1))).toBe('incomparable'));
  it('RP-009 better Core versus multiple secondary advantages', () => expect(relation(make('a', 2), make('b', 3, 3, 0, 2))).toBe('incomparable'));
  it('RP-010 identical evidence is a tie', () => expect(relation(make('a', 2, 1), make('b', 2, 1))).toBe('tie'));
  it('RP-011 partial profile identical evidence is a tie', () => expect(relation(make('a', 0), make('b', 0))).toBe('tie'));
  it('RP-012 conflicting secondary evidence is incomparable', () => expect(relation(make('a', 2, 1, 1), make('b', 2, 0, 0))).toBe('incomparable'));
  it('RP-013 incomparability differs from tie and dominance', () => {
    const a = make('a', 2); const b = make('b', 3, 1);
    expect(relation(a, b)).toBe('incomparable');
    expect(relation(a, make('c', 2))).toBe('tie');
    expect(relation(a, make('d', 4))).toBe('dominates');
    expect(relation(make('d', 4), a)).toBe('dominated');
  });
  it('RP-014 builds non-dominated layers and stable order', () => {
    const a = make('a', 2); const b = make('b', 3, 1); const c = make('c', 5);
    expect(rank([c, b, a]).map(x => [x.match.cocktailId, x.semanticLayer, x.presentationRank])).toEqual([
      ['a', 1, 1], ['b', 1, 2], ['c', 2, 3],
    ]);
  });
  it('RP-015 dominated candidate cannot enter higher layer', () => {
    const a = make('a', 1); const b = make('b', 3);
    expect(rank([b, a]).map(x => x.semanticLayer)).toEqual([1, 2]);
  });
});

describe('ranking invariants', () => {
  it('stable across input permutations and uses ID for same-layer presentation ties', () => {
    const a = make('z', 2); const b = make('a', 2);
    expect(rank([a, b]).map(x => x.match.cocktailId)).toEqual(['a', 'z']);
    expect(rank([b, a]).map(x => x.match.cocktailId)).toEqual(['a', 'z']);
  });
  it('rejects duplicate IDs', () => expect(() => rank([make('a', 1), make('a', 2)])).toThrow('Duplicate cocktail ID'));
  it('does not mutate the input', () => {
    const input = [make('b', 4), make('a', 2)];
    rank(input);
    expect(input.map(x => x.cocktailId)).toEqual(['b', 'a']);
  });
});
