import type { CocktailId, CocktailProfile } from '@cocktail-taste-test/domain';

export const COCKTAIL_READER = Symbol('COCKTAIL_READER');

export interface EligibleCocktailCandidates {
  cocktails: CocktailProfile[];
  imageUrlsByCocktailId: Partial<Record<CocktailId, string | null>>;
}

export interface CocktailReader {
  findEligibleCandidates(): Promise<EligibleCocktailCandidates>;
}
