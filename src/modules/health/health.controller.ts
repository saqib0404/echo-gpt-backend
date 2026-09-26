import {
  Controller,
  Get,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { HealthService } from './health.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Check API and database health',
    description:
      'Checks the EchoGPT backend and verifies connectivity to the Neon PostgreSQL database.',
  })
  @ApiOkResponse({
    description:
      'API and PostgreSQL database are available.',
    schema: {
      example: {
        status: 'ok',
        service: 'echogpt-backend',
        environment: 'development',
        database: {
          provider: 'postgresql',
          host: 'neon',
          status: 'up',
        },
        timestamp:
          '2026-09-26T09:30:00.000Z',
      },
    },
  })
  async getHealth() {
    return this.healthService.getHealth();
  }
}