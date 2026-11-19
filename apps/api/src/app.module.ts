import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { HealthModule } from './health/health.module';
import { RecommendationModule } from './recommendations/recommendation.module';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { SharedResultModule } from './shared-results/shared-result.module';

@Module({
  imports: [DatabaseModule, HealthModule, RecommendationModule, SharedResultModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
