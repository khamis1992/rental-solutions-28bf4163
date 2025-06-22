// Enhanced Service Worker for Al-Araf Rental System
// Version 3.0.0 - Advanced PWA Implementation

const CACHE_NAME = 'alaraf-rental-v3.0.0';
const RUNTIME_CACHE = 'alaraf-runtime-v3.0.0';
const DYNAMIC_CACHE = 'alaraf-dynamic-v3.0.0';
const IMAGE_CACHE = 'alaraf-images-v3.0.0';
const API_CACHE = 'alaraf-api-v3.0.0';

// Cache duration settings
const CACHE_DURATION = {
  STATIC: 30 * 24 * 60 * 60 * 1000, // 30 days
  API: 5 * 60 * 1000, // 5 minutes
  IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 days
  DYNAMIC: 24 * 60 * 60 * 1000 // 1 day
};

// Enhanced static assets for caching
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png',
  '/Amiri-Bold.ttf',
  '/Amiri-Bold.js',

  // Core routes
  '/dashboard',
  '/customers',
  '/agreements',
  '/vehicles',
  '/payments',
  '/maintenance',
  '/reports',
  '/legal',
  '/financials',
  
  // Critical CSS and JS (will be automatically cached by Vite)
];

// API endpoints for intelligent caching
const API_CACHE_PATTERNS = [
  /\/api\/.*$/,
  /\/rest\/v1\/profiles$/,
  /\/rest\/v1\/customers$/,
  /\/rest\/v1\/vehicles$/,
  /\/rest\/v1\/leases$/,
  /\/rest\/v1\/agreements$/,
  /\/rest\/v1\/maintenance$/,
  /\/rest\/v1\/payments$/,
  /\/rest\/v1\/payment_schedules$/,
  /\/rest\/v1\/vehicle_inspections$/
];

// Background sync tags
const SYNC_TAGS = {
  PAYMENT: 'sync-payment',
  AGREEMENT: 'sync-agreement',
  MAINTENANCE: 'sync-maintenance',
  CUSTOMER: 'sync-customer',
  VEHICLE: 'sync-vehicle',
  DOCUMENT: 'sync-document'
};

// Queue for offline operations
let offlineQueue = [];

