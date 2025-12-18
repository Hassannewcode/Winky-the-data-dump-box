
const CACHE_NAME = 'winky-core-v2';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Service Worker: Background Ingestion Proxy
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // INTERCEPTOR: Catch any request to /ingest or /pulse
  // This allows external scripts to fetch('winky.app/ingest?data=...')
  // and have it show up in the UI without a redirect.
  if (url.pathname === '/ingest' || url.pathname === '/pulse') {
    event.respondWith(
      (async () => {
        let payload = url.searchParams.get('payload') || url.searchParams.get('data');
        
        // If it's a POST, try to read the body
        if (!payload && event.request.method === 'POST') {
          try {
            const clonedRequest = event.request.clone();
            payload = await clonedRequest.text();
          } catch (e) {
            payload = "[Background Binary Stream]";
          }
        }

        if (payload) {
          // Broadcast to all open tabs
          const allClients = await clients.matchAll();
          allClients.forEach(client => {
            client.postMessage({
              type: 'BACKGROUND_INGEST',
              source: 'SERVICE_WORKER_PROXY',
              data: payload,
              timestamp: Date.now(),
              origin: event.request.referrer || 'Background Fetch'
            });
          });
        }

        // Return a clean 200 OK so the sender doesn't fail
        return new Response(JSON.stringify({ status: 'intercepted', received: !!payload }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      })()
    );
    return;
  }

  // Standard caching for everything else
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
