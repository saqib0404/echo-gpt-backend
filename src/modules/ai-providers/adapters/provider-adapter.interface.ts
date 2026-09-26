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

export interface AiProviderAdapter {
  readonly type: AiProviderType;

  checkHealth(
    input: ProviderHealthInput,
  ): Promise<ProviderHealthResult>;
}