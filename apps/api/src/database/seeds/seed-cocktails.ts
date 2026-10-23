import { AppDataSource } from '../data-source';
import { CocktailEntity } from '../../cocktails/entities/cocktail.entity';
import { mapCocktailEntity } from '../../cocktails/mappers/cocktail.mapper';

import { cocktailSeeds } from './cocktail-seed.data';
import type { CocktailSeed } from './cocktail-seed.types';

export async function seedCocktails(
  seeds: readonly CocktailSeed[],
): Promise<number> {
  const ids = new Set<string>();

  // DB 연결 전에 전체 Seed를 검증한다.
  for (const seed of seeds) {
    if (ids.has(seed.id)) {
      throw new Error(`Duplicate seed ID: ${seed.id}`);
    }

    ids.add(seed.id);

    mapCocktailEntity({
      ...seed,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CocktailEntity);

    if (seed.isActive) {
      throw new Error(`Seed activation requires separate approval: ${seed.id}`);
    }
  }

  if (seeds.length === 0) {
    return 0;
  }

  await AppDataSource.initialize();

  try {
    return await AppDataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CocktailEntity);
      let inserted = 0;

      for (const seed of seeds) {
        const result = await repository
          .createQueryBuilder()
          .insert()
          .into(CocktailEntity)
          .values({
            ...seed,
            isActive: false,
          })
          .orIgnore()
          .returning(['id'])
          .execute();
        inserted += Array.isArray(result.raw) ? result.raw.length : 0;
      }

      return inserted;
    });
  } finally {
    await AppDataSource.destroy();
  }
}

async function main() {
  const count = await seedCocktails(cocktailSeeds);
  console.log(`Seed inserted: ${count} cocktails`);
}

export function isSeedCliEntry(entryPath: string | undefined): boolean {
  return /\/seed-cocktails\.[cm]?[jt]s$/.test(
    entryPath?.replaceAll('\\', '/') ?? '',
  );
}

if (isSeedCliEntry(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
