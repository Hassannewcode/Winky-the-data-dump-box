const CACHE_NAME = 'winky-core-v3';
const BROADCAST_NAME = 'winky_channel';
const DB_NAME = 'winky_headless_db';
const STORE_NAME = 'stealth_queue';

// Guaranteed DB Access for offline/headless storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToStealthQueue(data, source = 'HEADLESS_V3') {
  console.log(`[SW] Intercepted Signal: ${source} | Size: ${new Blob([data]).size} bytes`);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const record = { id, data, timestamp: Date.now(), source };
    
    await new Promise((resolve, reject) => {
      const req = store.add(record);
      req.onsuccess = resolve;
      req.onerror = reject;
    });

    // Notify any active tabs immediately for live UI update
    const bc = new BroadcastChannel(BROADCAST_NAME);
    bc.postMessage({ 
      type: 'HEADLESS_INGEST', 
      payload: record,
      log: `Stealth Ingest SUCCESS: Received via ${source}` 
    });
    return record;
  } catch (e) {
    console.error('[SW] Stealth Queue Failure:', e);
    const bc = new BroadcastChannel(BROADCAST_NAME);
    bc.postMessage({ type: 'LOG', message: `Stealth Ingest FAILED: ${e.message}`, level: 'ERROR' });
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // --- UNIVERSAL STEALTH ENDPOINT (/ingest or /ping.gif) ---
  // This allows ANY site to send data to Winky via:
  // 1. fetch('https://winky.app/ingest?payload=...')
  // 2. new Image().src = 'https://winky.app/ping.gif?payload=...'
  // 3. navigator.sendBeacon('https://winky.app/ingest', data)
  if (url.pathname === '/ingest' || url.pathname === '/ping.gif') {
    // Handle CORS Preflight for cross-origin POSTs
    if (event.request.method === 'OPTIONS') {
      event.respondWith(new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }));
      return;
    }

    event.respondWith((async () => {
      // Try all common data parameter names
      let payload = url.searchParams.get('payload') || 
                    url.searchParams.get('data') || 
                    url.searchParams.get('q') ||
                    url.searchParams.get('content');
      
      // Capture POST/PUT body if no query param exists
      if (!payload && (event.request.method === 'POST' || event.request.method === 'PUT')) {
        try {
          payload = await event.request.text();
        } catch (e) {}
      }

      if (payload) {
        const sourceVector = url.pathname === '/ping.gif' ? 'IMAGE_PING' : `HTTP_${event.request.method}`;
        await saveToStealthQueue(payload, sourceVector);
        
        // Response Strategy: Be as invisible as possible
        if (url.pathname.endsWith('.gif')) {
          // Return a valid 1x1 transparent GIF pixel
          const pixel = atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
          const bytes = new Uint8Array(pixel.length);
          for (let i = 0; i < pixel.length; i++) bytes[i] = pixel.charCodeAt(i);
          return new Response(bytes, {
            headers: { 
              'Content-Type': 'image/gif',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        }

        return new Response(JSON.stringify({ 
          status: 'SUCCESS', 
          vector: sourceVector,
          timestamp: Date.now() 
        }), { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*' 
          } 
        });
      }
      
      return new Response('WINKY_VOID: NO_SIGNAL', { 
        status: 400, 
        headers: { 'Access-Control-Allow-Origin': '*' } 
      });
    })());
    return;
  }

  // Standard PWA Proxy
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
