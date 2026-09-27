import {
  ApiProperty,
} from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SearchSuggestionsQueryDto {
  @ApiProperty({
    example: 'post',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q!: string;
}