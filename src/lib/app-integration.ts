import { performanceMonitor } from '@/utils/performance-utils';
import { globalEventBus } from '@/utils/component-communication';

export class AppIntegrationManager {
  private static instance: AppIntegrationManager;
  private isInitialized = false;
  private components = new Map<string, any>();
  private subscriptions = new Map<string, () => void>();

  private constructor() {}

  public static getInstance(): AppIntegrationManager {
    if (!AppIntegrationManager.instance) {
      AppIntegrationManager.instance = new AppIntegrationManager();
    }
    return AppIntegrationManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log(' Initializing App Integration Manager...');
      
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        window.appIntegration = this;
      }

      this.isInitialized = true;
      console.log(' App Integration Manager initialized successfully');
    } catch (error) {
      console.error(' Failed to initialize App Integration Manager:', error);
      throw error;
    }
  }

  public cleanup(): void {
    if (!this.isInitialized) return;

    try {
      this.subscriptions.forEach(unsubscribe => unsubscribe());
      this.subscriptions.clear();

      if (typeof window !== 'undefined') {
        delete (window as any).appIntegration;
      }

      this.isInitialized = false;
      console.log(' App Integration Manager cleaned up');
    } catch (error) {
      console.error(' Error during cleanup:', error);
    }
  }

  public getComponents(): Array<{ name: string; status: string }> {
    return Array.from(this.components.entries()).map(([name, component]) => ({
      name,
      status: component.status || 'active'
    }));
  }

  public getPerformanceMetrics(): any {
    return performanceMonitor.getMetrics();
  }

  public emitEvent(eventName: string, data: any): void {
    globalEventBus.emit(eventName, data);
  }

  public clearCache(): void {
    console.log(' Cache cleared');
  }
}

export const initializeApp = async (): Promise<void> => {
  const manager = AppIntegrationManager.getInstance();
  await manager.initialize();
};

export const cleanupApp = (): void => {
  const manager = AppIntegrationManager.getInstance();
  manager.cleanup();
};
