import { describe, expect, it } from 'vitest';
import { transformAssessmentAnswers } from '../assessment/index.js';
import { calculateRecommendationMatch } from '../recommendation-match/index.js';
import { compareRecommendationMatches, rankRecommendationMatches } from '../ranking-policy/index.js';
import { buildRecommendationReasons } from '../reason-builder/index.js';
import { buildRecommendationResult } from '../recommendation-result/index.js';
import { GOLDEN_COCKTAILS, GOLDEN_PERSONAS } from './fixtures.js';

const cocktail = (id: string) => {
  const found = GOLDEN_COCKTAILS.find(c => c.id === id);
  if (!found) throw new Error(`Missing canonical fixture: ${id}`);
  return found;
};
const profile = (id: keyof typeof GOLDEN_PERSONAS) => GOLDEN_PERSONAS[id].profile;
const match = (id: keyof typeof GOLDEN_PERSONAS, cocktailId: string) => calculateRecommendationMatch(profile(id), cocktail(cocktailId));
const expectedRelations = [
  ['G-001','mojito','tom-collins','dominates'],
  ['G-001','mojito','negroni','dominates'],
  ['G-001','tom-collins','negroni','dominates'],
  ['G-001','margarita','mezcal-margarita','dominates'],
  ['G-002','pina-colada','tequila-sunrise','dominates'],
  ['G-002','pina-colada','mojito','dominates'],
  ['G-002','pina-colada','espresso-martini','dominates'],
  ['G-003','old-fashioned','manhattan','dominates'],
  ['G-003','old-fashioned','dry-martini','dominates'],
  ['G-003','manhattan','dry-martini','incomparable'],
  ['G-004','negroni','americano','dominates'],
  ['G-004','americano','mezcal-margarita','dominates'],
  ['G-004','negroni','mezcal-margarita','dominates'],
  ['G-005','tom-collins','mojito','tie'],
] as const;

const reasonExpectations = [
  ['G-001','mojito', [{type:'core-match',dimensions:['bitter','refreshing']},{type:'flavor-match',flavors:['citrus','herbal']}]],
  ['G-002','pina-colada', [{type:'core-match',dimensions:['sweet','bitter']},{type:'flavor-match',flavors:['tropical','creamy']},{type:'base-spirit-match',baseSpirits:['rum']}]],
  ['G-003','old-fashioned', [{type:'core-match',dimensions:['sour','alcoholIntensity']},{type:'flavor-match',flavors:['spicy']},{type:'base-spirit-match',baseSpirits:['whiskey']}]],
  ['G-004','americano', [{type:'core-match',dimensions:['sour','bitter']},{type:'flavor-match',flavors:['herbal']}]],
  ['G-005','mojito', [{type:'core-match',dimensions:['refreshing','sour']}]],
  ['G-005','tom-collins', [{type:'core-match',dimensions:['refreshing','sour']}]],
] as const;

describe('P2-07 Golden Cases v1: canonical Assessment → Profile', () => {
  for (const [id, fixture] of Object.entries(GOLDEN_PERSONAS)) {
    it(`${id}: transforms the complete eight-question submission to exact canonical profile`, () => {
      expect(transformAssessmentAnswers(fixture.answers)).toEqual(fixture.profile);
    });
  }
  it('G-005 keeps unknown dimensions absent rather than filling score 3', () => {
    expect(Object.keys(transformAssessmentAnswers(GOLDEN_PERSONAS['G-005'].answers).dimensions)).toEqual(['sour','refreshing']);
  });
});

describe('P2-07 Golden Cases v1: 14 semantic ranking relationships', () => {
  for (const [persona, left, right, expected] of expectedRelations) {
    it(`${persona}: ${left} vs ${right} = ${expected}`, () => {
      const a = match(persona, left);
      const b = match(persona, right);
      expect(compareRecommendationMatches(a,b)).toBe(expected);
      const reverse = expected === 'dominates' ? 'dominated' : expected;
      expect(compareRecommendationMatches(b,a)).toBe(reverse);
    });
  }
  it('G-003 material Core priority is not overridden by secondary evidence', () => {
    expect(match('G-003','old-fashioned').totalCoreDistance).toBe(1);
    expect(match('G-003','manhattan').totalCoreDistance).toBe(4);
    expect(match('G-003','dry-martini').totalCoreDistance).toBe(3);
  });
  it('G-005 ignores unknown Core dimensions when matching', () => {
    expect(match('G-005','mojito').dimensionDistances).toEqual({sour:0,refreshing:0});
    expect(match('G-005','tom-collins').dimensionDistances).toEqual({sour:0,refreshing:0});
  });
});

describe('P2-07 Golden Cases v1: structured reasons', () => {
  for (const [persona, cocktailId, expected] of reasonExpectations) {
    it(`${persona} / ${cocktailId}: emits exact ordered positive reasons`, () => {
      expect(buildRecommendationReasons(profile(persona), cocktail(cocktailId))).toEqual(expected);
    });
  }
  it('multi-select permutation does not affect G-004 reasons', () => {
    const original = profile('G-004');
    const reversed = {...original, preferredFlavors:[...original.preferredFlavors].reverse(), preferredBaseSpirits:[...original.preferredBaseSpirits].reverse()};
    expect(buildRecommendationReasons(reversed,cocktail('negroni'))).toEqual(buildRecommendationReasons(original,cocktail('negroni')));
  });
});

describe('P2-07 Golden Cases v1: end-to-end result', () => {
  for (const [id, fixture] of Object.entries(GOLDEN_PERSONAS)) {
    it(`${id}: assembles stable public output with no internal ranking evidence`, () => {
      const user = transformAssessmentAnswers(fixture.answers);
      const result = buildRecommendationResult(user, GOLDEN_COCKTAILS);
      const shuffled = buildRecommendationResult(user, [...GOLDEN_COCKTAILS].reverse());
      expect(result).toEqual(shuffled);
      expect(result.recommendations).toHaveLength(12);
      expect(result.recommendations.map(x=>x.rank)).toEqual(Array.from({length:12},(_,i)=>i+1));
      expect(new Set(result.recommendations.map(x=>x.cocktail.id)).size).toBe(12);
      for (const item of result.recommendations) {
        expect(Object.keys(item)).toEqual(['rank','cocktail','reasons']);
        expect(item).not.toHaveProperty('semanticLayer');
        expect(item).not.toHaveProperty('totalCoreDistance');
        expect(item.reasons).toEqual(buildRecommendationReasons(user,cocktail(item.cocktail.id)));
      }
    });
  }
  it('G-005 true semantic tie does not become a semantic ranking claim', () => {
    const user = profile('G-005');
    const ranked = rankRecommendationMatches(['mojito','tom-collins'].map(id=>match('G-005',id)));
    expect(ranked.map(x=>x.semanticLayer)).toEqual([1,1]);
    expect(ranked.map(x=>x.match.cocktailId)).toEqual(['mojito','tom-collins']);
    const result = buildRecommendationResult(user, [cocktail('tom-collins'),cocktail('mojito')]);
    expect(result.recommendations.map(x=>x.rank)).toEqual([1,2]);
  });
});
