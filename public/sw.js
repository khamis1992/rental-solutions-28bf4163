
const CACHE_NAME = 'alaraf-rental-v2.2.0';
const CACHE_VERSION = '2.2.0';

// Define cached resources
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/vite.svg'
];

// API routes to cache
const API_CACHE_ROUTES = [
  '/api/profiles',
  '/api/vehicles', 
  '/api/agreements',
  '/api/payments',
  '/api/customers',
  '/api/maintenance',
  '/rest/v1/profiles',
  '/rest/v1/vehicles',
  '/rest/v1/leases',
  '/rest/v1/unified_payments'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting to activate immediately');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache during install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    handleRequest(request, url)
  );
});

async function handleRequest(request, url) {
  try {
    // Strategy 1: Cache First for static assets
    if (isStaticAsset(url)) {
      return await cacheFirst(request);
    }
    
    // Strategy 2: Network First for API calls
    if (isApiCall(url)) {
      return await networkFirst(request);
    }
    
    // Strategy 3: Network First for HTML pages
    if (request.destination === 'document') {
      return await networkFirst(request);
    }
    
    // Strategy 4: Cache First for everything else
    return await cacheFirst(request);
    
  } catch (error) {
    console.error('[SW] Request failed:', error);
    
    // Return offline fallback for HTML requests
    if (request.destination === 'document') {
      return await getOfflineFallback();
    }
    
    throw error;
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {}); // Ignore network errors
    
    return cached;
  }
  
  // Not in cache, fetch from network
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network First Strategy
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first with timeout
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
    ]);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    // Fall back to cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/);
}

function isApiCall(url) {
  return API_CACHE_ROUTES.some(route => url.pathname.startsWith(route)) ||
         url.hostname !== self.location.hostname;
}

async function getOfflineFallback() {
  const cache = await caches.open(CACHE_NAME);
  const fallback = await cache.match('/');
  
  if (fallback) {
    return fallback;
  }
  
  // Create minimal offline page
  return new Response(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>غير متصل - العراف للتأجير</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            direction: rtl;
          }
          .offline-container {
            max-width: 400px;
            margin: 0 auto;
          }
          .offline-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📱</div>
          <h1>غير متصل بالإنترنت</h1>
          <p>يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.</p>
          <button onclick="window.location.reload()">إعادة المحاولة</button>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Sync any pending offline data
    console.log('[SW] Performing background sync');
    
    // This would typically sync with your backend
    // For now, just log that sync is happening
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_SUCCESS'
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Notify clients about updates
self.addEventListener('install', (event) => {
  // Send update notification to all clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: CACHE_VERSION
      });
    });
  });
});

console.log('[SW] Service worker loaded, version:', CACHE_VERSION);
