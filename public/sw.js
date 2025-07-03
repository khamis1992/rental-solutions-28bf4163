/**
 * Service Worker متقدم لنظام تأجير السيارات
 * Advanced Service Worker for Car Rental System
 */

const CACHE_NAME = 'alaraf-rental-v2.0';
const API_CACHE_NAME = 'alaraf-api-v2.0';
const STATIC_CACHE_NAME = 'alaraf-static-v2.0';

// الموارد الحرجة للتخزين المؤقت الفوري
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/App.tsx',
  '/src/main.tsx',
  '/src/index.css'
];

// الموارد الثابتة
const STATIC_ASSETS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fonts/Amiri-Bold.ttf',
  '/fonts/Amiri-normal.ttf'
];

// أنماط URL للتخزين المؤقت
const API_PATTERNS = [
  /\/api\/.*$/,
  /\/auth\/.*$/,
  /\/supabase\/.*$/
];

// استراتيجيات التخزين المؤقت
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only'
};

// مراقب الأداء
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  recordCacheHit(url, strategy) {
    const key = `${strategy}-hit`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    console.log(`🎯 Cache HIT: ${url} [${strategy}]`);
  }

  recordCacheMiss(url, strategy) {
    const key = `${strategy}-miss`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
    console.log(`❌ Cache MISS: ${url} [${strategy}]`);
  }

  recordNetworkTime(url, duration) {
    console.log(`🌐 Network: ${url} took ${duration}ms`);
  }

  getStats() {
    const stats = {};
    this.metrics.forEach((value, key) => {
      stats[key] = value;
    });
    return {
      ...stats,
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

// مساعد للتحقق من نوع الطلب
const getRequestType = (url) => {
  if (API_PATTERNS.some(pattern => pattern.test(url))) return 'api';
  if (url.match(/\.(js|css|html)$/)) return 'static';
  if (url.match(/\.(png|jpg|jpeg|svg|webp|gif)$/)) return 'image';
  if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
  return 'document';
};

// استراتيجية Cache First (للموارد الثابتة)
const cacheFirst = async (request, cacheName = CACHE_NAME) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    performanceMonitor.recordCacheHit(request.url, 'cache-first');
    return cachedResponse;
  }

  performanceMonitor.recordCacheMiss(request.url, 'cache-first');
  
  try {
    const startTime = Date.now();
    const networkResponse = await fetch(request);
    const duration = Date.now() - startTime;
    
    performanceMonitor.recordNetworkTime(request.url, duration);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network request failed:', error);
    return new Response('Network Error', { status: 503 });
  }
};

// استراتيجية Network First (للبيانات الديناميكية)
const networkFirst = async (request, cacheName = API_CACHE_NAME) => {
  const cache = await caches.open(cacheName);
  
  try {
    const startTime = Date.now();
    const networkResponse = await fetch(request);
    const duration = Date.now() - startTime;
    
    performanceMonitor.recordNetworkTime(request.url, duration);
    
    if (networkResponse.ok) {
      // تخزين مؤقت ذكي للAPI
      const responseToCache = networkResponse.clone();
      
      // إضافة metadata للكاش
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-timestamp', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    performanceMonitor.recordCacheMiss(request.url, 'network-first');
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('🔄 Fallback to cache for:', request.url);
      return cachedResponse;
    }
    
    return new Response('Offline', { status: 503 });
  }
};

// استراتيجية Stale While Revalidate
const staleWhileRevalidate = async (request, cacheName = CACHE_NAME) => {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // إرجاع الكاش فوراً إذا وُجد
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  if (cachedResponse) {
    performanceMonitor.recordCacheHit(request.url, 'stale-while-revalidate');
    return cachedResponse;
  }

  performanceMonitor.recordCacheMiss(request.url, 'stale-while-revalidate');
  return fetchPromise;
};

// تنظيف الكاش القديم
const cleanupExpiredCache = async () => {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (cacheName.includes('alaraf') && cacheName !== CACHE_NAME && 
        cacheName !== API_CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
      console.log('🧹 Deleting old cache:', cacheName);
      await caches.delete(cacheName);
    }
  }
  
  // تنظيف cache entries المنتهية الصلاحية
  const apiCache = await caches.open(API_CACHE_NAME);
  const apiRequests = await apiCache.keys();
  const now = Date.now();
  
  for (const request of apiRequests) {
    const response = await apiCache.match(request);
    if (response) {
      const cacheTimestamp = response.headers.get('sw-cache-timestamp');
      if (cacheTimestamp && (now - parseInt(cacheTimestamp)) > 300000) { // 5 minutes
        await apiCache.delete(request);
        console.log('🗑️ Deleted expired API cache:', request.url);
      }
    }
  }
};

// تحديث الكاش في الخلفية
const updateCache = async () => {
  const cache = await caches.open(CACHE_NAME);
  
  for (const asset of CRITICAL_ASSETS) {
    try {
      const response = await fetch(asset);
      if (response.ok) {
        await cache.put(asset, response);
        console.log('🔄 Updated cache for:', asset);
      }
    } catch (error) {
      console.warn('Failed to update cache for:', asset, error);
    }
  }
};

// Event Listeners

self.addEventListener('install', event => {
  console.log('🚀 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(CRITICAL_ASSETS)),
      caches.open(STATIC_CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      cleanupExpiredCache(),
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated');
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  const requestType = getRequestType(url.pathname);

  // تخطي الطلبات غير المدعومة
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // استراتيجية التخزين حسب نوع المورد
  let strategy;
  
  switch (requestType) {
    case 'api':
      strategy = () => networkFirst(request, API_CACHE_NAME);
      break;
    case 'static':
    case 'font':
      strategy = () => cacheFirst(request, STATIC_CACHE_NAME);
      break;
    case 'image':
      strategy = () => cacheFirst(request, CACHE_NAME);
      break;
    case 'document':
    default:
      strategy = () => staleWhileRevalidate(request, CACHE_NAME);
      break;
  }

  event.respondWith(strategy());
});

// Background Sync للطلبات المؤجلة
self.addEventListener('sync', event => {
  if (event.tag === 'background-cache-update') {
    event.waitUntil(updateCache());
  }
  
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupExpiredCache());
  }
});

// إرسال إحصائيات الأداء
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_PERFORMANCE_STATS') {
    event.ports[0].postMessage(performanceMonitor.getStats());
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// تنظيف دوري كل 30 دقيقة
setInterval(() => {
  cleanupExpiredCache();
}, 30 * 60 * 1000);

console.log('🎯 Advanced Service Worker loaded successfully');
