import { Module } from '@nestjs/common';

import { AiProvidersModule } from '../ai-providers/ai-providers.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [
    AuthModule,
    AiProvidersModule,
    UsageModule,
  ],

  controllers: [
    ChatController,
  ],

  providers: [
    ChatService,
  ],

  exports: [
    ChatService,
  ],
})
export class ChatModule {}