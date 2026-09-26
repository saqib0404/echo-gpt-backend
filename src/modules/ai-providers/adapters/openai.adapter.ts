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

interface OpenAiResponse {
  model?: string;

  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;

  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
}

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
          statusCode: response.status,
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

  async generate(
    input: ProviderGenerateInput,
  ): Promise<ProviderGenerateResult> {
    const baseUrl =
      input.baseUrl.replace(/\/+$/, '');

    let response: Response;

    try {
      response = await fetch(
        `${baseUrl}/responses`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${input.apiKey}`,

            'Content-Type':
              'application/json',

            Accept: 'application/json',
          },

          body: JSON.stringify({
            model: input.model,

            input:
              input.messages.map(
                (message) => ({
                  role:
                    message.role === 'system'
                      ? 'developer'
                      : message.role,

                  content:
                    message.content,
                }),
              ),

            max_output_tokens: 1024,

            store: false,
          }),

          signal:
            AbortSignal.timeout(60000),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Unable to reach the OpenAI API',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `OpenAI request failed with HTTP ${response.status}`,
      );
    }

    const data =
      (await response.json()) as OpenAiResponse;

    const content =
      data.output
        ?.flatMap(
          (item) =>
            item.content ?? [],
        )
        .filter(
          (item) =>
            item.type === 'output_text',
        )
        .map(
          (item) => item.text ?? '',
        )
        .join('')
        .trim() ?? '';

    if (!content) {
      throw new BadGatewayException(
        'OpenAI returned no text response',
      );
    }

    return {
      content,

      model:
        data.model ?? input.model,

      usage: {
        promptTokens:
          data.usage?.input_tokens ??
          null,

        outputTokens:
          data.usage?.output_tokens ??
          null,

        totalTokens:
          data.usage?.total_tokens ??
          null,
      },
    };
  }
}