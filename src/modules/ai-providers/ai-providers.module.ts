import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard.js';
import { EncryptionService } from '../../common/security/encryption.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { AiProvidersController } from './ai-providers.controller.js';
import { AiProvidersService } from './ai-providers.service.js';
import { AnthropicAdapter } from './adapters/anthropic.adapter.js';
import { GeminiAdapter } from './adapters/gemini.adapter.js';
import { OpenAiAdapter } from './adapters/openai.adapter.js';
import { ProviderRegistryService } from './adapters/provider-registry.service.js';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    AiProvidersController,
  ],

  providers: [
    AiProvidersService,
    EncryptionService,
    RolesGuard,

    OpenAiAdapter,
    AnthropicAdapter,
    GeminiAdapter,

    ProviderRegistryService,
  ],

  exports: [
    AiProvidersService,
    ProviderRegistryService,
    EncryptionService,
  ],
})
export class AiProvidersModule {}