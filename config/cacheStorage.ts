export type CacheStorageConfig =
  | { driver: 'redis', url: string, ttl: number }
  | { driver: 'fs', base: string, ttl: number }

export function cacheStorageConfig(redisUrl?: string): CacheStorageConfig {
  return redisUrl
    ? { driver: 'redis', url: redisUrl, ttl: 90000 }
    : { driver: 'fs', base: './.data/cache', ttl: 90000 }
}
