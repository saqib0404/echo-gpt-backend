import {
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateAiProviderDto {
  @ApiPropertyOptional({
    example: 'Google Gemini',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example:
      'https://generativelanguage.googleapis.com/v1beta',
  })
  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  baseUrl?: string;

  @ApiPropertyOptional({
    example: 'gemini-3.8-flash',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  defaultModel?: string;

  @ApiPropertyOptional({
    description:
      'Replacement provider API key. It will be encrypted before storage.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  apiKey?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Set true to remove the stored provider API key.',
  })
  @IsOptional()
  @IsBoolean()
  clearApiKey?: boolean;
}