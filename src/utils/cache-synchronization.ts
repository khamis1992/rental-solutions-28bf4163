
import { QueryClient } from '@tanstack/react-query';

export class CacheSynchronization {
  private static queryClient: QueryClient | null = null;

  static setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  static async invalidateCustomerCaches() {
    if (!this.queryClient) {
      console.warn('QueryClient not set for cache synchronization');
      return;
    }

    // Invalidate all customer-related queries
    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: ['customers'] }),
      this.queryClient.invalidateQueries({ queryKey: ['customer-selector'] }),
      this.queryClient.invalidateQueries({ queryKey: ['profiles'] })
    ]);
  }

  static async invalidateVehicleCaches() {
    if (!this.queryClient) {
      console.warn('QueryClient not set for cache synchronization');
      return;
    }

    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
      this.queryClient.invalidateQueries({ queryKey: ['vehicle-selector'] })
    ]);
  }

  static async invalidateAgreementCaches() {
    if (!this.queryClient) {
      console.warn('QueryClient not set for cache synchronization');
      return;
    }

    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: ['agreements'] }),
      this.queryClient.invalidateQueries({ queryKey: ['leases'] })
    ]);
  }

  static async invalidateAllCaches() {
    if (!this.queryClient) {
      console.warn('QueryClient not set for cache synchronization');
      return;
    }

    await this.queryClient.invalidateQueries();
  }
}
