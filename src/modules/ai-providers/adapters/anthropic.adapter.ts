import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';

import { AiProviderType } from '../../../generated/prisma/client.js';
import {
  AiProviderAdapter,
  ProviderGenerateInput,
  ProviderGenerateResult,
  ProviderHealthInput,
  ProviderHealthResult,
} from './provider-adapter.interface.js';

interface AnthropicResponse {
  model?: string;

  content?: Array<{
    type?: string;
    text?: string;
  }>;

  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

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
        statusCode:
          response.status,

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

  async generate(
    input: ProviderGenerateInput,
  ): Promise<ProviderGenerateResult> {
    const baseUrl =
      input.baseUrl.replace(/\/+$/, '');

    const systemMessages =
      input.messages
        .filter(
          (message) =>
            message.role === 'system',
        )
        .map(
          (message) => message.content,
        )
        .join('\n\n');

    const messages =
      input.messages
        .filter(
          (message) =>
            message.role !== 'system',
        )
        .map(
          (message) => ({
            role:
              message.role ===
              'assistant'
                ? 'assistant'
                : 'user',

            content:
              message.content,
          }),
        );

    let response: Response;

    try {
      response = await fetch(
        `${baseUrl}/messages`,
        {
          method: 'POST',

          headers: {
            'x-api-key':
              input.apiKey,

            'anthropic-version':
              '2023-06-01',

            'Content-Type':
              'application/json',

            Accept: 'application/json',
          },

          body: JSON.stringify({
            model: input.model,

            max_tokens: 1024,

            ...(systemMessages
              ? {
                  system:
                    systemMessages,
                }
              : {}),

            messages,
          }),

          signal:
            AbortSignal.timeout(60000),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Unable to reach the Anthropic API',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `Anthropic request failed with HTTP ${response.status}`,
      );
    }

    const data =
      (await response.json()) as AnthropicResponse;

    const content =
      data.content
        ?.filter(
          (item) =>
            item.type === 'text',
        )
        .map(
          (item) => item.text ?? '',
        )
        .join('')
        .trim() ?? '';

    if (!content) {
      throw new BadGatewayException(
        'Anthropic returned no text response',
      );
    }

    const promptTokens =
      data.usage?.input_tokens ??
      null;

    const outputTokens =
      data.usage?.output_tokens ??
      null;

    return {
      content,

      model:
        data.model ?? input.model,

      usage: {
        promptTokens,

        outputTokens,

        totalTokens:
          promptTokens !== null &&
          outputTokens !== null
            ? promptTokens +
              outputTokens
            : null,
      },
    };
  }
}