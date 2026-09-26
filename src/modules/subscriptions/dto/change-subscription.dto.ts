import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { PlanCode } from '../../../generated/prisma/client.js';

export class ChangeSubscriptionDto {
  @ApiProperty({
    enum: PlanCode,
    example: PlanCode.PREMIUM,
    description:
      'Subscription plan to activate for the current user.',
  })
  @IsEnum(PlanCode)
  plan!: PlanCode;
}