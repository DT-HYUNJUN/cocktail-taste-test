import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database.module';
import { HealthModule } from './health/health.module';
import { RecommendationModule } from './recommendations/recommendation.module';

@Module({
  imports: [DatabaseModule, HealthModule, RecommendationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
