const CACHE_NAME = 'winky-core-v2';
const BROADCAST_NAME = 'winky_channel';

// Initialize IndexedDB for Headless Storage
const dbName = 'winky_headless_db';
const storeName = 'stealth_queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveToStealthQueue(data) {
  const db = await openDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const id = Math.random().toString(36).substring(2, 15);
  const record = { id, data, timestamp: Date.now(), source: 'HEADLESS_SW' };
  store.add(record);
  
  // Broadcast to any open tabs for real-time ingest
  const bc = new BroadcastChannel(BROADCAST_NAME);
  bc.postMessage({ type: 'HEADLESS_INGEST', payload: record });
  return record;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // HEADLESS ENDPOINT INTERCEPTION
  // Matches: /ingest?payload=... or /ingest?data=...
  if (url.pathname === '/ingest') {
    event.respondWith((async () => {
      let payload = url.searchParams.get('payload') || url.searchParams.get('data');
      
      // Support POST bodies for headless uploads
      if (!payload && event.request.method === 'POST') {
        try {
          const body = await event.request.text();
          payload = body;
        } catch (e) {}
      }

      if (payload) {
        await saveToStealthQueue(payload);
        return new Response('Winky Headless Ingest: SUCCESS', { 
          status: 200, 
          headers: { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*' 
          } 
        });
      }
      
      return new Response('Winky Headless Ingest: NO_DATA', { status: 400 });
    })());
    return;
  }

  // Standard PWA Fetch Logic
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
