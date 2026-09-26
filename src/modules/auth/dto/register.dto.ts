import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    example: 'StrongPass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/[A-Z]/, {
    message:
      'password must contain at least one uppercase letter',
  })
  @Matches(/[a-z]/, {
    message:
      'password must contain at least one lowercase letter',
  })
  @Matches(/[0-9]/, {
    message:
      'password must contain at least one number',
  })
  @Matches(/[^A-Za-z0-9]/, {
    message:
      'password must contain at least one special character',
  })
  password!: string;

  @ApiProperty({
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}