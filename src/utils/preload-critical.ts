// List of critical routes that should be preloaded
const CRITICAL_ROUTES = [
  '/dashboard',
  '/agreements',
  '/vehicles',
  '/customers'
];

// List of critical assets (images, fonts, etc)
const CRITICAL_ASSETS = [
  '/favicon.ico',
  '/placeholder.svg'
];

/**
 * Preloads critical routes and assets
 */
export function preloadCriticalAssets() {
  // Preload critical routes
  CRITICAL_ROUTES.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });

  // Preload critical assets
  CRITICAL_ASSETS.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset;
    
    // Set appropriate as attribute based on file type
    if (asset.endsWith('.svg') || asset.endsWith('.png') || asset.endsWith('.jpg')) {
      link.as = 'image';
    } else if (asset.endsWith('.woff2') || asset.endsWith('.woff')) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to critical domains
 */
export function preconnectToCriticalDomains() {
  const domains = [
    // Add your Supabase URL and any other critical domains
    import.meta.env.VITE_SUPABASE_URL
  ];

  domains.forEach(domain => {
    if (!domain) return;

    // DNS prefetch
    const dns = document.createElement('link');
    dns.rel = 'dns-prefetch';
    dns.href = domain;
    document.head.appendChild(dns);

    // Preconnect
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = domain;
    preconnect.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect);
  });
}