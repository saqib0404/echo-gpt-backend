import {
  Body,
  Controller,
  Headers,
  Ip,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthUser } from '../../common/interfaces/auth-user.interface.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiCreatedResponse({
    description:
      'User registered successfully.',
  })
  async register(
    @Body() dto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent')
    userAgent?: string,
  ) {
    return this.authService.register(
      dto,
      {
        ipAddress,
        userAgent,
      },
    );
  }

  @Post('login')
  @ApiOperation({
    summary:
      'Login with email and password',
  })
  @ApiOkResponse({
    description:
      'Authentication successful.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Invalid email or password.',
  })
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent')
    userAgent?: string,
  ) {
    return this.authService.login(
      dto,
      {
        ipAddress,
        userAgent,
      },
    );
  }

  @Post('refresh')
  @ApiOperation({
    summary:
      'Rotate a refresh token and issue a new token pair',
  })
  @ApiBody({
    type: RefreshTokenDto,
  })
  @ApiOkResponse({
    description:
      'Token pair refreshed successfully.',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(
      dto.refreshToken,
    );
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Revoke the current authenticated session',
  })
  @ApiOkResponse({
    description:
      'Current session revoked successfully.',
  })
  async logout(
    @CurrentUser() user: AuthUser,
  ) {
    return this.authService.logout(
      user.id,
      user.sessionId,
    );
  }
}