import {
  BASE_SPIRITS,
  FLAVORS,
  type BaseSpirit,
  type CocktailProfile,
  type Flavor,
  type TasteScore,
} from '@cocktail-taste-test/domain';
import type { CocktailEntity } from '../entities/cocktail.entity';

export class InvalidCocktailRowError extends Error {
  constructor(field: string) {
    super(`Invalid cocktail row field: ${field}`);
    this.name = 'InvalidCocktailRowError';
  }
}

function assertNonEmptyString(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new InvalidCocktailRowError(field);
  }
}

function parseScore(value: unknown, field: string): TasteScore {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 5
  ) {
    throw new InvalidCocktailRowError(field);
  }

  return value as TasteScore;
}

function parseVocabulary<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T[] {
  if (!Array.isArray(value)) {
    throw new InvalidCocktailRowError(field);
  }

  const unique = new Set<T>();

  for (const item of value) {
    if (
      typeof item !== 'string' ||
      !allowed.some((candidate) => candidate === item) ||
      unique.has(item as T)
    ) {
      throw new InvalidCocktailRowError(field);
    }

    unique.add(item as T);
  }

  return allowed.filter((item) => unique.has(item));
}

export type MappedCocktail = {
  cocktail: CocktailProfile;
  imageUrl: string | null;
};

export function mapCocktailEntity(row: CocktailEntity): MappedCocktail {
  assertNonEmptyString(row.id, 'id');
  assertNonEmptyString(row.name, 'name');

  if (
    row.imageUrl !== null &&
    (typeof row.imageUrl !== 'string' || !row.imageUrl.trim())
  ) {
    throw new InvalidCocktailRowError('imageUrl');
  }

  const flavors: Flavor[] = parseVocabulary(row.flavors, FLAVORS, 'flavors');

  const baseSpirits: BaseSpirit[] = parseVocabulary(
    row.baseSpirits,
    BASE_SPIRITS,
    'baseSpirits',
  );

  return {
    cocktail: {
      id: row.id,
      name: row.name,
      dimensions: {
        sweet: parseScore(row.sweet, 'sweet'),
        sour: parseScore(row.sour, 'sour'),
        bitter: parseScore(row.bitter, 'bitter'),
        alcoholIntensity: parseScore(row.alcoholIntensity, 'alcoholIntensity'),
        refreshing: parseScore(row.refreshing, 'refreshing'),
      },
      flavors,
      baseSpirits,
    },
    imageUrl: row.imageUrl,
  };
}
