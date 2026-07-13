# PWA operations

MET·PT uses a deliberately narrow service worker. It precaches only the
bilingual offline page, the branded install icons, the Apple touch icon, and
the existing favicon. Navigations use the network and fall back to
`/offline.html` only when the request fails. Pages, Nuxt chunks, APIs, Open
Graph images, IPMA data, fonts, and Mapbox traffic are never runtime-cached.

## Preview verification

Perform these checks on a Vercel Preview deployment before promoting a PWA
change:

1. Open DevTools > Application in Chromium. Confirm the manifest is installable
   and `sw.js` controls the root scope (`/`).
2. Visit a location route and national and district map routes while online.
   Switch DevTools to Offline and hard-navigate to each route. The bilingual
   fallback must appear. Restore connectivity and confirm normal SSR and live
   API responses return.
3. Inspect Cache Storage. Its only application entries must be `offline.html`,
   `favicon.ico`, `apple-touch-icon.png`, `pwa-192x192.png`,
   `pwa-512x512.png`, and `pwa-maskable-512x512.png`. Weather/API responses,
   HTML pages, `/_og/` images, fonts, Nuxt chunks, and Mapbox responses must not
   appear.
4. With the first Preview open, deploy a second build. No active tab should
   reload. Close every controlled tab, reopen the Preview, and confirm the new
   worker activates.
5. Recheck `/`, saved-location redirection, location and map routes, SEO and
   share metadata, the route-aware theme color, and responsive layouts.

Safari and mobile platforms should also retain their native installation UI;
the application does not intercept the install prompt.

## Emergency rollback

Do not remove the module or `sw.js` first. Existing installations can remain
controlled by the last worker indefinitely. Ship a cleanup deployment before
removing the PWA configuration:

1. Set `pwa.selfDestroying: true` in `nuxt.config.ts` and deploy it to the same
   origin. Keep the module enabled so the deployment replaces `/sw.js` with the
   cleanup worker. The generated worker activates immediately, unregisters
   itself, deletes Cache Storage entries, and reloads controlled clients.
2. Verify in a fresh and an existing browser profile that there is no service
   worker registration and no MET·PT Workbox cache.
3. Only after that cleanup deployment has reached active users, ship a second
   deployment that removes the PWA module, manifest component, PWA metadata,
   assets, and route headers.

Keep the cleanup deployment available long enough for installed clients to
fetch it; a same-day follow-up removal can strand clients that were offline.
