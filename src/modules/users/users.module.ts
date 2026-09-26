import { Module } from '@nestjs/common';

import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AuthModule } from '../auth/auth.module.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    UsersController,
  ],

  providers: [
    UsersService,
    RolesGuard,
  ],

  exports: [
    UsersService,
  ],
})
export class UsersModule {}