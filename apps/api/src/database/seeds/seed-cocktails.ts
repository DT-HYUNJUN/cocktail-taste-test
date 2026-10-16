import { AppDataSource } from '../data-source';
import { CocktailEntity } from '../../cocktails/entities/cocktail.entity';
import { mapCocktailEntity } from '../../cocktails/mappers/cocktail.mapper';

import { cocktailSeeds } from './cocktail-seed.data';
import type { CocktailSeed } from './cocktail-seed.types';

export async function seedCocktails(
  seeds: readonly CocktailSeed[],
): Promise<number> {
  const ids = new Set<string>();

  for (const seed of seeds) {
    if (ids.has(seed.id)) {
      throw new Error(`Duplicate seed ID: ${seed.id}`);
    }

    ids.add(seed.id);

    // Mapper의 기존 런타임 검증 재사용
    mapCocktailEntity({
      ...seed,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CocktailEntity);

    // 검토 완료 전에는 활성화 금지
    if (seed.isActive) {
      throw new Error(`Seed activation requires separate approval: ${seed.id}`);
    }
  }

  if (seeds.length === 0) {
    return 0;
  }

  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const repository = manager.getRepository(CocktailEntity);

      for (const seed of seeds) {
        await repository.upsert(
          {
            ...seed,
            isActive: false,
          },
          ['id'],
        );
      }
    });

    return seeds.length;
  } finally {
    await AppDataSource.destroy();
  }
}

async function main() {
  const count = await seedCocktails(cocktailSeeds);
  console.log(`Seed completed: ${count} cocktails`);
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/seed-cocktails.ts')) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
