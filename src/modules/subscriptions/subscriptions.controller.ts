import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthUser } from '../../common/interfaces/auth-user.interface.js';
import { ChangeSubscriptionDto } from './dto/change-subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService:
      SubscriptionsService,
  ) {}

  @Get('plans')
  @ApiOperation({
    summary:
      'List available EchoGPT subscription plans',
  })
  @ApiOkResponse({
    description:
      'Available subscription plans.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Missing or invalid access token.',
  })
  getAvailablePlans() {
    return this.subscriptionsService
      .getAvailablePlans();
  }

  @Get('status')
  @ApiOperation({
    summary:
      'Get current subscription status',
  })
  @ApiOkResponse({
    description:
      'Current subscription and usage information.',
  })
  getSubscriptionStatus(
    @CurrentUser() user: AuthUser,
  ) {
    return this.subscriptionsService
      .getSubscriptionStatus(user.id);
  }

  @Get('remaining-requests')
  @ApiOperation({
    summary:
      'Get monthly API usage and remaining requests',
  })
  @ApiOkResponse({
    description:
      'Current request usage and remaining quota.',
  })
  getRemainingRequests(
    @CurrentUser() user: AuthUser,
  ) {
    return this.subscriptionsService
      .getRemainingRequests(user.id);
  }

  @Patch('plan')
  @ApiOperation({
    summary:
      'Upgrade or downgrade the current subscription',
    description:
      'Switches the authenticated user between an available FREE or PREMIUM application plan.',
  })
  @ApiOkResponse({
    description:
      'Subscription changed successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'The requested plan is already active.',
  })
  changePlan(
    @CurrentUser() user: AuthUser,
    @Body()
    dto: ChangeSubscriptionDto,
  ) {
    return this.subscriptionsService
      .changePlan(
        user.id,
        dto.plan,
      );
  }
}