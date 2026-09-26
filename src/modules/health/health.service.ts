import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      service:
        this.configService.get<string>('app.name') ??
        'echogpt-backend',
      environment:
        this.configService.get<string>('app.nodeEnv') ??
        'development',
      timestamp: new Date().toISOString(),
    };
  }
}