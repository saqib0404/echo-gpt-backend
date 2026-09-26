import { Injectable } from '@nestjs/common';

import { AiProviderType } from '../../../generated/prisma/client.js';
import {
  AiProviderAdapter,
  ProviderHealthInput,
  ProviderHealthResult,
} from './provider-adapter.interface.js';

@Injectable()
export class OpenAiAdapter
  implements AiProviderAdapter
{
  readonly type =
    AiProviderType.OPENAI;

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
            Authorization:
              `Bearer ${input.apiKey}`,
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
            `OpenAI returned HTTP ${response.status}`,
        };
      }

      return {
        healthy: true,
        statusCode: response.status,
        message:
          'OpenAI API credentials are valid',
      };
    } catch {
      return {
        healthy: false,
        message:
          'Unable to reach the OpenAI API',
      };
    }
  }
}