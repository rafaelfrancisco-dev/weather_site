import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_DESCRIPTION,
  SITE_TITLE,
  absoluteSiteUrl,
  pageDescription,
  pageTitle,
} from '~/utils/seo'
import type { MaybeRefOrGetter } from 'vue'

interface PageSeoMetaOptions {
  title?: MaybeRefOrGetter<string | null | undefined>
  description?: MaybeRefOrGetter<string | null | undefined>
  path?: MaybeRefOrGetter<string | null | undefined>
  imageTitle?: MaybeRefOrGetter<string | null | undefined>
  imageDescription?: MaybeRefOrGetter<string | null | undefined>
  type?: MaybeRefOrGetter<'website' | 'article' | 'profile' | 'book' | string | undefined>
  eyebrow?: MaybeRefOrGetter<string | null | undefined>
  accent?: MaybeRefOrGetter<string | null | undefined>
}

export function usePageSeoMeta(options: PageSeoMetaOptions = {}) {
  const site = useSiteConfig()
  const route = useRoute()
  const requestUrl = useRequestURL()

  const path = computed(() => toValue(options.path) || route.path || '/')
  const title = computed(() => pageTitle(toValue(options.title)))
  const description = computed(() => pageDescription(toValue(options.description)))
  const type = computed(() => toValue(options.type) || 'website')
  const canonicalUrl = computed(() => absoluteSiteUrl(path.value, site.url, requestUrl.origin))
  const imageTitle = computed(() => pageTitle(toValue(options.imageTitle) || title.value))
  const imageDescription = computed(() => pageDescription(toValue(options.imageDescription) || description.value))
  const eyebrow = computed(() => toValue(options.eyebrow) || SITE_TITLE)
  const accent = computed(() => toValue(options.accent) || '#2f6fb0')

  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: type,
    ogUrl: canonicalUrl,
    ogSiteName: SITE_TITLE,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
  })

  useHead({
    link: computed(() => canonicalUrl.value
      ? [{ key: 'canonical', rel: 'canonical', href: canonicalUrl.value }]
      : []),
  })

  defineOgImage('OgImageMetPt', {
    title: imageTitle,
    description: imageDescription,
    eyebrow,
    accent,
  }, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: computed(() => `${imageTitle.value} preview image`),
  })

  return {
    canonicalUrl,
    title,
    description,
  }
}
