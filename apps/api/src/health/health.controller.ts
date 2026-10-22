import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

type HealthResponse = Readonly<{ status: 'ok' }>;

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  liveness(): HealthResponse {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness(): Promise<HealthResponse> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Service is not ready');
    }
  }
}
