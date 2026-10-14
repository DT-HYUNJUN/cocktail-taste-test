import { describe, expect, it } from 'vitest';
import type { CocktailProfile, UserTasteProfile } from '../profile/index.js';
import { buildRecommendationReasons } from './index.js';

const cocktail = (id: string, values: [1|2|3|4|5, 1|2|3|4|5, 1|2|3|4|5, 1|2|3|4|5, 1|2|3|4|5], flavors: CocktailProfile['flavors'], baseSpirits: CocktailProfile['baseSpirits']): CocktailProfile => ({
  id, name: id,
  dimensions: { sweet: values[0], sour: values[1], bitter: values[2], alcoholIntensity: values[3], refreshing: values[4] },
  flavors, baseSpirits,
});
const user = (dimensions: UserTasteProfile['dimensions'], preferredFlavors: UserTasteProfile['preferredFlavors'] = [], avoidedFlavors: UserTasteProfile['avoidedFlavors'] = [], preferredBaseSpirits: UserTasteProfile['preferredBaseSpirits'] = []): UserTasteProfile => ({ dimensions, preferredFlavors, avoidedFlavors, preferredBaseSpirits });

const mojito = cocktail('mojito', [3,4,1,2,5], ['citrus','herbal'], ['rum']);
const pina = cocktail('pina-colada', [5,2,1,2,3], ['tropical','creamy'], ['rum']);
const oldFashioned = cocktail('old-fashioned', [2,1,3,5,1], ['spicy'], ['whiskey']);
const americano = cocktail('americano', [2,1,5,2,4], ['herbal'], []);

describe('Reason Builder v1', () => {
  it('RB golden G-001: Mojito core and flavor, no unsupported base spirit', () => {
    expect(buildRecommendationReasons(user({ sweet:1,sour:5,bitter:1,alcoholIntensity:1,refreshing:5 }, ['herbal','citrus'], ['smoky']), mojito)).toEqual([
      {type:'core-match', dimensions:['bitter','refreshing']},
      {type:'flavor-match', flavors:['citrus','herbal']},
    ]);
  });
  it('RB golden G-002: Piña Colada emits three groups', () => {
    expect(buildRecommendationReasons(user({sweet:5,sour:1,bitter:1,alcoholIntensity:1,refreshing:2}, ['creamy','tropical'], ['coffee'], ['rum']), pina)).toEqual([
      {type:'core-match',dimensions:['sweet','bitter']},
      {type:'flavor-match',flavors:['tropical','creamy']},
      {type:'base-spirit-match',baseSpirits:['rum']},
    ]);
  });
  it('RB golden G-003: Old Fashioned core selection respects distance and distinctiveness', () => {
    expect(buildRecommendationReasons(user({sweet:1,sour:1,bitter:3,alcoholIntensity:5,refreshing:1}, ['spicy'], [], ['whiskey']), oldFashioned)).toEqual([
      {type:'core-match',dimensions:['sour','alcoholIntensity']},
      {type:'flavor-match',flavors:['spicy']},
      {type:'base-spirit-match',baseSpirits:['whiskey']},
    ]);
  });
  it('RB golden G-004: Americano does not fabricate smoky, gin or mezcal', () => {
    expect(buildRecommendationReasons(user({sweet:1,sour:1,bitter:5,alcoholIntensity:3,refreshing:3}, ['smoky','herbal'], ['creamy'], ['mezcal','gin']), americano)).toEqual([
      {type:'core-match',dimensions:['sour','bitter']},
      {type:'flavor-match',flavors:['herbal']},
    ]);
  });
  it('RB golden G-005: unknown core dimensions excluded', () => {
    expect(buildRecommendationReasons(user({sour:4,refreshing:5}), mojito)).toEqual([
      {type:'core-match',dimensions:['refreshing','sour']},
    ]);
  });
  it('RB-009: no positive evidence returns an empty list', () => {
    expect(buildRecommendationReasons(user({sweet:1}, ['coffee'], ['herbal'], ['vodka']), cocktail('x',[5,5,5,5,5], ['herbal'], ['gin']))).toEqual([]);
  });
  it('RB-008: canonical order, limits and multi-select permutation invariance', () => {
    const c = cocktail('x',[3,3,3,3,3], ['smoky','citrus','fruity','herbal'], ['mezcal','rum','gin']);
    const a = user({}, ['herbal','fruity','citrus','smoky'], [], ['mezcal','gin','rum']);
    const b = user({}, [...a.preferredFlavors].reverse(), [], [...a.preferredBaseSpirits].reverse());
    expect(buildRecommendationReasons(a,c)).toEqual([
      {type:'flavor-match',flavors:['citrus','fruity']},
      {type:'base-spirit-match',baseSpirits:['gin']},
    ]);
    expect(buildRecommendationReasons(a,c)).toEqual(buildRecommendationReasons(b,{...c,flavors:[...c.flavors].reverse(),baseSpirits:[...c.baseSpirits].reverse()}));
  });
  it('RB-008: core ties use canonical dimension order', () => {
    expect(buildRecommendationReasons(user({sweet:3,sour:3,bitter:3,alcoholIntensity:3,refreshing:3}), cocktail('x',[3,3,3,3,3],[],[]))).toEqual([
      {type:'core-match',dimensions:['sweet','sour']},
    ]);
  });
  it('RB-011: avoided preferences do not produce positive reasons', () => {
    expect(buildRecommendationReasons(user({},[],['citrus'],[]),mojito)).toEqual([]);
  });
  it('RB-010/012: does not mutate profiles or depend on ranking input', () => {
    const u = user({sour:5}, ['herbal','citrus'], ['smoky'], ['rum']);
    const before = JSON.stringify([u,mojito]);
    const first = buildRecommendationReasons(u,mojito);
    const second = buildRecommendationReasons(u,mojito);
    expect(first).toEqual(second);
    expect(JSON.stringify([u,mojito])).toBe(before);
  });
});
