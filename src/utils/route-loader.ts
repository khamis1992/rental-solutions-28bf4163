import { ResourcePriority, preloadRoute } from './resource-queue';
import { useCallback } from 'react';
import RoutePrefetchManager from './route-prefetch-manager';

// Define route configurations with their dependencies
interface RouteConfig {
  path: string;
  component: string;
  priority: ResourcePriority;
  dependencies?: string[];
}

// Define critical route paths that should be preloaded
const CRITICAL_ROUTES: RouteConfig[] = [
  {
    path: '/dashboard',
    component: './routes/DashboardRoutes',
    priority: ResourcePriority.CRITICAL,
    dependencies: [
      './components/dashboard/DashboardMetrics',
      './components/dashboard/RecentActivity'
    ]
  },
  {
    path: '/agreements',
    component: './routes/AgreementRoutes',
    priority: ResourcePriority.HIGH,
    dependencies: [
      './components/agreements/AgreementList',
      './components/agreements/AgreementForm'
    ]
  },
  {
    path: '/vehicles',
    component: './routes/VehicleRoutes',
    priority: ResourcePriority.HIGH,
    dependencies: [
      './components/vehicles/VehicleList',
      './components/vehicles/VehicleForm'
    ]
  }
];

// Define secondary routes that can be loaded with lower priority
const SECONDARY_ROUTES: RouteConfig[] = [
  {
    path: '/maintenance',
    component: './routes/MaintenanceRoutes',
    priority: ResourcePriority.MEDIUM
  },
  {
    path: '/customers',
    component: './routes/CustomerRoutes',
    priority: ResourcePriority.MEDIUM
  },
  {
    path: '/settings',
    component: './routes/SettingsRoutes',
    priority: ResourcePriority.LOW
  }
];

class RouteLoader {
  private static instance: RouteLoader;
  private loadedRoutes: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<void>> = new Map();

  private constructor() {
    // Start preloading critical routes when browser is idle
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => this.preloadCriticalRoutes());
    } else {
      setTimeout(() => this.preloadCriticalRoutes(), 1000);
    }
  }

  static getInstance(): RouteLoader {
    if (!RouteLoader.instance) {
      RouteLoader.instance = new RouteLoader();
    }
    return RouteLoader.instance;
  }

  private async preloadCriticalRoutes() {
    for (const route of CRITICAL_ROUTES) {
      await this.preloadRoute(route);
    }
  }

  async preloadRoute(config: RouteConfig): Promise<void> {
    if (this.loadedRoutes.has(config.path)) return;
    
    // Check if route is already being loaded
    const existingPromise = this.loadingPromises.get(config.path);
    if (existingPromise) return existingPromise;

    const loadPromise = (async () => {
      try {
        // Load the main route component
        await preloadRoute(config.component, config.priority);

        // Load dependencies if any
        if (config.dependencies) {
          await Promise.all(
            config.dependencies.map(dep => 
              preloadRoute(dep, config.priority)
            )
          );
        }

        this.loadedRoutes.add(config.path);
      } catch (error) {
        console.error(`Failed to preload route ${config.path}:`, error);
      } finally {
        this.loadingPromises.delete(config.path);
      }
    })();

    this.loadingPromises.set(config.path, loadPromise);
    return loadPromise;
  }

  prepareRoute(path: string): Promise<void> | undefined {
    const config = [...CRITICAL_ROUTES, ...SECONDARY_ROUTES]
      .find(route => route.path === path);

    if (config) {
      return this.preloadRoute(config);
    }
  }

  isRouteLoaded(path: string): boolean {
    return this.loadedRoutes.has(path);
  }

  getLoadingStatus(): { loaded: string[]; loading: string[] } {
    return {
      loaded: Array.from(this.loadedRoutes),
      loading: Array.from(this.loadingPromises.keys())
    };
  }
}

export const routeLoader = RouteLoader.getInstance();

// React hook wrapper
export function useRouteLoader() {
  const routePrefetchManager = RoutePrefetchManager.getInstance();

  const prepareRoute = useCallback(async (path: string) => {
    // Prioritize the requested route
    routePrefetchManager.prioritizeRoute(path);

    // If the route isn't prefetched yet, start prefetching routes
    if (!routePrefetchManager.isPrefetched(path)) {
      await routePrefetchManager.prefetchRoutes();
    }
  }, []);

  return { prepareRoute };
}

// Initialize route prefetching early
if (typeof window !== 'undefined') {
  const routePrefetchManager = RoutePrefetchManager.getInstance();
  // Start prefetching routes with low concurrency to avoid overwhelming the browser
  routePrefetchManager.prefetchRoutes(1).catch(console.error);
}