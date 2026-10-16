import { Module } from '@nestjs/common';

import { CocktailsModule } from '../cocktails/cocktails.module';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [CocktailsModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
