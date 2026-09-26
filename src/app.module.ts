import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';
import appConfig from './config/app.config.js';
import databaseConfig from './config/database.config.js';
import { environmentValidationSchema } from './config/validation.schema.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [
        appConfig,
        databaseConfig,
      ],
      validationSchema: environmentValidationSchema,
      validationOptions: {
        // abortEarly: false,
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        throttlers: [
          {
            ttl:
              configService.get<number>(
                'app.throttle.ttl',
              ) ?? 60000,

            limit:
              configService.get<number>(
                'app.throttle.limit',
              ) ?? 100,
          },
        ],
      }),
    }),

    DatabaseModule,

    HealthModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}