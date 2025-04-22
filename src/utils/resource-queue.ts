
/**
 * Priority levels for resource loading
 */
export enum ResourcePriority {
  CRITICAL = 0, // Load immediately, blocking if necessary
  HIGH = 1,     // Load very soon, user is likely to need this
  MEDIUM = 2,   // Standard priority, load when bandwidth available
  LOW = 3,      // Load only when idle
  PREFETCH = 4  // Load only when completely idle and no other resources pending
}

interface QueuedResource {
  url: string;
  priority: ResourcePriority;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  type: 'route' | 'image' | 'script' | 'style';
  loadStarted: boolean;
}

// Queue of resources to be loaded
const resourceQueue: QueuedResource[] = [];
let isProcessing = false;

/**
 * Add a resource to the loading queue with the given priority
 */
function queueResource<T>(
  url: string, 
  priority: ResourcePriority, 
  loadFunction: (url: string) => Promise<T>,
  type: 'route' | 'image' | 'script' | 'style'
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Add resource to the queue
    resourceQueue.push({ url, priority, resolve, reject, type, loadStarted: false });
    
    // Sort the queue by priority
    resourceQueue.sort((a, b) => a.priority - b.priority);
    
    // Start processing the queue if it's not already being processed
    if (!isProcessing) {
      processQueue();
    }
  });
}

/**
 * Process the resource queue, loading resources in priority order
 */
async function processQueue() {
  if (isProcessing || resourceQueue.length === 0) return;
  
  isProcessing = true;
  
  // Get the next resource to load (highest priority)
  const resource = resourceQueue[0];
  resourceQueue.shift();
  
  try {
    resource.loadStarted = true;
    
    // Load the resource based on its type
    let result;
    switch (resource.type) {
      case 'route':
        result = await loadRouteResource(resource.url);
        break;
      case 'image':
        result = await preloadImageResource(resource.url);
        break;
      case 'script':
        result = await loadScriptResource(resource.url);
        break;
      case 'style':
        result = await loadStyleResource(resource.url);
        break;
    }
    
    resource.resolve(result);
  } catch (error) {
    resource.reject(error);
  } finally {
    isProcessing = false;
    
    // Process the next resource in the queue
    if (resourceQueue.length > 0) {
      setTimeout(processQueue, 0);
    }
  }
}

/**
 * Load a route resource (could be JavaScript chunks, data, etc.)
 */
async function loadRouteResource(path: string): Promise<void> {
  console.log(`Preloading route: ${path}`);
  // This is a placeholder. In a real implementation,
  // you would load the necessary chunks for the route.
  return Promise.resolve();
}

/**
 * Preload an image resource
 */
async function preloadImageResource(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
  });
}

/**
 * Load a script resource
 */
async function loadScriptResource(src: string): Promise<HTMLScriptElement> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(script);
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Load a stylesheet resource
 */
async function loadStyleResource(href: string): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve(link);
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
}

/**
 * Preload a route with the given priority
 */
export function preloadRoute(path: string, priority: ResourcePriority = ResourcePriority.MEDIUM): Promise<void> {
  return queueResource(path, priority, loadRouteResource, 'route');
}

/**
 * Preload an image with the given priority
 */
export function preloadImage(src: string, priority: ResourcePriority = ResourcePriority.MEDIUM): Promise<HTMLImageElement> {
  return queueResource(src, priority, preloadImageResource, 'image');
}

/**
 * Preload a script with the given priority
 */
export function preloadScript(src: string, priority: ResourcePriority = ResourcePriority.MEDIUM): Promise<HTMLScriptElement> {
  return queueResource(src, priority, loadScriptResource, 'script');
}

/**
 * Preload a stylesheet with the given priority
 */
export function preloadStyle(href: string, priority: ResourcePriority = ResourcePriority.MEDIUM): Promise<HTMLLinkElement> {
  return queueResource(href, priority, loadStyleResource, 'style');
}
