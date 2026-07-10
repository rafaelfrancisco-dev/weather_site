const LOCAL_OG_IMAGE_SECRET = 'metpt-local-development-only'

export function ogImageSecret(env: NodeJS.ProcessEnv): string {
  const secret = env.NUXT_OG_IMAGE_SECRET
  if (secret) return secret
  if (!env.VERCEL_ENV && !env.VERCEL) return LOCAL_OG_IMAGE_SECRET
  throw new Error('NUXT_OG_IMAGE_SECRET is required for Vercel deployments')
}
