import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PlanCode,
  SubscriptionStatus,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { UsageService } from '../usage/usage.service.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
  ) {}

  async getAvailablePlans() {
    const plans =
      await this.prisma.plan.findMany({
        where: {
          isActive: true,
        },

        orderBy: {
          code: 'asc',
        },

        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          monthlyRequestLimit: true,
        },
      });

    return {
      plans,
    };
  }

  async getSubscriptionStatus(
    userId: string,
  ) {
    const subscription =
      await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },

        orderBy: {
          createdAt: 'desc',
        },

        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,

          plan: {
            select: {
              code: true,
              name: true,
              description: true,
              monthlyRequestLimit: true,
            },
          },
        },
      });

    if (!subscription) {
      throw new NotFoundException(
        'Active subscription not found',
      );
    }

    const usage =
      await this.usageService.getUsageSnapshot(
        userId,
      );

    return {
      subscription,
      usage: {
        usedRequests:
          usage.usedRequests,

        remainingRequests:
          usage.remainingRequests,

        monthlyRequestLimit:
          usage.monthlyRequestLimit,

        cycle:
          usage.cycle,
      },
    };
  }

  async getRemainingRequests(
    userId: string,
  ) {
    return this.usageService.getUsageSnapshot(
      userId,
    );
  }

  async changePlan(
    userId: string,
    targetPlanCode: PlanCode,
  ) {
    const targetPlan =
      await this.prisma.plan.findFirst({
        where: {
          code: targetPlanCode,
          isActive: true,
        },
      });

    if (!targetPlan) {
      throw new NotFoundException(
        'Requested subscription plan is unavailable',
      );
    }

    const currentSubscription =
      await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },

        orderBy: {
          createdAt: 'desc',
        },

        include: {
          plan: true,
        },
      });

    if (
      currentSubscription?.plan.code ===
      targetPlanCode
    ) {
      throw new BadRequestException(
        `User is already subscribed to the ${targetPlanCode} plan`,
      );
    }

    const now = new Date();

    await this.prisma.$transaction(
      async (tx) => {
        await tx.subscription.updateMany({
          where: {
            userId,
            status:
              SubscriptionStatus.ACTIVE,
          },

          data: {
            status:
              SubscriptionStatus.CANCELED,

            canceledAt: now,
            endsAt: now,
          },
        });

        await tx.subscription.create({
          data: {
            userId,
            planId: targetPlan.id,

            status:
              SubscriptionStatus.ACTIVE,

            startsAt: now,
          },
        });
      },
    );

    return this.getSubscriptionStatus(
      userId,
    );
  }
}