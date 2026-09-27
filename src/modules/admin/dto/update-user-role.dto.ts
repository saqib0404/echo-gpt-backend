import {
  ApiProperty,
} from '@nestjs/swagger';

import {
  IsEnum,
} from 'class-validator';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}


export class UpdateUserRoleDto {

  @ApiProperty({
    example:
      'ADMIN',
  })
  @IsEnum(UserRole)
  role!: UserRole;

}