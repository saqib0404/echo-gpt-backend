import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../../database/prisma.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getProfile(
    userId: string,
  ) {
    const user =
      await this.prisma.user.findFirst({
        where: {
          id: userId,
          isActive: true,
          deletedAt: null,
        },

        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true,

          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },

          subscriptions: {
            where: {
              status: 'ACTIVE',
            },

            orderBy: {
              createdAt: 'desc',
            },

            take: 1,

            select: {
              status: true,
              startsAt: true,
              endsAt: true,

              plan: {
                select: {
                  code: true,
                  name: true,
                  monthlyRequestLimit: true,
                },
              },
            },
          },
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User profile not found',
      );
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified:
        user.isEmailVerified,

      roles: user.roles.map(
        (item) => item.role.name,
      ),

      subscription:
        user.subscriptions[0] ?? null,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ) {
    const user =
      await this.prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          ...(dto.firstName !== undefined
            ? {
                firstName:
                  dto.firstName.trim() ||
                  null,
              }
            : {}),

          ...(dto.lastName !== undefined
            ? {
                lastName:
                  dto.lastName.trim() ||
                  null,
              }
            : {}),
        },

        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          updatedAt: true,
        },
      });

    return user;
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ) {
    if (
      dto.currentPassword ===
      dto.newPassword
    ) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const user =
      await this.prisma.user.findFirst({
        where: {
          id: userId,
          isActive: true,
          deletedAt: null,
        },

        select: {
          id: true,
          passwordHash: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'User account not found',
      );
    }

    const currentPasswordValid =
      await argon2.verify(
        user.passwordHash,
        dto.currentPassword,
      );

    if (!currentPasswordValid) {
      throw new UnauthorizedException(
        'Current password is incorrect',
      );
    }

    const passwordHash =
      await argon2.hash(
        dto.newPassword,
      );

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          passwordHash,
        },
      }),

      this.prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },

        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    return {
      message:
        'Password changed successfully. Please log in again.',
    };
  }

  async deleteAccount(
    userId: string,
  ) {
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          isActive: false,
          deletedAt: now,
        },
      }),

      this.prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
        },

        data: {
          revokedAt: now,
        },
      }),
    ]);

    return {
      message:
        'Account deleted successfully',
    };
  }
}