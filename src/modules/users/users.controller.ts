import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AuthUser } from '../../common/interfaces/auth-user.interface.js';
import { RoleName } from '../../generated/prisma/client.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary:
      'Get the authenticated user profile',
  })
  @ApiOkResponse({
    description:
      'Current user profile.',
  })
  getProfile(
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.getProfile(
      user.id,
    );
  }

  @Patch('me')
  @ApiOperation({
    summary:
      'Update the authenticated user profile',
  })
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      user.id,
      dto,
    );
  }

  @Patch('me/password')
  @ApiOperation({
    summary:
      'Change password and revoke all active sessions',
  })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      user.id,
      dto,
    );
  }

  @Delete('me')
  @ApiOperation({
    summary:
      'Soft-delete the current user account',
  })
  deleteAccount(
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.deleteAccount(
      user.id,
    );
  }

  @Get('admin-check')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN)
  @ApiOperation({
    summary:
      'Verify ADMIN role authorization',
  })
  @ApiOkResponse({
    description:
      'Authenticated user has ADMIN role.',
  })
  @ApiForbiddenResponse({
    description:
      'Authenticated user does not have ADMIN role.',
  })
  adminCheck(
    @CurrentUser() user: AuthUser,
  ) {
    return {
      message:
        'Admin authorization successful',
      userId: user.id,
      roles: user.roles,
    };
  }
}