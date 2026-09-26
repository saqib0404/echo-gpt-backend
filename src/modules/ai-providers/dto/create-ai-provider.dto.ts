import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

import { AiProviderType } from '../../../generated/prisma/client.js';

export class CreateAiProviderDto {
  @ApiProperty({
    enum: AiProviderType,
    example: AiProviderType.GEMINI,
  })
  @IsEnum(AiProviderType)
  type!: AiProviderType;

  @ApiProperty({
    example: 'Google Gemini',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    example:
      'https://generativelanguage.googleapis.com/v1beta',
    description:
      'Optional custom API base URL. The official provider URL is used when omitted.',
  })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  baseUrl?: string;

  @ApiProperty({
    example: 'gemini-3.8-flash',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  defaultModel!: string;

  @ApiPropertyOptional({
    example: 'provider-api-key',
    description:
      'The raw key is accepted once and encrypted before database storage.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  apiKey?: string;
}