import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RoleName } from '../../generated/prisma/client.js';
import { AiProvidersService } from './ai-providers.service.js';
import { CreateAiProviderDto } from './dto/create-ai-provider.dto.js';
import { SetProviderEnabledDto } from './dto/set-provider-enabled.dto.js';
import { UpdateAiProviderDto } from './dto/update-ai-provider.dto.js';

@ApiTags('AI Providers')
@ApiBearerAuth('access-token')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
@Roles(RoleName.ADMIN)
@Controller('ai-providers')
export class AiProvidersController {
  constructor(
    private readonly aiProvidersService:
      AiProvidersService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Add an AI provider',
  })
  @ApiConflictResponse({
    description:
      'This provider type is already configured.',
  })
  @ApiForbiddenResponse({
    description:
      'ADMIN role required.',
  })
  create(
    @Body()
    dto: CreateAiProviderDto,
  ) {
    return this.aiProvidersService
      .create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List configured AI providers',
  })
  findAll() {
    return this.aiProvidersService
      .findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get one AI provider',
  })
  @ApiNotFoundResponse({
    description:
      'AI provider not found.',
  })
  findOne(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.aiProvidersService
      .findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Edit AI provider configuration',
  })
  update(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Body()
    dto: UpdateAiProviderDto,
  ) {
    return this.aiProvidersService
      .update(
        id,
        dto,
      );
  }

  @Delete(':id')
  @ApiOperation({
    summary:
      'Delete an AI provider',
  })
  remove(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.aiProvidersService
      .remove(id);
  }

  @Patch(':id/enabled')
  @ApiOperation({
    summary:
      'Enable or disable an AI provider',
  })
  setEnabled(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,

    @Body()
    dto: SetProviderEnabledDto,
  ) {
    return this.aiProvidersService
      .setEnabled(
        id,
        dto.enabled,
      );
  }

  @Patch(':id/default')
  @ApiOperation({
    summary:
      'Select the default AI provider',
  })
  @ApiOkResponse({
    description:
      'Default provider updated.',
  })
  setDefault(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.aiProvidersService
      .setDefault(id);
  }

  @Post(':id/health')
  @ApiOperation({
    summary:
      'Run an AI provider health check',
  })
  checkHealth(
    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.aiProvidersService
      .checkHealth(id);
  }
}