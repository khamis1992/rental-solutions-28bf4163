import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Define prefetch rules for different routes and their data requirements
const PREFETCH_RULES = {
  '/dashboard': ['vehicles', 'agreements', 'maintenance'],
  '/vehicles': ['maintenance', 'agreements'],
  '/agreements': ['customers', 'vehicles'],
  '/customers': ['agreements'],
  '/maintenance': ['vehicles', 'agreements']
} as const;

// Define data fetching functions for each type
const DATA_FETCHERS = {
  vehicles: async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('id, make, model, year, license_plate, status')
      .limit(10);
    if (error) throw error;
    return data;
  },
  agreements: async () => {
    const { data, error } = await supabase
      .from('leases')
      .select('id, start_date, end_date, status, customer_id, vehicle_id')
      .limit(10);
    if (error) throw error;
    return data;
  },
  customers: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .limit(10);
    if (error) throw error;
    return data;
  },
  maintenance: async () => {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('id, vehicle_id, service_date, status, description')
      .limit(10);
    if (error) throw error;
    return data;
  }
} as const;

type PrefetchKey = keyof typeof PREFETCH_RULES;
type DataKey = keyof typeof DATA_FETCHERS;

interface PrefetchOptions {
  staleTime?: number;
  cacheTime?: number;
}

export class PrefetchManager {
  private static instance: PrefetchManager;
  private prefetchedPaths: Set<string> = new Set();
  private intersectionObserver?: IntersectionObserver;
  private queryClient?: ReturnType<typeof useQueryClient>;

  private constructor() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const path = entry.target.getAttribute('data-prefetch');
              if (path) this.prefetchRoute(path);
            }
          });
        },
        { threshold: 0.1 }
      );
    }
  }

  static getInstance(): PrefetchManager {
    if (!PrefetchManager.instance) {
      PrefetchManager.instance = new PrefetchManager();
    }
    return PrefetchManager.instance;
  }

  setQueryClient(queryClient: ReturnType<typeof useQueryClient>) {
    this.queryClient = queryClient;
  }

  observeLink(element: HTMLElement, path: string): void {
    if (!this.intersectionObserver) return;
    element.setAttribute('data-prefetch', path);
    this.intersectionObserver.observe(element);
  }

  unobserveLink(element: HTMLElement): void {
    if (!this.intersectionObserver) return;
    this.intersectionObserver.unobserve(element);
  }

  async prefetchRoute(path: string, options: PrefetchOptions = {}): Promise<void> {
    if (!this.queryClient || this.prefetchedPaths.has(path)) return;
    this.prefetchedPaths.add(path);

    const prefetchQueries = PREFETCH_RULES[path as PrefetchKey] || [];
    const defaultOptions = {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000  // 5 minutes
    };

    const mergedOptions = { ...defaultOptions, ...options };

    await Promise.all(
      prefetchQueries.map(async (queryKey) => {
        try {
          await this.queryClient!.prefetchQuery({
            queryKey: [queryKey],
            queryFn: () => DATA_FETCHERS[queryKey as DataKey](),
            staleTime: mergedOptions.staleTime,
            cacheTime: mergedOptions.cacheTime
          });
        } catch (error) {
          console.error(`Failed to prefetch ${queryKey}:`, error);
        }
      })
    );
  }

  clearPrefetchCache(): void {
    this.prefetchedPaths.clear();
  }
}

// React hook to use the prefetch manager
export function usePrefetchManager() {
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const prefetchManager = PrefetchManager.getInstance();
    prefetchManager.setQueryClient(queryClient);

    // Prefetch data for current route
    const currentPath = location.pathname;
    if (PREFETCH_RULES[currentPath as PrefetchKey]) {
      prefetchManager.prefetchRoute(currentPath);
    }

    // Clean up prefetch observers when component unmounts
    return () => {
      document.querySelectorAll('[data-prefetch]').forEach((element) => {
        prefetchManager.unobserveLink(element as HTMLElement);
      });
    };
  }, [location.pathname, queryClient]);

  return PrefetchManager.getInstance();
}