// Install event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v3.0.0');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(asset => asset !== '/'));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v3.0.0');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== IMAGE_CACHE &&
                cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim(),
      
      // Clean expired cache entries
      cleanExpiredCaches()
    ])
  );
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle POST/PUT/DELETE for offline queue
    if (!navigator.onLine) {
      event.respondWith(handleOfflineRequest(request));
    }
    return;
  }

  // Different strategies based on request type
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirstWithTimeout(request, API_CACHE, 3000));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.PAYMENT:
      event.waitUntil(syncPayments());
      break;
    case SYNC_TAGS.AGREEMENT:
      event.waitUntil(syncAgreements());
      break;
    case SYNC_TAGS.MAINTENANCE:
      event.waitUntil(syncMaintenance());
      break;
    case SYNC_TAGS.CUSTOMER:
      event.waitUntil(syncCustomers());
      break;
    case SYNC_TAGS.VEHICLE:
      event.waitUntil(syncVehicles());
      break;
    case SYNC_TAGS.DOCUMENT:
      event.waitUntil(syncDocuments());
      break;
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  const options = {
    body: 'لديك تحديث جديد في نظام العارف للتأجير',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'فتح التطبيق',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/icons/xmark.png'
      }
    ],
    requireInteraction: true,
    tag: 'rental-notification'
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'العارف للتأجير';
  }
  
  event.waitUntil(
    self.registration.showNotification('العارف للتأجير', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Message handling for cache updates
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCaches());
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

// Caching strategies
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse)) {
      // Update in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {}); // Silent fail for background update
      
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first strategy failed:', error);
    return new Response('Offline - Resource not available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function networkFirstWithTimeout(request, cacheName, timeout = 3000) {
  try {
    const cache = await caches.open(cacheName);
    
    // Race between network and timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    );
    
    try {
      const response = await Promise.race([networkPromise, timeoutPromise]);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (networkError) {
      console.log('[SW] Network failed, trying cache:', networkError.message);
      const cachedResponse = await cache.match(request);
      
    if (cachedResponse) {
      return cachedResponse;
    }

      throw new Error('No cache available');
    }
  } catch (error) {
    console.error('[SW] Network first strategy failed:', error);
      return new Response(
        JSON.stringify({ 
        error: 'Service temporarily unavailable',
        message: 'سيتم تحديث البيانات عند عودة الاتصال',
        offline: true 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  try {
      const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Start fetch in background
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Otherwise wait for network
    return await fetchPromise;
  } catch (error) {
    console.error('[SW] Stale while revalidate failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Utility functions
function isStaticAsset(url) {
  return url.pathname.includes('/assets/') ||
         url.pathname.includes('/icons/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.ttf');
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isImageRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/);
}

function isExpired(response) {
  const cachedTime = response.headers.get('sw-cache-time');
  if (!cachedTime) return false;
  
  const age = Date.now() - parseInt(cachedTime);
  return age > CACHE_DURATION.STATIC;
}

async function handleOfflineRequest(request) {
  // Add to offline queue
  const requestData = {
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: request.method !== 'GET' ? await request.text() : null,
    timestamp: Date.now()
  };
  
  offlineQueue.push(requestData);
  localStorage.setItem('offline-queue', JSON.stringify(offlineQueue));
  
  // Schedule background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('offline-sync');
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'تم حفظ العملية وسيتم تنفيذها عند عودة الاتصال',
      queued: true 
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background sync functions
async function syncPayments() {
  console.log('[SW] Syncing payments...');
  const queue = getOfflineQueue().filter(item => item.url.includes('/payments'));
  await processQueue(queue, SYNC_TAGS.PAYMENT);
}

async function syncAgreements() {
  console.log('[SW] Syncing agreements...');
  const queue = getOfflineQueue().filter(item => item.url.includes('/agreements') || item.url.includes('/leases'));
  await processQueue(queue, SYNC_TAGS.AGREEMENT);
}

async function syncMaintenance() {
  console.log('[SW] Syncing maintenance...');
  const queue = getOfflineQueue().filter(item => item.url.includes('/maintenance'));
  await processQueue(queue, SYNC_TAGS.MAINTENANCE);
}

async function syncCustomers() {
  console.log('[SW] Syncing customers...');
  const queue = getOfflineQueue().filter(item => item.url.includes('/customers'));
  await processQueue(queue, SYNC_TAGS.CUSTOMER);
}

async function syncVehicles() {
  console.log('[SW] Syncing vehicles...');
  const queue = getOfflineQueue().filter(item => item.url.includes('/vehicles'));
  await processQueue(queue, SYNC_TAGS.VEHICLE);
}

async function syncDocuments() {
  console.log('[SW] Syncing documents...');
  const queue = getOfflineQueue().filter(item => item.url.includes('/documents'));
  await processQueue(queue, SYNC_TAGS.DOCUMENT);
}

function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem('offline-queue') || '[]');
  } catch {
    return [];
  }
}

async function processQueue(queue, syncTag) {
  const successes = [];
  const failures = [];
  
  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: new Headers(item.headers),
        body: item.body
        });
        
        if (response.ok) {
        successes.push(item);
      } else {
        failures.push(item);
    }
  } catch (error) {
      console.error('[SW] Sync failed for item:', item, error);
      failures.push(item);
    }
  }
  
  // Update queue by removing successful items
  if (successes.length > 0) {
    offlineQueue = offlineQueue.filter(item => !successes.includes(item));
    localStorage.setItem('offline-queue', JSON.stringify(offlineQueue));
    
    // Notify clients about successful sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_SUCCESS',
        tag: syncTag,
        count: successes.length
      });
    });
  }
  
  console.log(`[SW] Sync completed - Success: ${successes.length}, Failed: ${failures.length}`);
}

async function cleanExpiredCaches() {
  const cacheNames = [API_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response && isExpired(response)) {
              await cache.delete(request);
        }
      }
    } catch (error) {
      console.error('[SW] Error cleaning cache:', cacheName, error);
    }
  }
}

async function updateCaches() {
  console.log('[SW] Updating caches...');
  
  // Clear old caches
  await clearAllCaches();
  
  // Re-cache static assets
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(STATIC_ASSETS);
  
  console.log('[SW] Caches updated successfully');
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Performance monitoring
console.log('[SW] Service Worker v3.0.0 loaded successfully');
console.log('[SW] Cache strategy: Static (cache-first), API (network-first), Images (cache-first), Dynamic (stale-while-revalidate)');
console.log('[SW] Background sync enabled for: payments, agreements, maintenance, customers, vehicles, documents');
console.log('[SW] Push notifications enabled');
console.log('[SW] Offline queue enabled');
