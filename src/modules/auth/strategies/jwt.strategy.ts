import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  Strategy,
} from 'passport-jwt';

import { AuthUser } from '../../../common/interfaces/auth-user.interface.js';
import { PrismaService } from '../../../database/prisma.service.js';

interface AccessTokenPayload {
  sub: string;
  email: string;
  sid: string;
  type: 'access';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(
  Strategy,
  'jwt',
) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const accessSecret =
      configService.get<string>(
        'auth.accessSecret',
      );

    if (!accessSecret) {
      throw new Error(
        'JWT_ACCESS_SECRET is not configured',
      );
    }

    super({
      jwtFromRequest:
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });
  }

  async validate(
    payload: AccessTokenPayload,
  ): Promise<AuthUser> {
    if (
      payload.type !== 'access' ||
      !payload.sid
    ) {
      throw new UnauthorizedException(
        'Invalid access token',
      );
    }

    const session =
      await this.prisma.session.findFirst({
        where: {
          id: payload.sid,
          userId: payload.sub,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
        },
      });

    if (!session) {
      throw new UnauthorizedException(
        'Session is no longer active',
      );
    }

    const user =
      await this.prisma.user.findFirst({
        where: {
          id: payload.sub,
          isActive: true,
          deletedAt: null,
        },

        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,

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

    if (!user) {
      throw new UnauthorizedException(
        'User account is unavailable',
      );
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map(
        (item) => item.role.name,
      ),
      sessionId: session.id,
    };
  }
}