// Service Worker Version
const SW_VERSION = '2.0.0';
const CACHE_PREFIX = 'alaraf-rental';
const CACHE_VERSION = 'v2';

// Cache Names
const CACHE_NAMES = {
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  DOCUMENTS: `${CACHE_PREFIX}-documents-${CACHE_VERSION}`
};

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/src/main.tsx',
  '/src/App.css',
  '/Amiri-Regular.ttf',
  '/Amiri-Bold.ttf',
  '/Amiri-Regular.js', 
  '/Amiri-Bold.js',
  '/favicon.ico'
];

// API endpoints to cache
const API_CACHE_ROUTES = [
  '/api/profiles',
  '/api/vehicles', 
  '/api/agreements',
  '/api/payments',
  '/api/customers'
];

// Network timeout for API calls
const NETWORK_TIMEOUT = 5000;

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', SW_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Skip waiting to activate immediately
      self.skipWaiting();
    })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker version:', SW_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith(CACHE_PREFIX))
          .filter(cacheName => !Object.values(CACHE_NAMES).includes(cacheName))
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch Event - Handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/rest/v1/')) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.API));
    return;
  }

  // Handle image requests with cache-first strategy
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.IMAGES));
    return;
  }

  // Handle document requests (PDFs, etc.) with cache-first strategy
  if (/\.(pdf|doc|docx|xls|xlsx)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.DOCUMENTS));
    return;
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.STATIC));
    return;
  }

  // Default strategy: Network first with dynamic cache
  event.respondWith(networkFirstStrategy(request, CACHE_NAMES.DYNAMIC));
});

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Update cache in background
      fetchAndCache(request, cacheName);
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error);
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAMES.STATIC);
      return cache.match('/offline.html');
    }
    throw error;
  }
}

// Network-first strategy with timeout
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
    );

    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, falling back to cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAMES.STATIC);
      return cache.match('/offline.html');
    }
    
    // Return error response for API requests
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline',
          message: 'No internet connection. Data may be outdated.' 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Background fetch and cache update
async function fetchAndCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail - this is a background update
  }
}

// Background Sync for offline actions
self.addEventListener('sync', async (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  } else if (event.tag === 'sync-agreements') {
    event.waitUntil(syncAgreements());
  } else if (event.tag === 'sync-maintenance') {
    event.waitUntil(syncMaintenance());
  }
});

// Sync offline payments
async function syncPayments() {
  try {
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/payments')) {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch(request, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Payment sync failed:', error);
  }
}

// Sync offline agreements
async function syncAgreements() {
  try {
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/agreements')) {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch(request, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Agreement sync failed:', error);
  }
}

// Sync offline maintenance records
async function syncMaintenance() {
  try {
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/maintenance')) {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch(request, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Maintenance sync failed:', error);
  }
}

// Push Notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Al-Araf Rental',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'general',
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window/tab open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if needed
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handling for client communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAMES.DYNAMIC).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith(CACHE_PREFIX))
            .map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-data') {
    event.waitUntil(updateCachedData());
  }
});

// Update cached data periodically
async function updateCachedData() {
  try {
    const cache = await caches.open(CACHE_NAMES.API);
    
    for (const route of API_CACHE_ROUTES) {
      try {
        const response = await fetch(route);
        if (response.ok) {
          await cache.put(route, response);
        }
      } catch (error) {
        console.error(`[SW] Failed to update ${route}:`, error);
      }
    }
  } catch (error) {
    console.error('[SW] Periodic data update failed:', error);
  }
}
