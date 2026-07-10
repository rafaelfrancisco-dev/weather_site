import { describe, expect, it } from 'vitest'
import { cacheStorageConfig } from '../../config/cacheStorage'

describe('cacheStorageConfig', () => {
  it('uses Redis when REDIS_URL is configured', () => {
    expect(cacheStorageConfig('redis://cache.example:6379')).toEqual({
      driver: 'redis',
      url: 'redis://cache.example:6379',
      ttl: 90000,
    })
  })

  it('falls back to filesystem storage when REDIS_URL is absent', () => {
    expect(cacheStorageConfig()).toEqual({
      driver: 'fs',
      base: './.data/cache',
      ttl: 90000,
    })
  })
})
