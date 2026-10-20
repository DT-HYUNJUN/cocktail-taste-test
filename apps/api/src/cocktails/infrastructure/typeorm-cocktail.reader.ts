import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CocktailEntity } from '../entities/cocktail.entity';
import { mapCocktailEntity } from '../mappers/cocktail.mapper';

import type {
  CocktailReader,
  EligibleCocktailCandidates,
} from '../ports/cocktail-reader.port';

@Injectable()
export class TypeOrmCocktailReader implements CocktailReader {
  constructor(
    @InjectRepository(CocktailEntity)
    private readonly repository: Repository<CocktailEntity>,
  ) {}

  async findEligibleCandidates(): Promise<EligibleCocktailCandidates> {
    const rows = await this.repository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });

    const cocktails: EligibleCocktailCandidates['cocktails'] = [];
    const imageUrlsByCocktailId: EligibleCocktailCandidates['imageUrlsByCocktailId'] =
      Object.create(null);

    const seenIds = new Set<string>();

    for (const row of rows) {
      const mapped = mapCocktailEntity(row);
      const id = mapped.cocktail.id;

      if (seenIds.has(id)) {
        throw new Error(`Duplicate cocktail ID: ${id}`);
      }

      seenIds.add(id);
      cocktails.push(mapped.cocktail);
      imageUrlsByCocktailId[id] = mapped.imageUrl;
    }

    return {
      cocktails,
      imageUrlsByCocktailId,
    };
  }
}
