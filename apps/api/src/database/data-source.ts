import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { CreateCocktails1792022400000 } from './migrations/1792022400000-CreateCocktails';
import { CocktailEntity } from '../cocktails/entities/cocktail.entity';
import { createDatabaseConnectionOptions } from './database-options';

config({ path: '.env' });

export const AppDataSource = new DataSource({
  ...createDatabaseConnectionOptions('maintenance'),
  entities: [CocktailEntity],
  synchronize: false,
  migrationsTableName: 'typeorm_migrations',
  migrations: [CreateCocktails1792022400000],
});
