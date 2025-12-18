
const CACHE_NAME = 'winky-core-v1.3';
const urlsToCache = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

async function broadcastSignal(data, label = 'Shadow Ingest') {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'WINKY_SIGNAL_INGEST',
      data: data,
      label: label
    });
  });
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // HEADLESS SHADOW INGEST PROTOCOL
  // Intercepts requests to /ingest-signal?payload=... OR via POST body
  if (url.pathname === '/ingest-signal') {
    event.respondWith((async () => {
      try {
        let payload = url.searchParams.get('payload') || url.searchParams.get('data');
        
        if (!payload && event.request.method === 'POST') {
          const body = await event.request.clone().text();
          payload = body;
        }

        if (payload) {
          await broadcastSignal(payload, `Headless: ${event.request.method}`);
          return new Response(JSON.stringify({ status: 'INGESTED', timestamp: Date.now() }), {
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        
        return new Response(JSON.stringify({ status: 'ERROR', message: 'No payload found' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ status: 'CRASH', error: e.message }), { status: 500 });
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
