import { describe, expect, it } from 'vitest'
import { ogImageSecret } from '../../config/ogImageSecurity'

describe('ogImageSecret', () => {
  it('uses the configured signing secret', () => {
    expect(ogImageSecret({ NUXT_OG_IMAGE_SECRET: 'stable-secret', VERCEL_ENV: 'production' })).toBe('stable-secret')
  })

  it('uses a local-only secret outside Vercel', () => {
    expect(ogImageSecret({})).toBe('metpt-local-development-only')
  })

  it('rejects Vercel deployments without a signing secret', () => {
    expect(() => ogImageSecret({ VERCEL_ENV: 'preview' })).toThrow(
      'NUXT_OG_IMAGE_SECRET is required for Vercel deployments',
    )
  })
})
