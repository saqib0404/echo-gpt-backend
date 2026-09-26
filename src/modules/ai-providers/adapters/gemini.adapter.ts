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

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;

  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

@Injectable()
export class GeminiAdapter
  implements AiProviderAdapter
{
  readonly type =
    AiProviderType.GEMINI;

  async checkHealth(
    input: ProviderHealthInput,
  ): Promise<ProviderHealthResult> {
    const baseUrl =
      input.baseUrl.replace(/\/+$/, '');

    try {
      const response = await fetch(
        `${baseUrl}/models?pageSize=1`,
        {
          method: 'GET',

          headers: {
            'x-goog-api-key':
              input.apiKey,

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
            `Gemini returned HTTP ${response.status}`,
        };
      }

      return {
        healthy: true,
        statusCode:
          response.status,

        message:
          'Gemini API credentials are valid',
      };
    } catch {
      return {
        healthy: false,

        message:
          'Unable to reach the Gemini API',
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

    const contents =
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
                ? 'model'
                : 'user',

            parts: [
              {
                text:
                  message.content,
              },
            ],
          }),
        );

    const model =
      encodeURIComponent(input.model);

    let response: Response;

    try {
      response = await fetch(
        `${baseUrl}/models/${model}:generateContent`,
        {
          method: 'POST',

          headers: {
            'x-goog-api-key':
              input.apiKey,

            'Content-Type':
              'application/json',

            Accept: 'application/json',
          },

          body: JSON.stringify({
            ...(systemMessages
              ? {
                  system_instruction: {
                    parts: [
                      {
                        text:
                          systemMessages,
                      },
                    ],
                  },
                }
              : {}),

            contents,

            generationConfig: {
              maxOutputTokens: 1024,
            },
          }),

          signal:
            AbortSignal.timeout(60000),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Unable to reach the Gemini API',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `Gemini request failed with HTTP ${response.status}`,
      );
    }

    const data =
      (await response.json()) as GeminiResponse;

    const content =
      data.candidates?.[0]
        ?.content
        ?.parts
        ?.map(
          (part) =>
            part.text ?? '',
        )
        .join('')
        .trim() ?? '';

    if (!content) {
      throw new BadGatewayException(
        'Gemini returned no text response',
      );
    }

    return {
      content,

      model: input.model,

      usage: {
        promptTokens:
          data.usageMetadata
            ?.promptTokenCount ??
          null,

        outputTokens:
          data.usageMetadata
            ?.candidatesTokenCount ??
          null,

        totalTokens:
          data.usageMetadata
            ?.totalTokenCount ??
          null,
      },
    };
  }
}