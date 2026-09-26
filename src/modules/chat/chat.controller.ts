import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthUser } from '../../common/interfaces/auth-user.interface.js';
import { ChatService } from './chat.service.js';
import { SendPromptDto } from './dto/send-prompt.dto.js';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService:
      ChatService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Send a prompt to an AI provider',
    description:
      'Uses an explicitly selected enabled provider or the configured default provider, persists conversation history, and records subscription usage.',
  })
  @ApiOkResponse({
    description:
      'AI response generated successfully.',
  })
  @ApiBadRequestResponse({
    description:
      'Provider configuration is invalid or unavailable.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Missing or invalid access token.',
  })
  @ApiTooManyRequestsResponse({
    description:
      'Monthly subscription request limit has been reached.',
  })
  sendPrompt(
    @CurrentUser() user: AuthUser,

    @Body()
    dto: SendPromptDto,
  ) {
    return this.chatService
      .sendPrompt(
        user.id,
        dto,
      );
  }

  @Get('conversations')
  @ApiOperation({
    summary:
      'List conversation history',
  })
  getConversations(
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService
      .getConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({
    summary:
      'Get one conversation with its complete message history',
  })
  @ApiNotFoundResponse({
    description:
      'Conversation does not exist or does not belong to the authenticated user.',
  })
  getConversation(
    @CurrentUser() user: AuthUser,

    @Param(
      'id',
      new ParseUUIDPipe(),
    )
    id: string,
  ) {
    return this.chatService
      .getConversation(
        user.id,
        id,
      );
  }
}