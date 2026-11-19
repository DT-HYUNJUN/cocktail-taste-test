import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecommendationModule } from '../recommendations/recommendation.module';
import { SharedResultEntity } from './entities/shared-result.entity';
import { SharedResultController } from './shared-result.controller';
import { SharedResultService } from './shared-result.service';

@Module({
  imports: [TypeOrmModule.forFeature([SharedResultEntity]), RecommendationModule],
  controllers: [SharedResultController],
  providers: [SharedResultService],
})
export class SharedResultModule {}
