import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetProviderEnabledDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;
}