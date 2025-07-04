interface RecoveryStrategy {
  name: string;
  canRecover: (error: Error) => boolean;
  recover: (error: Error) => Promise<boolean>;
  priority: number;
}

class ErrorRecoveryService {
  private strategies: RecoveryStrategy[] = [];

  constructor() {
    this.registerDefaultStrategies();
  }

  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
  }

  async attemptRecovery(error: Error): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          const recovered = await strategy.recover(error);
          if (recovered) {
            return true;
          }
        } catch (recoveryError) {
          console.warn(`Recovery strategy ${strategy.name} failed:`, recoveryError);
        }
      }
    }
    return false;
  }

  private registerDefaultStrategies(): void {
    this.registerStrategy({
      name: 'Network Retry',
      priority: 10,
      canRecover: (error) => error.message.includes('fetch') || error.message.includes('network'),
      recover: async (error) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      }
    });

    this.registerStrategy({
      name: 'Cache Clear',
      priority: 5,
      canRecover: (error) => error.message.includes('cache') || error.message.includes('storage'),
      recover: async (error) => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          return true;
        } catch {
          return false;
        }
      }
    });

    this.registerStrategy({
      name: 'Page Reload',
      priority: 1,
      canRecover: (error) => true,
      recover: async (error) => {
        window.location.reload();
        return true;
      }
    });
  }
}

export const errorRecoveryService = new ErrorRecoveryService();
