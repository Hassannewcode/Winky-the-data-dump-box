
const CACHE_NAME = 'winky-core-v3';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// The Background Ingestion Proxy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // INTERCEPTOR: Catch background pings to /ingest
  // This allows fetch('https://your-winky.app/ingest', { method: 'POST', body: '...' })
  if (url.pathname === '/ingest' || url.pathname === '/pulse') {
    event.respondWith(
      (async () => {
        let payload = url.searchParams.get('payload') || url.searchParams.get('data');
        
        // Handle POST bodies (JSON or Text)
        if (!payload && (event.request.method === 'POST' || event.request.method === 'PUT')) {
          try {
            const clonedRequest = event.request.clone();
            payload = await clonedRequest.text();
          } catch (e) {
            payload = "[Background Binary Stream]";
          }
        }

        if (payload) {
          const messageData = {
            type: 'BACKGROUND_INGEST',
            source: 'SERVICE_WORKER_PROXY',
            data: payload,
            timestamp: Date.now(),
            origin: event.request.referrer || 'External Beacon'
          };

          // Method A: Direct postMessage to all window clients (including uncontrolled)
          const allClients = await clients.matchAll({ includeUncontrolled: true, type: 'window' });
          allClients.forEach(client => {
            client.postMessage(messageData);
          });

          // Method B: BroadcastChannel Bridge (Bulletproof failover)
          const bc = new BroadcastChannel('winky_channel');
          bc.postMessage(messageData);
          bc.close();
        }

        // Return a valid JSON response with CORS headers
        return new Response(JSON.stringify({ 
          status: 'captured', 
          received: !!payload,
          timestamp: Date.now()
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      })()
    );
    return;
  }

  // Handle Standard App Traffic
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

