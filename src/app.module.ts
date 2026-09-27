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
import authConfig from './config/auth.config.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import providerConfig from './config/provider.config.js';
import { AiProvidersModule } from './modules/ai-providers/ai-providers.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import searchConfig from './config/search.config.js';
import { WebSearchModule } from './modules/web-search/web-search.module.js';
import { AdminModule } from './modules/admin/admin.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,

      load: [
        appConfig,
        databaseConfig,
        authConfig,
        providerConfig,
        searchConfig,
      ],

      validationSchema:
        environmentValidationSchema,

      validationOptions: {
        // abortEarly: false,
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [
        ConfigService,
      ],

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

    AuthModule,

    UsersModule,

    SubscriptionsModule,

    AiProvidersModule,

    ChatModule,

    WebSearchModule,

    AdminModule,

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