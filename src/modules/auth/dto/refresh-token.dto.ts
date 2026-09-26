import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
} from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh token received during registration, login, or a previous refresh operation.',
  })
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}