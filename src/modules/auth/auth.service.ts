import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

import {
  PlanCode,
  RoleName,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../database/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

interface ClientInfo {
  ipAddress?: string;
  userAgent?: string;
}

interface RefreshTokenPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    clientInfo: ClientInfo,
  ) {
    const email =
      dto.email.trim().toLowerCase();

    const existing =
      await this.prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const passwordHash =
      await argon2.hash(dto.password);

    const result =
      await this.prisma.$transaction(
        async (tx) => {
          const userRole =
            await tx.role.findUnique({
              where: {
                name: RoleName.USER,
              },
            });

          if (!userRole) {
            throw new Error(
              'USER role is missing. Run the database seed.',
            );
          }

          const freePlan =
            await tx.plan.findUnique({
              where: {
                code: PlanCode.FREE,
              },
            });

          if (!freePlan) {
            throw new Error(
              'FREE plan is missing. Run the database seed.',
            );
          }

          const user =
            await tx.user.create({
              data: {
                email,
                passwordHash,

                firstName:
                  dto.firstName?.trim() ||
                  null,

                lastName:
                  dto.lastName?.trim() ||
                  null,

                roles: {
                  create: {
                    roleId: userRole.id,
                  },
                },

                subscriptions: {
                  create: {
                    planId: freePlan.id,
                  },
                },
              },

              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isEmailVerified: true,
                createdAt: true,

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
                    plan: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            });

          return user;
        },
      );

    const roles = result.roles.map(
      (item) => item.role.name,
    );

    const tokens =
      await this.createSessionAndTokens(
        {
          userId: result.id,
          email: result.email,
          roles,
        },
        clientInfo,
      );

    return {
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        isEmailVerified:
          result.isEmailVerified,
        roles,
        plan:
          result.subscriptions[0]
            ?.plan.code ?? PlanCode.FREE,
        createdAt: result.createdAt,
      },
      ...tokens,
    };
  }

  async login(
    dto: LoginDto,
    clientInfo: ClientInfo,
  ) {
    const email =
      dto.email.trim().toLowerCase();

    const user =
      await this.prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
          isActive: true,
          deletedAt: true,

          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

    if (
      !user ||
      !user.isActive ||
      user.deletedAt
    ) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordValid =
      await argon2.verify(
        user.passwordHash,
        dto.password,
      );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const roles = user.roles.map(
      (item) => item.role.name,
    );

    const tokens =
      await this.createSessionAndTokens(
        {
          userId: user.id,
          email: user.email,
          roles,
        },
        clientInfo,
      );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
      },
      ...tokens,
    };
  }

  async refresh(
    refreshToken: string,
  ) {
    const refreshSecret =
      this.getRefreshSecret();

    let payload: RefreshTokenPayload;

    try {
      payload =
        await this.jwtService.verifyAsync<RefreshTokenPayload>(
          refreshToken,
          {
            secret: refreshSecret,
          },
        );
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }

    if (
      payload.type !== 'refresh' ||
      !payload.sid
    ) {
      throw new UnauthorizedException(
        'Invalid refresh token',
      );
    }

    const session =
      await this.prisma.session.findUnique({
        where: {
          id: payload.sid,
        },

        include: {
          user: {
            include: {
              roles: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.user.isActive ||
      session.user.deletedAt
    ) {
      throw new UnauthorizedException(
        'Refresh session is no longer active',
      );
    }

    const tokenMatches =
      await argon2.verify(
        session.refreshTokenHash,
        refreshToken,
      );

    if (!tokenMatches) {
      await this.prisma.session.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      throw new UnauthorizedException(
        'Refresh token reuse detected',
      );
    }

    const roles =
      session.user.roles.map(
        (item) => item.role.name,
      );

    const tokens =
      await this.issueTokenPair({
        userId: session.user.id,
        email: session.user.email,
        roles,
        sessionId: session.id,
      });

    const newRefreshHash =
      await argon2.hash(
        tokens.refreshToken,
      );

    await this.prisma.session.update({
      where: {
        id: session.id,
      },

      data: {
        refreshTokenHash:
          newRefreshHash,

        expiresAt:
          tokens.refreshExpiresAt,

        lastUsedAt: new Date(),
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken:
        tokens.refreshToken,

      tokenType: 'Bearer',

      accessExpiresIn:
        this.getAccessTtl(),

      refreshExpiresIn:
        this.getRefreshTtl(),
    };
  }

  async logout(
    userId: string,
    sessionId: string,
  ) {
    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'Logged out successfully',
    };
  }

  private async createSessionAndTokens(
    user: {
      userId: string;
      email: string;
      roles: RoleName[];
    },
    clientInfo: ClientInfo,
  ) {
    const sessionId = randomUUID();

    const tokens =
      await this.issueTokenPair({
        ...user,
        sessionId,
      });

    const refreshTokenHash =
      await argon2.hash(
        tokens.refreshToken,
      );

    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.userId,
        refreshTokenHash,
        userAgent:
          clientInfo.userAgent ?? null,
        ipAddress:
          clientInfo.ipAddress ?? null,
        expiresAt:
          tokens.refreshExpiresAt,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken:
        tokens.refreshToken,

      tokenType: 'Bearer',

      accessExpiresIn:
        this.getAccessTtl(),

      refreshExpiresIn:
        this.getRefreshTtl(),
    };
  }

  private async issueTokenPair(input: {
    userId: string;
    email: string;
    roles: RoleName[];
    sessionId: string;
  }) {
    const accessTtl =
      this.getAccessTtl();

    const refreshTtl =
      this.getRefreshTtl();

    const accessSecret =
      this.getAccessSecret();

    const refreshSecret =
      this.getRefreshSecret();

    const accessToken =
      await this.jwtService.signAsync(
        {
          sub: input.userId,
          email: input.email,
          roles: input.roles,
          sid: input.sessionId,
          type: 'access',
        },
        {
          secret: accessSecret,
          expiresIn: accessTtl,
        },
      );

    const refreshToken =
      await this.jwtService.signAsync(
        {
          sub: input.userId,
          sid: input.sessionId,
          type: 'refresh',
        },
        {
          secret: refreshSecret,
          expiresIn: refreshTtl,
        },
      );

    return {
      accessToken,
      refreshToken,

      refreshExpiresAt: new Date(
        Date.now() +
          refreshTtl * 1000,
      ),
    };
  }

  private getAccessSecret(): string {
    const value =
      this.configService.get<string>(
        'auth.accessSecret',
      );

    if (!value) {
      throw new Error(
        'JWT access secret is unavailable',
      );
    }

    return value;
  }

  private getRefreshSecret(): string {
    const value =
      this.configService.get<string>(
        'auth.refreshSecret',
      );

    if (!value) {
      throw new Error(
        'JWT refresh secret is unavailable',
      );
    }

    return value;
  }

  private getAccessTtl(): number {
    return (
      this.configService.get<number>(
        'auth.accessTtl',
      ) ?? 900
    );
  }

  private getRefreshTtl(): number {
    return (
      this.configService.get<number>(
        'auth.refreshTtl',
      ) ?? 604800
    );
  }
}