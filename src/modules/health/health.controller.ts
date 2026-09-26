import { Controller, Get } from '@nestjs/common';
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
    summary: 'Check API health',
    description:
      'Returns the current status of the EchoGPT backend service.',
  })
  @ApiOkResponse({
    description: 'API is running successfully.',
    schema: {
      example: {
        status: 'ok',
        service: 'echogpt-backend',
        environment: 'development',
        timestamp: '2026-09-26T08:00:00.000Z',
      },
    },
  })
  getHealth() {
    return this.healthService.getHealth();
  }
}