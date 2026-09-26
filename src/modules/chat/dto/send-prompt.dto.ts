import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendPromptDto {
  @ApiProperty({
    example:
      'Explain REST APIs in simple language.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  prompt!: string;

  @ApiPropertyOptional({
    description:
      'Continue an existing conversation.',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    description:
      'Explicit provider ID. If omitted, the enabled default provider is used.',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;
}