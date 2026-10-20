import type {
  BaseSpirit,
  Flavor,
  TasteScore,
} from '@cocktail-taste-test/domain';

export interface CocktailSeed {
  id: string;
  name: string;
  imageUrl: string | null;

  sweet: TasteScore;
  sour: TasteScore;
  bitter: TasteScore;
  alcoholIntensity: TasteScore;
  refreshing: TasteScore;

  flavors: Flavor[];
  baseSpirits: BaseSpirit[];

  isActive: boolean;
}
