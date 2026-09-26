import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EncryptionService } from '../../common/security/encryption.service.js';
import { PrismaService } from '../../database/prisma.service.js';
import {
  AiProviderType,
  ProviderHealthStatus,
} from '../../generated/prisma/client.js';
import { ProviderRegistryService } from './adapters/provider-registry.service.js';
import { CreateAiProviderDto } from './dto/create-ai-provider.dto.js';
import { UpdateAiProviderDto } from './dto/update-ai-provider.dto.js';

@Injectable()
export class AiProvidersService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly encryptionService:
      EncryptionService,

    private readonly providerRegistry:
      ProviderRegistryService,
  ) {}

  async create(
    dto: CreateAiProviderDto,
  ) {
    const existing =
      await this.prisma.aiProvider.findUnique({
        where: {
          type: dto.type,
        },
      });

    if (existing) {
      throw new ConflictException(
        `Provider ${dto.type} is already configured`,
      );
    }

    const encryptedApiKey =
      dto.apiKey
        ? this.encryptionService.encrypt(
            dto.apiKey,
          )
        : null;

    const provider =
      await this.prisma.aiProvider.create({
        data: {
          type: dto.type,
          name: dto.name.trim(),

          baseUrl:
            dto.baseUrl?.replace(
              /\/+$/,
              '',
            ) ??
            this.getDefaultBaseUrl(
              dto.type,
            ),

          defaultModel:
            dto.defaultModel.trim(),

          encryptedApiKey,

          enabled: false,

          isDefault: false,

          healthStatus:
            ProviderHealthStatus.UNKNOWN,
        },
      });

    return this.toPublicProvider(
      provider,
    );
  }

  async findAll() {
    const providers =
      await this.prisma.aiProvider.findMany({
        orderBy: {
          createdAt: 'asc',
        },
      });

    return {
      providers:
        providers.map((provider) =>
          this.toPublicProvider(
            provider,
          ),
        ),
    };
  }

  async findOne(id: string) {
    const provider =
      await this.findProviderOrThrow(id);

    return this.toPublicProvider(
      provider,
    );
  }

  async update(
    id: string,
    dto: UpdateAiProviderDto,
  ) {
    await this.findProviderOrThrow(id);

    if (
      dto.apiKey &&
      dto.clearApiKey
    ) {
      throw new BadRequestException(
        'apiKey and clearApiKey cannot be used together',
      );
    }

    const provider =
      await this.prisma.aiProvider.update({
        where: {
          id,
        },

        data: {
          ...(dto.name !== undefined
            ? {
                name:
                  dto.name.trim(),
              }
            : {}),

          ...(dto.baseUrl !== undefined
            ? {
                baseUrl:
                  dto.baseUrl.replace(
                    /\/+$/,
                    '',
                  ),
              }
            : {}),

          ...(dto.defaultModel !==
          undefined
            ? {
                defaultModel:
                  dto.defaultModel.trim(),
              }
            : {}),

          ...(dto.apiKey
            ? {
                encryptedApiKey:
                  this.encryptionService.encrypt(
                    dto.apiKey,
                  ),

                healthStatus:
                  ProviderHealthStatus.UNKNOWN,

                lastHealthCheckAt:
                  null,
              }
            : {}),

          ...(dto.clearApiKey === true
            ? {
                encryptedApiKey:
                  null,

                enabled: false,

                isDefault: false,

                healthStatus:
                  ProviderHealthStatus.UNKNOWN,

                lastHealthCheckAt:
                  null,
              }
            : {}),
        },
      });

    return this.toPublicProvider(
      provider,
    );
  }

  async remove(id: string) {
    await this.findProviderOrThrow(id);

    await this.prisma.aiProvider.delete({
      where: {
        id,
      },
    });

    return {
      message:
        'AI provider deleted successfully',
    };
  }

  async setEnabled(
    id: string,
    enabled: boolean,
  ) {
    const provider =
      await this.findProviderOrThrow(id);

    if (
      enabled &&
      !provider.encryptedApiKey
    ) {
      throw new BadRequestException(
        'Provider cannot be enabled until an API key is configured',
      );
    }

    if (!enabled) {
      const updated =
        await this.prisma.aiProvider.update({
          where: {
            id,
          },

          data: {
            enabled: false,
            isDefault: false,
          },
        });

      return this.toPublicProvider(
        updated,
      );
    }

    const updated =
      await this.prisma.aiProvider.update({
        where: {
          id,
        },

        data: {
          enabled: true,
        },
      });

    return this.toPublicProvider(
      updated,
    );
  }

  async setDefault(id: string) {
    const provider =
      await this.findProviderOrThrow(id);

    if (!provider.enabled) {
      throw new BadRequestException(
        'Only an enabled provider can be selected as default',
      );
    }

    if (!provider.encryptedApiKey) {
      throw new BadRequestException(
        'Default provider must have an API key configured',
      );
    }

    await this.prisma.$transaction([
      this.prisma.aiProvider.updateMany({
        where: {
          isDefault: true,
        },

        data: {
          isDefault: false,
        },
      }),

      this.prisma.aiProvider.update({
        where: {
          id,
        },

        data: {
          isDefault: true,
        },
      }),
    ]);

    const updated =
      await this.findProviderOrThrow(id);

    return this.toPublicProvider(
      updated,
    );
  }

  async checkHealth(id: string) {
    const provider =
      await this.findProviderOrThrow(id);

    const checkedAt = new Date();

    if (!provider.encryptedApiKey) {
      const updated =
        await this.prisma.aiProvider.update({
          where: {
            id,
          },

          data: {
            healthStatus:
              ProviderHealthStatus.UNHEALTHY,

            lastHealthCheckAt:
              checkedAt,
          },
        });

      return {
        provider:
          this.toPublicProvider(
            updated,
          ),

        health: {
          healthy: false,

          message:
            'API key is not configured',
        },
      };
    }

    const apiKey =
      this.encryptionService.decrypt(
        provider.encryptedApiKey,
      );

    const adapter =
      this.providerRegistry.getAdapter(
        provider.type,
      );

    const health =
      await adapter.checkHealth({
        apiKey,

        baseUrl:
          provider.baseUrl ??
          this.getDefaultBaseUrl(
            provider.type,
          ),
      });

    const updated =
      await this.prisma.aiProvider.update({
        where: {
          id,
        },

        data: {
          healthStatus:
            health.healthy
              ? ProviderHealthStatus.HEALTHY
              : ProviderHealthStatus.UNHEALTHY,

          lastHealthCheckAt:
            checkedAt,
        },
      });

    return {
      provider:
        this.toPublicProvider(updated),

      health,
    };
  }

  private async findProviderOrThrow(
    id: string,
  ) {
    const provider =
      await this.prisma.aiProvider.findUnique({
        where: {
          id,
        },
      });

    if (!provider) {
      throw new NotFoundException(
        'AI provider not found',
      );
    }

    return provider;
  }

  private getDefaultBaseUrl(
    type: AiProviderType,
  ): string {
    switch (type) {
      case AiProviderType.OPENAI:
        return 'https://api.openai.com/v1';

      case AiProviderType.ANTHROPIC:
        return 'https://api.anthropic.com/v1';

      case AiProviderType.GEMINI:
        return 'https://generativelanguage.googleapis.com/v1beta';
    }
  }

  private toPublicProvider(
    provider: {
      id: string;
      type: AiProviderType;
      name: string;
      baseUrl: string | null;
      encryptedApiKey: string | null;
      defaultModel: string | null;
      enabled: boolean;
      isDefault: boolean;
      healthStatus:
        ProviderHealthStatus;
      lastHealthCheckAt:
        Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    return {
      id: provider.id,
      type: provider.type,
      name: provider.name,
      baseUrl: provider.baseUrl,

      defaultModel:
        provider.defaultModel,

      enabled: provider.enabled,

      isDefault:
        provider.isDefault,

      hasApiKey:
        Boolean(
          provider.encryptedApiKey,
        ),

      healthStatus:
        provider.healthStatus,

      lastHealthCheckAt:
        provider.lastHealthCheckAt,

      createdAt:
        provider.createdAt,

      updatedAt:
        provider.updatedAt,
    };
  }
}