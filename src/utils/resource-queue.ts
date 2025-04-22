// Resource priority levels
export enum ResourcePriority {
  CRITICAL = 0, // Highest priority - load immediately
  HIGH = 1,     // Important resources - load soon
  MEDIUM = 2,   // Standard priority
  LOW = 3,      // Load when possible
  IDLE = 4      // Load only during idle time
}

interface QueueItem {
  id: string;
  load: () => Promise<any>;
  priority: ResourcePriority;
}

class ResourceQueue {
  private static instance: ResourceQueue;
  private queue: QueueItem[] = [];
  private inProgress: Set<string> = new Set();
  private completed: Set<string> = new Set();
  private maxConcurrent = 4;
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): ResourceQueue {
    if (!ResourceQueue.instance) {
      ResourceQueue.instance = new ResourceQueue();
    }
    return ResourceQueue.instance;
  }

  add(id: string, load: () => Promise<any>, priority: ResourcePriority): void {
    if (this.completed.has(id) || this.inProgress.has(id)) {
      return;
    }

    const existingIndex = this.queue.findIndex(item => item.id === id);
    if (existingIndex >= 0) {
      // Update priority if the new priority is higher (lower number)
      if (priority < this.queue[existingIndex].priority) {
        this.queue[existingIndex].priority = priority;
        // Re-sort queue if we updated a priority
        this.sortQueue();
      }
      return;
    }

    this.queue.push({ id, load, priority });
    this.sortQueue();
    this.processQueue();
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.queue.length > 0 && this.inProgress.size < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item || this.completed.has(item.id) || this.inProgress.has(item.id)) {
        continue;
      }

      this.inProgress.add(item.id);

      // Process the item
      this.loadResource(item).catch(error => {
        console.error(`Failed to load resource ${item.id}:`, error);
      });
    }

    this.isProcessing = false;
  }

  private async loadResource(item: QueueItem): Promise<void> {
    try {
      await item.load();
      this.completed.add(item.id);
    } catch (error) {
      console.error(`Error loading resource ${item.id}:`, error);
    } finally {
      this.inProgress.delete(item.id);
      
      // Process the next batch
      setTimeout(() => this.processQueue(), 0);
    }
  }

  isLoaded(id: string): boolean {
    return this.completed.has(id);
  }

  isLoading(id: string): boolean {
    return this.inProgress.has(id);
  }

  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max;
    // Try to process more items if we increased the limit
    if (max > this.maxConcurrent) {
      this.processQueue();
    }
  }
}

export const resourceQueue = ResourceQueue.getInstance();

// Helper functions for different resource types
export function preloadImage(src: string, priority: ResourcePriority = ResourcePriority.MEDIUM): Promise<HTMLImageElement> {
  const id = `img:${src}`;
  
  return new Promise((resolve, reject) => {
    if (resourceQueue.isLoaded(id)) {
      // Return a fake image element if already loaded
      const dummyImg = new Image();
      dummyImg.src = src;
      resolve(dummyImg);
      return;
    }
    
    resourceQueue.add(id, async () => {
      return new Promise<HTMLImageElement>((resolveLoad, rejectLoad) => {
        const img = new Image();
        img.onload = () => resolveLoad(img);
        img.onerror = () => rejectLoad(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });
    }, priority);
  });
}

export function preloadRoute(
  routePath: string,
  priority: ResourcePriority = ResourcePriority.MEDIUM
): Promise<void> {
  const id = `route:${routePath}`;
  
  return new Promise<void>((resolve, reject) => {
    if (resourceQueue.isLoaded(id)) {
      resolve();
      return;
    }
    
    resourceQueue.add(id, async () => {
      try {
        // Use dynamic import to preload the route
        await import(/* @vite-ignore */ routePath);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, priority);
  });
}

export function preloadFont(
  fontFamily: string,
  fontUrl: string,
  fontWeight = 'normal',
  fontStyle = 'normal',
  priority: ResourcePriority = ResourcePriority.HIGH
): Promise<void> {
  const id = `font:${fontFamily}:${fontWeight}:${fontStyle}`;
  
  return new Promise<void>((resolve, reject) => {
    if (resourceQueue.isLoaded(id)) {
      resolve();
      return;
    }
    
    resourceQueue.add(id, async () => {
      try {
        const font = new FontFace(fontFamily, `url(${fontUrl})`, {
          weight: fontWeight,
          style: fontStyle
        });
        
        await font.load();
        document.fonts.add(font);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, priority);
  });
}

export function preloadData<T>(
  fetcher: () => Promise<T>,
  key: string,
  priority: ResourcePriority = ResourcePriority.MEDIUM
): Promise<T> {
  const id = `data:${key}`;
  
  return new Promise<T>((resolve, reject) => {
    if (resourceQueue.isLoaded(id)) {
      // Resolve with undefined since we can't return the actual data here
      // The consumer should use their data fetching solution to get the actual data
      resolve(undefined as unknown as T);
      return;
    }
    
    resourceQueue.add(id, async () => {
      try {
        const data = await fetcher();
        resolve(data);
        return data;
      } catch (error) {
        reject(error);
        throw error;
      }
    }, priority);
  });
}