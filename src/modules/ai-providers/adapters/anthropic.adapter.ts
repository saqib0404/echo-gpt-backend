import { Injectable } from '@nestjs/common';

import { AiProviderType } from '../../../generated/prisma/client.js';
import {
  AiProviderAdapter,
  ProviderHealthInput,
  ProviderHealthResult,
} from './provider-adapter.interface.js';

@Injectable()
export class AnthropicAdapter
  implements AiProviderAdapter
{
  readonly type =
    AiProviderType.ANTHROPIC;

  async checkHealth(
    input: ProviderHealthInput,
  ): Promise<ProviderHealthResult> {
    const baseUrl =
      input.baseUrl.replace(/\/+$/, '');

    try {
      const response = await fetch(
        `${baseUrl}/models`,
        {
          method: 'GET',

          headers: {
            'x-api-key':
              input.apiKey,

            'anthropic-version':
              '2023-06-01',

            Accept: 'application/json',
          },

          signal:
            AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        return {
          healthy: false,
          statusCode:
            response.status,

          message:
            `Anthropic returned HTTP ${response.status}`,
        };
      }

      return {
        healthy: true,
        statusCode: response.status,
        message:
          'Anthropic API credentials are valid',
      };
    } catch {
      return {
        healthy: false,
        message:
          'Unable to reach the Anthropic API',
      };
    }
  }
}