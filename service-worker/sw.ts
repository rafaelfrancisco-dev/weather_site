/// <reference lib="webworker" />

import { enable as enableNavigationPreload } from 'workbox-navigation-preload'
import {
  cleanupOutdatedCaches,
  precacheAndRoute,
  PrecacheFallbackPlugin,
} from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision?: string, url: string }>
}

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
enableNavigationPreload()

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkOnly({
    plugins: [
      new PrecacheFallbackPlugin({ fallbackURL: '/offline.html' }),
    ],
  }),
)
