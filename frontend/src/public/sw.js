import { clientsClaim } from 'workbox-core';
import {precacheAndRoute} from 'workbox-precaching/precacheAndRoute';
import { registerRoute } from 'workbox-routing/registerRoute';
import { BackgroundSyncPlugin } from 'workbox-background-sync/';
import {NetworkOnly, NetworkFirst, StaleWhileRevalidate} from 'workbox-strategies';

const bgSyncPlugin = new BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours
});

self.skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
    ({ request }) => request.method === 'POST',
    new NetworkOnly({ plugins: [bgSyncPlugin] }), 'POST'
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/submissions'),
  new NetworkFirst({ cacheName: 'api-cache' })
);

registerRoute(
  ({ request }) => request.destination === 'image' ||
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({ cacheName: 'assets-cache' })
);