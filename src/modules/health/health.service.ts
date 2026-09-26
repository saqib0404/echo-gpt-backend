import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service.js';


@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getHealth() {
    const databaseResult =
      await this.prisma.$queryRaw<
        Array<{ result: number }>
      >`
        SELECT 1 AS result
      `;

    const databaseConnected =
      databaseResult.length === 1;

    return {
      status: databaseConnected
        ? 'ok'
        : 'degraded',

      service:
        this.configService.get<string>(
          'app.name',
        ) ?? 'echogpt-backend',

      environment:
        this.configService.get<string>(
          'app.nodeEnv',
        ) ?? 'development',

      database: {
        provider: 'postgresql',
        host: 'neon',
        status: databaseConnected
          ? 'up'
          : 'down',
      },

      timestamp: new Date().toISOString(),
    };
  }
}