import { describe, expect, it } from 'vitest';
import { BASE_SPIRITS, FLAVORS, TASTE_DIMENSIONS } from './index.js';

describe('canonical vocabulary v1', () => {
  it('contains exactly nine flavors in canonical order', () => {
    expect(FLAVORS).toEqual(['citrus', 'fruity', 'tropical', 'herbal', 'floral', 'creamy', 'coffee', 'spicy', 'smoky']);
  });
  it('contains exactly six accepted base spirits', () => {
    expect(BASE_SPIRITS).toEqual(['gin', 'vodka', 'rum', 'tequila', 'whiskey', 'mezcal']);
  });
  it('contains the five core dimensions', () => {
    expect(TASTE_DIMENSIONS).toEqual(['sweet', 'sour', 'bitter', 'alcoholIntensity', 'refreshing']);
  });
});
