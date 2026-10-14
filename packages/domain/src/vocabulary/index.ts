/** Canonical Phase 1 vocabulary. Order is also used for deterministic reasons. */
export const FLAVORS = [
  'citrus', 'fruity', 'tropical', 'herbal', 'floral',
  'creamy', 'coffee', 'spicy', 'smoky',
] as const;
export type Flavor = (typeof FLAVORS)[number];

/** The undocumented seventh spirit is intentionally excluded. */
export const BASE_SPIRITS = [
  'gin', 'vodka', 'rum', 'tequila', 'whiskey', 'mezcal',
] as const;
export type BaseSpirit = (typeof BASE_SPIRITS)[number];

export const TASTE_DIMENSIONS = [
  'sweet', 'sour', 'bitter', 'alcoholIntensity', 'refreshing',
] as const;
export type TasteDimension = (typeof TASTE_DIMENSIONS)[number];
