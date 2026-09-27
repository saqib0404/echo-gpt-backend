import {
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

import { PrismaService } from '../../database/prisma.service.js';
import { UsageType } from '../../generated/prisma/client.js';
import { UsageService } from '../usage/usage.service.js';
import { DuckDuckGoSearchAdapter } from './adapters/duckduckgo-search.adapter.js';
import {
  SearchAdapterResult,
} from './adapters/search-adapter.interface.js';

@Injectable()
export class WebSearchService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly configService:
      ConfigService,

    private readonly searchAdapter:
      DuckDuckGoSearchAdapter,

    private readonly usageService:
      UsageService,
  ) {}

  async search(
    userId: string,
    rawQuery: string,
  ) {
    await this.usageService
      .assertWithinLimit(userId);

    const query =
      this.normalizeQuery(
        rawQuery,
      );

    const queryHash =
      this.createQueryHash(
        query,
      );

    const maxResults =
      this.configService.get<number>(
        'search.maxResults',
      ) ?? 10;

    const cacheTtlSeconds =
      this.configService.get<number>(
        'search.cacheTtlSeconds',
      ) ?? 900;

    const startedAt =
      Date.now();

    const cached =
      await this.prisma
        .searchResultCache
        .findUnique({
          where: {
            queryHash,
          },
        });

    let searchResult:
      SearchAdapterResult;

    let cacheHit = false;

    if (
      cached &&
      cached.expiresAt >
        new Date()
    ) {
      searchResult =
        cached.resultData as unknown as SearchAdapterResult;

      cacheHit = true;
    } else {
      searchResult =
        await this.searchAdapter
          .search(
            query,
            maxResults,
          );

      const expiresAt =
        new Date(
          Date.now() +
            cacheTtlSeconds *
              1000,
        );

      await this.prisma
        .searchResultCache
        .upsert({
          where: {
            queryHash,
          },

          create: {
            queryHash,
            query,
            resultData:
              searchResult as object,
            expiresAt,
          },

          update: {
            query,
            resultData:
              searchResult as object,
            expiresAt,
          },
        });
    }

    const durationMs =
      Date.now() - startedAt;

    const history =
      await this.prisma
        .webSearch.create({
          data: {
            userId,
            query,

            resultCount:
              searchResult
                .results.length,

            cacheHit,
          },
        });

    await this.usageService
      .recordUsage({
        userId,

        type:
          UsageType.WEB_SEARCH,

        endpoint:
          '/api/v1/search',

        statusCode: 200,

        durationMs,
      });

    const usage =
      await this.usageService
        .getUsageSnapshot(userId);

    return {
      searchId:
        history.id,

      query,

      cacheHit,

      answer:
        searchResult.answer,

      provider:
        searchResult.provider,

      resultCount:
        searchResult
          .results.length,

      results:
        searchResult.results,

      quota: {
        monthlyRequestLimit:
          usage.monthlyRequestLimit,

        usedRequests:
          usage.usedRequests,

        remainingRequests:
          usage.remainingRequests,
      },

      searchedAt:
        history.createdAt,
    };
  }

  async getHistory(
    userId: string,
  ) {
    const searches =
      await this.prisma
        .webSearch.findMany({
          where: {
            userId,
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 100,

          select: {
            id: true,
            query: true,
            resultCount: true,
            cacheHit: true,
            createdAt: true,
          },
        });

    return {
      searches,
    };
  }

  async getRecentSearches(
    userId: string,
    limit: number,
  ) {
    const searches =
      await this.prisma
        .webSearch.findMany({
          where: {
            userId,
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: limit,

          select: {
            id: true,
            query: true,
            resultCount: true,
            cacheHit: true,
            createdAt: true,
          },
        });

    return {
      searches,
    };
  }

  async getSuggestions(
    userId: string,
    rawText: string,
  ) {
    const text =
      rawText
        .trim()
        .toLowerCase();

    const matchingSearches =
      await this.prisma
        .webSearch.findMany({
          where: {
            userId,

            query: {
              contains: text,
              mode: 'insensitive',
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 30,

          select: {
            query: true,
          },
        });

    const suggestions =
      Array.from(
        new Set(
          matchingSearches.map(
            (item) =>
              item.query,
          ),
        ),
      ).slice(
        0,
        10,
      );

    return {
      query:
        rawText.trim(),

      suggestions,
    };
  }

  private normalizeQuery(
    query: string,
  ): string {
    return query
      .trim()
      .replace(
        /\s+/g,
        ' ',
      );
  }

  private createQueryHash(
    query: string,
  ): string {
    return createHash(
      'sha256',
    )
      .update(
        query.toLowerCase(),
      )
      .digest('hex');
  }
}