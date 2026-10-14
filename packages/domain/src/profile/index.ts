import type { BaseSpirit, Flavor, TasteDimension } from '../vocabulary/index.js';

export type TasteScore = 1 | 2 | 3 | 4 | 5;
export type TasteDimensions = Record<TasteDimension, TasteScore>;

/** Missing dimension means unknown, never implicitly score 3. */
export type UserTasteProfile = {
  dimensions: Partial<TasteDimensions>;
  preferredFlavors: Flavor[];
  avoidedFlavors: Flavor[];
  preferredBaseSpirits: BaseSpirit[];
};

/** Stable identifier; storage and ID generation are deferred. */
export type CocktailId = string;
export type CocktailProfile = {
  id: CocktailId;
  name: string;
  dimensions: TasteDimensions;
  flavors: Flavor[];
  baseSpirits: BaseSpirit[];
};
