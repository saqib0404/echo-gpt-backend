import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  UsageType,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';

interface RecordUsageInput {
  userId: string;
  type: UsageType;
  endpoint: string;
  statusCode: number;
  durationMs?: number;
  providerId?: string;
  conversationId?: string;
  promptTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

@Injectable()
export class UsageService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getUsageSnapshot(
    userId: string,
  ) {
    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
        },

        orderBy: {
          createdAt: 'desc',
        },

        include: {
          plan: true,
        },
      });

    if (!subscription) {
      throw new NotFoundException(
        'Active subscription not found',
      );
    }

    const {
      cycleStart,
      cycleEnd,
    } = this.getCurrentBillingCycle();

    const usedRequests =
      await this.prisma.apiUsageLog.count({
        where: {
          userId,

          createdAt: {
            gte: cycleStart,
            lt: cycleEnd,
          },

          statusCode: {
            gte: 200,
            lt: 300,
          },
        },
      });

    const limit =
      subscription.plan.monthlyRequestLimit;

    const remainingRequests = Math.max(
      limit - usedRequests,
      0,
    );

    return {
      plan: {
        code: subscription.plan.code,
        name: subscription.plan.name,
      },

      subscriptionStatus:
        subscription.status,

      monthlyRequestLimit: limit,

      usedRequests,

      remainingRequests,

      cycle: {
        startsAt: cycleStart,
        endsAt: cycleEnd,
      },
    };
  }

  async assertWithinLimit(
    userId: string,
  ) {
    const usage =
      await this.getUsageSnapshot(userId);

    if (usage.remainingRequests <= 0) {
      throw new HttpException(
        {
          statusCode:
            HttpStatus.TOO_MANY_REQUESTS,

          message:
            'Monthly request limit reached',

          error:
            'Too Many Requests',

          plan: usage.plan.code,

          monthlyRequestLimit:
            usage.monthlyRequestLimit,

          remainingRequests: 0,
        },

        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return usage;
  }

  async recordUsage(
    input: RecordUsageInput,
  ) {
    return this.prisma.apiUsageLog.create({
      data: {
        userId: input.userId,
        type: input.type,
        endpoint: input.endpoint,
        statusCode: input.statusCode,

        durationMs:
          input.durationMs ?? null,

        providerId:
          input.providerId ?? null,

        conversationId:
          input.conversationId ?? null,

        promptTokens:
          input.promptTokens ?? null,

        outputTokens:
          input.outputTokens ?? null,

        totalTokens:
          input.totalTokens ?? null,
      },
    });
  }

  private getCurrentBillingCycle() {
    const now = new Date();

    const cycleStart =
      new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1,
          0,
          0,
          0,
          0,
        ),
      );

    const cycleEnd =
      new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          1,
          0,
          0,
          0,
          0,
        ),
      );

    return {
      cycleStart,
      cycleEnd,
    };
  }
}