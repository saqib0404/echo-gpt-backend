import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { UsageModule } from '../usage/usage.module.js';
import { DuckDuckGoSearchAdapter } from './adapters/duckduckgo-search.adapter.js';
import { WebSearchController } from './web-search.controller.js';
import { WebSearchService } from './web-search.service.js';

@Module({
  imports: [
    AuthModule,
    UsageModule,
  ],

  controllers: [
    WebSearchController,
  ],

  providers: [
    WebSearchService,
    DuckDuckGoSearchAdapter,
  ],

  exports: [
    WebSearchService,
  ],
})
export class WebSearchModule {}