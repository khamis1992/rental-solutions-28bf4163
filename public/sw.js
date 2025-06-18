// Service Worker Version
const SW_VERSION = '2.1.0';
const CACHE_PREFIX = 'alaraf-rental';
const CACHE_VERSION = 'v2.1';

// Cache Names
const CACHE_NAMES = {
  STATIC: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
  DOCUMENTS: `${CACHE_PREFIX}-documents-${CACHE_VERSION}`,
  FONTS: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`
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
  '/favicon.ico',
  '/vfs_fonts.js'
];

// All application routes to pre-cache
const APP_ROUTES = [
  '/',
  '/dashboard',
  '/vehicles',
  '/customers',
  '/agreements',
  '/payments',
  '/maintenance',
  '/legal',
  '/traffic-fines',
  '/financials',
  '/reports',
  '/settings',
  '/user-settings',
  '/documents',
  '/activity',
  '/field-ops'
];

// API endpoints to cache
const API_CACHE_ROUTES = [
  '/api/profiles',
  '/api/vehicles', 
  '/api/agreements',
  '/api/payments',
  '/api/customers',
  '/api/maintenance',
  '/api/traffic-fines',
  '/api/legal-cases',
  '/api/documents',
  '/api/user/preferences',
  '/api/user/settings',
  '/rest/v1/profiles',
  '/rest/v1/vehicles',
  '/rest/v1/leases',
  '/rest/v1/payments',
  '/rest/v1/maintenance',
  '/rest/v1/traffic_fines',
  '/rest/v1/legal_cases',
  '/rest/v1/unified_payments',
  '/rest/v1/payment_schedules',
  '/rest/v1/car_installment_contracts',
  '/rest/v1/car_installment_payments',
  '/rest/v1/vehicle_inspections'
];

// Network timeout for API calls
const NETWORK_TIMEOUT = 5000;

// Maximum cache size in MB
const MAX_CACHE_SIZE = 100;

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker version:', SW_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAMES.STATIC).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache app routes
      caches.open(CACHE_NAMES.DYNAMIC).then((cache) => {
        console.log('[SW] Pre-caching app routes');
        return cache.addAll(APP_ROUTES.map(route => new Request(route, { mode: 'no-cors' })));
      })
    ]).then(() => {
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

  // Handle Supabase API requests
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.API));
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.API));
    return;
  }

  // Handle font requests
  if (/\.(ttf|woff|woff2|eot)$/i.test(url.pathname) || url.pathname.includes('fonts')) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.FONTS));
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

  // Handle app navigation routes
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.DYNAMIC));
    return;
  }

  // Default strategy: Network first with dynamic cache
  event.respondWith(networkFirstStrategy(request, CACHE_NAMES.DYNAMIC));
});

// Cache-first strategy with background update
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
    if (request.url.includes('/api/') || request.url.includes('/rest/v1/')) {
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
  } else if (event.tag === 'sync-traffic-fines') {
    event.waitUntil(syncTrafficFines());
  } else if (event.tag === 'sync-legal-cases') {
    event.waitUntil(syncLegalCases());
  } else if (event.tag === 'sync-documents') {
    event.waitUntil(syncDocuments());
  } else if (event.tag === 'sync-inspections') {
    event.waitUntil(syncInspections());
  }
});

// Sync offline payments
async function syncPayments() {
  try {
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/payments') || request.url.includes('/unified_payments')) {
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
      if (request.url.includes('/api/agreements') || request.url.includes('/leases')) {
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
      if (request.url.includes('/api/maintenance') || request.url.includes('/maintenance')) {
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

// Sync traffic fines
async function syncTrafficFines() {
  try {
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/traffic_fines')) {
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
    console.error('[SW] Traffic fines sync failed:', error);
  }
}

// Sync legal cases
async function syncLegalCases() {
  try {
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/legal_cases')) {
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
    console.error('[SW] Legal cases sync failed:', error);
  }
}

// Sync documents
async function syncDocuments() {
  try {
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/documents')) {
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
    console.error('[SW] Documents sync failed:', error);
  }
}

// Sync vehicle inspections
async function syncInspections() {
  try {
    const cache = await caches.open('offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/vehicle_inspections')) {
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
    console.error('[SW] Inspections sync failed:', error);
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
    requireInteraction: data.requireInteraction || false,
    renotify: true,
    silent: false
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

// Notification action handling
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  
  if (action === 'view') {
    // Handle view action
    clients.openWindow(event.notification.data.url);
  } else if (action === 'remind-later') {
    // Schedule a reminder for later
    setTimeout(() => {
      self.registration.showNotification(event.notification.title, {
        ...event.notification,
        tag: event.notification.tag + '-reminder'
      });
    }, 60 * 60 * 1000); // 1 hour later
  } else if (action === 'snooze') {
    // Snooze for 30 minutes
    setTimeout(() => {
      self.registration.showNotification(event.notification.title, {
        ...event.notification,
        tag: event.notification.tag + '-snoozed'
      });
    }, 30 * 60 * 1000);
  }
  
  event.notification.close();
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
  } else if (event.data.type === 'CACHE_SIZE') {
    event.waitUntil(
      calculateCacheSize().then(size => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

// Calculate cache size
async function calculateCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-data') {
    event.waitUntil(updateCachedData());
  } else if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCache());
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

// Clean up old cache entries
async function cleanupOldCache() {
  try {
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const dateHeader = response.headers.get('date');
          if (dateHeader) {
            const responseDate = new Date(dateHeader);
            if (Date.now() - responseDate.getTime() > maxAge) {
              await cache.delete(request);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}

// Handle share target
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share' && event.request.method === 'POST') {
    event.respondWith(handleShare(event.request));
  }
});

async function handleShare(request) {
  const formData = await request.formData();
  const title = formData.get('title');
  const text = formData.get('text');
  const url = formData.get('url');
  const file = formData.get('file');
  
  // Store shared data for processing
  const cache = await caches.open('shared-data');
  await cache.put('/shared-item', new Response(JSON.stringify({
    title,
    text,
    url,
    hasFile: !!file
  })));
  
  // Redirect to appropriate page
  return Response.redirect('/documents?shared=true', 303);
}
