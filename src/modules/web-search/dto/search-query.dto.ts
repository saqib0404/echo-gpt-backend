import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({
    example:
      'What is PostgreSQL?',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  query!: string;
}