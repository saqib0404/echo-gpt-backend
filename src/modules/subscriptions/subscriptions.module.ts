import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
  imports: [
    AuthModule,
    UsageModule,
  ],

  controllers: [
    SubscriptionsController,
  ],

  providers: [
    SubscriptionsService,
  ],

  exports: [
    SubscriptionsService,
  ],
})
export class SubscriptionsModule {}