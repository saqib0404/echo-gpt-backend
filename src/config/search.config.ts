import { registerAs } from '@nestjs/config';

export default registerAs('search', () => ({
  cacheTtlSeconds:
    Number(
      process.env.SEARCH_CACHE_TTL_SECONDS ??
        900,
    ),

  maxResults:
    Number(
      process.env.SEARCH_MAX_RESULTS ??
        10,
    ),
}));