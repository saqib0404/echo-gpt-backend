import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';

import {
  SearchAdapter,
  SearchAdapterResult,
  SearchResultItem,
} from './search-adapter.interface.js';

interface DuckDuckGoTopic {
  FirstURL?: string;
  Text?: string;

  Topics?: DuckDuckGoTopic[];
}

interface DuckDuckGoResponse {
  Heading?: string;

  Answer?: string;

  AbstractText?: string;

  AbstractURL?: string;

  AbstractSource?: string;

  RelatedTopics?: DuckDuckGoTopic[];
}

@Injectable()
export class DuckDuckGoSearchAdapter
  implements SearchAdapter
{
  async search(
    query: string,
    limit: number,
  ): Promise<SearchAdapterResult> {
    const url =
      new URL(
        'https://api.duckduckgo.com/',
      );

    url.searchParams.set(
      'q',
      query,
    );

    url.searchParams.set(
      'format',
      'json',
    );

    url.searchParams.set(
      'no_html',
      '1',
    );

    url.searchParams.set(
      'no_redirect',
      '1',
    );

    url.searchParams.set(
      'skip_disambig',
      '1',
    );

    let response: Response;

    try {
      response = await fetch(
        url,
        {
          method: 'GET',

          headers: {
            Accept:
              'application/json',

            'User-Agent':
              'EchoGPT-Backend/1.0',
          },

          signal:
            AbortSignal.timeout(
              15000,
            ),
        },
      );
    } catch {
      throw new BadGatewayException(
        'Unable to reach the web search service',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `Web search service returned HTTP ${response.status}`,
      );
    }

    const data =
      (await response.json()) as DuckDuckGoResponse;

    const results:
      SearchResultItem[] = [];

    if (
      data.AbstractURL &&
      data.AbstractText
    ) {
      results.push({
        title:
          data.Heading ||
          query,

        url:
          data.AbstractURL,

        snippet:
          data.AbstractText,

        source:
          data.AbstractSource ||
          'DuckDuckGo',
      });
    }

    const related =
      this.flattenTopics(
        data.RelatedTopics ?? [],
      );

    for (const item of related) {
      if (
        results.length >= limit
      ) {
        break;
      }

      if (
        !item.FirstURL ||
        !item.Text
      ) {
        continue;
      }

      if (
        results.some(
          (result) =>
            result.url ===
            item.FirstURL,
        )
      ) {
        continue;
      }

      results.push({
        title:
          this.createTitle(
            item.Text,
          ),

        url:
          item.FirstURL,

        snippet:
          item.Text,

        source:
          'DuckDuckGo',
      });
    }

    return {
      answer:
        typeof data.Answer ===
          'string' &&
        data.Answer.trim()
          ? data.Answer.trim()
          : null,

      results:
        results.slice(
          0,
          limit,
        ),

      provider:
        'duckduckgo-instant-answer',
    };
  }

  private flattenTopics(
    topics: DuckDuckGoTopic[],
  ): DuckDuckGoTopic[] {
    const flattened:
      DuckDuckGoTopic[] = [];

    for (const topic of topics) {
      if (
        topic.Topics &&
        topic.Topics.length > 0
      ) {
        flattened.push(
          ...this.flattenTopics(
            topic.Topics,
          ),
        );
      } else {
        flattened.push(topic);
      }
    }

    return flattened;
  }

  private createTitle(
    text: string,
  ): string {
    const separatorIndex =
      text.indexOf(' - ');

    if (
      separatorIndex > 0
    ) {
      return text
        .slice(
          0,
          separatorIndex,
        )
        .trim();
    }

    return text
      .slice(
        0,
        120,
      )
      .trim();
  }
}