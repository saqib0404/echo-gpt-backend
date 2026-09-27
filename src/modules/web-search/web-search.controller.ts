import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AuthUser } from '../../common/interfaces/auth-user.interface.js';
import { RecentSearchesQueryDto } from './dto/recent-searches-query.dto.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions-query.dto.js';
import { WebSearchService } from './web-search.service.js';

@ApiTags('Web Search')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('search')
export class WebSearchController {
  constructor(
    private readonly webSearchService:
      WebSearchService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Search the web',
    description:
      'Performs a free web/instant-answer search, records search history, caches results, and consumes one successful request from the user quota.',
  })
  @ApiOkResponse({
    description:
      'Search completed successfully.',
  })
  @ApiTooManyRequestsResponse({
    description:
      'Monthly subscription request limit reached.',
  })
  search(
    @CurrentUser() user: AuthUser,

    @Body()
    dto: SearchQueryDto,
  ) {
    return this.webSearchService
      .search(
        user.id,
        dto.query,
      );
  }

  @Get('history')
  @ApiOperation({
    summary:
      'Get search history',
  })
  getHistory(
    @CurrentUser() user: AuthUser,
  ) {
    return this.webSearchService
      .getHistory(user.id);
  }

  @Get('recent')
  @ApiOperation({
    summary:
      'Get recent searches',
  })
  getRecentSearches(
    @CurrentUser() user: AuthUser,

    @Query()
    query:
      RecentSearchesQueryDto,
  ) {
    return this.webSearchService
      .getRecentSearches(
        user.id,
        query.limit,
      );
  }

  @Get('suggestions')
  @ApiOperation({
    summary:
      'Get personalized search suggestions',
    description:
      'Returns suggestions from the authenticated user’s previous search history.',
  })
  getSuggestions(
    @CurrentUser() user: AuthUser,

    @Query()
    query:
      SearchSuggestionsQueryDto,
  ) {
    return this.webSearchService
      .getSuggestions(
        user.id,
        query.q,
      );
  }
}