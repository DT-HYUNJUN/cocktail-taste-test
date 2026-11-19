import { describe, expect, it } from 'vitest';
import {
  isCreateSharedResultResponse,
  isRecommendationResponse,
  isSharedResultResponse,
  parseRecommendationResponse,
} from './index.js';

const response = {
  profile: {
    dimensions: [{ dimension: 'sweet', score: 3 }],
    preferredFlavors: ['citrus'],
    avoidedFlavors: [],
    preferredBaseSpirits: ['gin'],
  },
  recommendations: [{
    rank: 1,
    cocktail: {
      id: 'tom-collins', name: 'Tom Collins', imageUrl: null,
      dimensions: { sweet: 3, sour: 4, bitter: 1, alcoholIntensity: 3, refreshing: 5 },
      flavors: ['citrus'], baseSpirits: ['gin'],
    },
    reasons: [{ type: 'core-match', dimensions: ['sweet'] }],
  }],
};

describe('recommendation HTTP contract', () => {
  it('accepts the backend RecommendationResult shape', () => {
    expect(isRecommendationResponse(response)).toBe(true);
    expect(parseRecommendationResponse(response)).toEqual(response);
  });

  it('rejects unknown vocabulary and incomplete cocktails', () => {
    expect(isRecommendationResponse({ ...response, profile: { ...response.profile, preferredFlavors: ['salty'] } })).toBe(false);
    expect(() => parseRecommendationResponse({ ...response, recommendations: [{ rank: 1, cocktail: {} }] })).toThrow('Invalid recommendation response');
  });

  it('rejects non-consecutive ranks, duplicate cocktails, and more than five recommendations', () => {
    const item = response.recommendations[0]!;
    expect(isRecommendationResponse({ ...response, recommendations: [{ ...item, rank: 2 }] })).toBe(false);
    expect(isRecommendationResponse({ ...response, recommendations: [item, { ...item, rank: 2 }] })).toBe(false);
    expect(isRecommendationResponse({ ...response, recommendations: Array.from({ length: 6 }, (_, index) => ({ ...item, rank: index + 1, cocktail: { ...item.cocktail, id: `cocktail-${index}` } })) })).toBe(false);
  });

  it('rejects reasons without matching profile and cocktail evidence', () => {
    const item = response.recommendations[0]!;
    expect(isRecommendationResponse({ ...response, recommendations: [{ ...item, reasons: [{ type: 'flavor-match', flavors: ['herbal'] }] }] })).toBe(false);
    expect(isRecommendationResponse({ ...response, recommendations: [{ ...item, reasons: [{ type: 'base-spirit-match', baseSpirits: ['rum'] }] }] })).toBe(false);
    expect(isRecommendationResponse({ ...response, recommendations: [{ ...item, reasons: [{ type: 'core-match', dimensions: ['refreshing'] }] }] })).toBe(false);
  });
});

describe('shared result HTTP contract', () => {
  it('accepts create and read responses with opaque IDs and timestamps', () => {
    expect(isCreateSharedResultResponse({
      shareId: 'abcdefghijklmnopqrstuv',
      expiresAt: '2026-12-17T00:00:00.000Z',
    })).toBe(true);
    expect(isSharedResultResponse({
      result: response,
      createdAt: '2026-11-17T00:00:00.000Z',
      expiresAt: '2026-12-17T00:00:00.000Z',
    })).toBe(true);
  });

  it('rejects malformed IDs, timestamps, and recommendation snapshots', () => {
    expect(isCreateSharedResultResponse({ shareId: 'short', expiresAt: '2026-12-17T00:00:00.000Z' })).toBe(false);
    expect(isSharedResultResponse({ result: {}, createdAt: 'invalid', expiresAt: 'invalid' })).toBe(false);
  });
});
