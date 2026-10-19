import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { CreateCocktails1792022400000 } from './migrations/1792022400000-CreateCocktails';
import { CocktailEntity } from 'src/cocktails/entities/cocktail.entity';

config({ path: '.env' });

const required = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
] as const;

for (const key of required) {
  if (!process.env[key]?.trim()) {
    throw new Error(`Missing database environment variable: ${key}`);
  }
}

const port = Number(process.env.DATABASE_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DATABASE_PORT must be a valid TCP port');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [CocktailEntity],
  synchronize: false,
  migrationsTableName: 'typeorm_migrations',
  migrations: [CreateCocktails1792022400000],
});
