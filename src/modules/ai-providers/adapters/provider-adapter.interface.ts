import { AiProviderType } from '../../../generated/prisma/client.js';

export interface ProviderHealthInput {
  apiKey: string;
  baseUrl: string;
}

export interface ProviderHealthResult {
  healthy: boolean;
  statusCode?: number;
  message: string;
}

export type ProviderMessageRole =
  | 'system'
  | 'user'
  | 'assistant';

export interface ProviderMessage {
  role: ProviderMessageRole;
  content: string;
}

export interface ProviderGenerateInput {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ProviderMessage[];
}

export interface ProviderGenerateResult {
  content: string;
  model: string;

  usage: {
    promptTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
}

export interface AiProviderAdapter {
  readonly type: AiProviderType;

  checkHealth(
    input: ProviderHealthInput,
  ): Promise<ProviderHealthResult>;

  generate(
    input: ProviderGenerateInput,
  ): Promise<ProviderGenerateResult>;
}