import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CocktailEntity } from './entities/cocktail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CocktailEntity])],
})
export class CocktailsModule {}
