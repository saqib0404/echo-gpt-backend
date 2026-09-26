import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'StrongPass123!',
  })
  @IsString()
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({
    example: 'EvenStronger456!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, {
    message:
      'newPassword must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message:
      'newPassword must contain at least one lowercase letter',
  })
  @Matches(/[0-9]/, {
    message:
      'newPassword must contain at least one number',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message:
      'newPassword must contain at least one special character',
  })
  newPassword!: string;
}