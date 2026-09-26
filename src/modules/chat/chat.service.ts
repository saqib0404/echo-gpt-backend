import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service.js';
import {
  MessageRole,
  UsageType,
} from '../../generated/prisma/client.js';
import { AiProvidersService } from '../ai-providers/ai-providers.service.js';
import { ProviderRegistryService } from '../ai-providers/adapters/provider-registry.service.js';
import {
  ProviderMessage,
} from '../ai-providers/adapters/provider-adapter.interface.js';
import { UsageService } from '../usage/usage.service.js';
import { SendPromptDto } from './dto/send-prompt.dto.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly aiProvidersService:
      AiProvidersService,

    private readonly providerRegistry:
      ProviderRegistryService,

    private readonly usageService:
      UsageService,
  ) {}

  async sendPrompt(
    userId: string,
    dto: SendPromptDto,
  ) {
    await this.usageService
      .assertWithinLimit(userId);

    const prompt = dto.prompt.trim();

    let conversation =
      dto.conversationId
        ? await this.getOwnedConversation(
            userId,
            dto.conversationId,
          )
        : null;

    let requestedProviderId =
      dto.providerId;

    if (conversation) {
      if (
        requestedProviderId &&
        conversation.providerId &&
        requestedProviderId !==
          conversation.providerId
      ) {
        throw new BadRequestException(
          'Provider cannot be changed inside an existing conversation',
        );
      }

      requestedProviderId =
        conversation.providerId ??
        requestedProviderId;
    }

    const provider =
      await this.aiProvidersService
        .resolveForChat(
          requestedProviderId,
        );

    if (!conversation) {
      conversation =
        await this.prisma
          .conversation.create({
            data: {
              userId,
              providerId:
                provider.id,

              model:
                provider.model,

              title:
                this.createTitle(
                  prompt,
                ),
            },
          });
    } else if (
      conversation.providerId === null
    ) {
      conversation =
        await this.prisma
          .conversation.update({
            where: {
              id:
                conversation.id,
            },

            data: {
              providerId:
                provider.id,

              model:
                provider.model,
            },
          });
    }

    const userMessage =
      await this.prisma
        .chatMessage.create({
          data: {
            conversationId:
              conversation.id,

            role:
              MessageRole.USER,

            content:
              prompt,

            model:
              provider.model,
          },
        });

    const history =
      await this.prisma
        .chatMessage.findMany({
          where: {
            conversationId:
              conversation.id,
          },

          orderBy: {
            createdAt: 'asc',
          },

          select: {
            role: true,
            content: true,
          },
        });

    const providerMessages:
      ProviderMessage[] =
      history.map(
        (message) => ({
          role:
            this.toProviderRole(
              message.role,
            ),

          content:
            message.content,
        }),
      );

    const adapter =
      this.providerRegistry
        .getAdapter(
          provider.type,
        );

    const startedAt =
      Date.now();

    const result =
      await adapter.generate({
        apiKey:
          provider.apiKey,

        baseUrl:
          provider.baseUrl,

        model:
          provider.model,

        messages:
          providerMessages,
      });

    const durationMs =
      Date.now() - startedAt;

    const assistantMessage =
      await this.prisma
        .chatMessage.create({
          data: {
            conversationId:
              conversation.id,

            role:
              MessageRole.ASSISTANT,

            content:
              result.content,

            model:
              result.model,

            promptTokens:
              result.usage
                .promptTokens,

            outputTokens:
              result.usage
                .outputTokens,

            totalTokens:
              result.usage
                .totalTokens,
          },
        });

    await this.prisma
      .conversation.update({
        where: {
          id:
            conversation.id,
        },

        data: {
          providerId:
            provider.id,

          model:
            result.model,
        },
      });

    await this.usageService
      .recordUsage({
        userId,

        type:
          UsageType.CHAT,

        endpoint:
          '/api/v1/chat',

        statusCode: 200,

        durationMs,

        providerId:
          provider.id,

        conversationId:
          conversation.id,

        promptTokens:
          result.usage
            .promptTokens ??
          undefined,

        outputTokens:
          result.usage
            .outputTokens ??
          undefined,

        totalTokens:
          result.usage
            .totalTokens ??
          undefined,
      });

    const usage =
      await this.usageService
        .getUsageSnapshot(userId);

    return {
      conversation: {
        id:
          conversation.id,

        title:
          conversation.title,

        provider: {
          id:
            provider.id,

          type:
            provider.type,

          name:
            provider.name,
        },

        model:
          result.model,
      },

      request: {
        messageId:
          userMessage.id,

        content:
          prompt,
      },

      response: {
        messageId:
          assistantMessage.id,

        content:
          result.content,

        usage:
          result.usage,
      },

      quota: {
        monthlyRequestLimit:
          usage.monthlyRequestLimit,

        usedRequests:
          usage.usedRequests,

        remainingRequests:
          usage.remainingRequests,
      },
    };
  }

  async getConversations(
    userId: string,
  ) {
    const conversations =
      await this.prisma
        .conversation.findMany({
          where: {
            userId,
          },

          orderBy: {
            updatedAt: 'desc',
          },

          select: {
            id: true,
            title: true,
            model: true,
            createdAt: true,
            updatedAt: true,

            provider: {
              select: {
                id: true,
                type: true,
                name: true,
              },
            },

            _count: {
              select: {
                messages: true,
              },
            },
          },
        });

    return {
      conversations:
        conversations.map(
          (conversation) => ({
            id:
              conversation.id,

            title:
              conversation.title,

            model:
              conversation.model,

            provider:
              conversation.provider,

            messageCount:
              conversation._count
                .messages,

            createdAt:
              conversation.createdAt,

            updatedAt:
              conversation.updatedAt,
          }),
        ),
    };
  }

  async getConversation(
    userId: string,
    conversationId: string,
  ) {
    const conversation =
      await this.prisma
        .conversation.findFirst({
          where: {
            id:
              conversationId,

            userId,
          },

          select: {
            id: true,
            title: true,
            model: true,
            createdAt: true,
            updatedAt: true,

            provider: {
              select: {
                id: true,
                type: true,
                name: true,
              },
            },

            messages: {
              orderBy: {
                createdAt: 'asc',
              },

              select: {
                id: true,
                role: true,
                content: true,
                model: true,
                promptTokens: true,
                outputTokens: true,
                totalTokens: true,
                createdAt: true,
              },
            },
          },
        });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found',
      );
    }

    return conversation;
  }

  private async getOwnedConversation(
    userId: string,
    conversationId: string,
  ) {
    const conversation =
      await this.prisma
        .conversation.findFirst({
          where: {
            id:
              conversationId,

            userId,
          },
        });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found',
      );
    }

    return conversation;
  }

  private toProviderRole(
    role: MessageRole,
  ):
    | 'system'
    | 'user'
    | 'assistant' {
    switch (role) {
      case MessageRole.SYSTEM:
        return 'system';

      case MessageRole.USER:
        return 'user';

      case MessageRole.ASSISTANT:
        return 'assistant';
    }
  }

  private createTitle(
    prompt: string,
  ): string {
    const normalized =
      prompt.replace(
        /\s+/g,
        ' ',
      );

    if (
      normalized.length <= 60
    ) {
      return normalized;
    }

    return `${normalized.slice(
      0,
      57,
    )}...`;
  }
}