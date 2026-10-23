import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';

export function createNestApplication(): Promise<INestApplication> {
  return NestFactory.create(AppModule);
}
