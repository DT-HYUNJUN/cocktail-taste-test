import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { AssessmentValidationError } from '@cocktail-taste-test/domain';
import type {
  CreateSharedResultResponse,
  SharedResultResponse,
} from '@cocktail-taste-test/contracts';

import { SharedResultService } from './shared-result.service';

@Controller('shared-results')
export class SharedResultController {
  constructor(private readonly sharedResultService: SharedResultService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown): Promise<CreateSharedResultResponse> {
    if (
      typeof body !== 'object' ||
      body === null ||
      Array.isArray(body) ||
      !('answers' in body) ||
      Object.keys(body).length !== 1
    ) {
      throw new BadRequestException('Invalid shared result request');
    }

    try {
      return await this.sharedResultService.create(body.answers);
    } catch (error) {
      if (error instanceof AssessmentValidationError) {
        throw new BadRequestException('Invalid assessment answers');
      }
      throw error;
    }
  }

  @Get(':id')
  async find(@Param('id') id: string): Promise<SharedResultResponse> {
    const sharedResult = await this.sharedResultService.find(id);
    if (!sharedResult) throw new NotFoundException('Shared result not found');
    return sharedResult;
  }
}
