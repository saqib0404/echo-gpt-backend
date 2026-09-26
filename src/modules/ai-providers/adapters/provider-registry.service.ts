import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AiProviderType } from '../../../generated/prisma/client.js';
import { AnthropicAdapter } from './anthropic.adapter.js';
import { GeminiAdapter } from './gemini.adapter.js';
import { OpenAiAdapter } from './openai.adapter.js';
import { AiProviderAdapter } from './provider-adapter.interface.js';

@Injectable()
export class ProviderRegistryService {
  constructor(
    private readonly openAiAdapter:
      OpenAiAdapter,

    private readonly anthropicAdapter:
      AnthropicAdapter,

    private readonly geminiAdapter:
      GeminiAdapter,
  ) {}

  getAdapter(
    type: AiProviderType,
  ): AiProviderAdapter {
    switch (type) {
      case AiProviderType.OPENAI:
        return this.openAiAdapter;

      case AiProviderType.ANTHROPIC:
        return this.anthropicAdapter;

      case AiProviderType.GEMINI:
        return this.geminiAdapter;

      default:
        throw new NotFoundException(
          'Unsupported AI provider',
        );
    }
  }
}