import { PrefetchManager } from './prefetch-manager';

export interface RoutePriority {
  path: string;
  priority: number; // 1-5, where 1 is highest priority
  dependencies?: string[];
}

const ROUTE_PRIORITIES: RoutePriority[] = [
  { path: '/dashboard', priority: 1 },
  { path: '/vehicles', priority: 2 },
  { path: '/customers', priority: 2 },
  { path: '/agreements', priority: 2 },
  { path: '/maintenance', priority: 3 },
  { path: '/financials', priority: 3 },
  { path: '/reports', priority: 4 },
  { path: '/settings', priority: 4 },
  { path: '/legal', priority: 5 },
  { path: '/fines', priority: 5 }
];

class RoutePrefetchManager {
  private static instance: RoutePrefetchManager;
  private prefetchQueue: RoutePriority[] = [];
  private prefetchedRoutes: Set<string> = new Set();
  private prefetchManager: PrefetchManager;

  private constructor() {
    this.prefetchManager = PrefetchManager.getInstance();
    this.initializePrefetchQueue();
  }

  public static getInstance(): RoutePrefetchManager {
    if (!RoutePrefetchManager.instance) {
      RoutePrefetchManager.instance = new RoutePrefetchManager();
    }
    return RoutePrefetchManager.instance;
  }

  private initializePrefetchQueue(): void {
    this.prefetchQueue = [...ROUTE_PRIORITIES].sort((a, b) => a.priority - b.priority);
  }

  public async prefetchNextRoute(): Promise<void> {
    const nextRoute = this.prefetchQueue.shift();
    if (!nextRoute || this.prefetchedRoutes.has(nextRoute.path)) {
      return;
    }

    try {
      // Check if dependencies are prefetched
      if (nextRoute.dependencies) {
        const missingDeps = nextRoute.dependencies.filter(
          dep => !this.prefetchedRoutes.has(dep)
        );
        if (missingDeps.length > 0) {
          // Put back in queue if dependencies aren't ready
          this.prefetchQueue.push(nextRoute);
          return;
        }
      }

      // Trigger route module prefetch
      await this.prefetchManager.prefetch(nextRoute.path);
      this.prefetchedRoutes.add(nextRoute.path);
    } catch (error) {
      console.error(`Failed to prefetch route ${nextRoute.path}:`, error);
      // Put back in queue with lower priority for retry
      this.prefetchQueue.push({
        ...nextRoute,
        priority: Math.min(nextRoute.priority + 1, 5)
      });
    }
  }

  public async prefetchRoutes(concurrency = 2): Promise<void> {
    const prefetchBatch = async () => {
      while (this.prefetchQueue.length > 0) {
        await this.prefetchNextRoute();
      }
    };

    // Start multiple prefetch streams
    const prefetchStreams = Array(concurrency)
      .fill(null)
      .map(() => prefetchBatch());

    await Promise.all(prefetchStreams);
  }

  public prioritizeRoute(path: string): void {
    const routeIndex = this.prefetchQueue.findIndex(r => r.path === path);
    if (routeIndex > -1) {
      const route = this.prefetchQueue[routeIndex];
      // Move to front of queue within its priority level
      this.prefetchQueue.splice(routeIndex, 1);
      const insertIndex = this.prefetchQueue.findIndex(r => r.priority > route.priority);
      if (insertIndex === -1) {
        this.prefetchQueue.push(route);
      } else {
        this.prefetchQueue.splice(insertIndex, 0, route);
      }
    }
  }

  public isPrefetched(path: string): boolean {
    return this.prefetchedRoutes.has(path);
  }

  public reset(): void {
    this.prefetchedRoutes.clear();
    this.initializePrefetchQueue();
  }
}

export default RoutePrefetchManager;