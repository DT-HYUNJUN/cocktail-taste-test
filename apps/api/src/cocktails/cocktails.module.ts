import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CocktailEntity } from './entities/cocktail.entity';
import { COCKTAIL_READER } from './ports/cocktail-reader.port';
import { TypeOrmCocktailReader } from './infrastructure/typeorm-cocktail.reader';

@Module({
  imports: [TypeOrmModule.forFeature([CocktailEntity])],
  providers: [
    {
      provide: COCKTAIL_READER,
      useClass: TypeOrmCocktailReader,
    },
  ],
  exports: [COCKTAIL_READER],
})
export class CocktailsModule {}
