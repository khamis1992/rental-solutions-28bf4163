
/**
 * Utility for controlling concurrency in asynchronous operations
 */

/**
 * A simple semaphore implementation for limiting concurrent operations
 */
export class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(count: number) {
    this.permits = count;
  }

  /**
   * Acquire a permit to execute an operation
   * @returns A promise that resolves when a permit is acquired
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }
    
    return new Promise<void>(resolve => {
      this.waiting.push(resolve);
    });
  }

  /**
   * Release a permit after an operation completes
   */
  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) next();
    } else {
      this.permits++;
    }
  }

  /**
   * Execute a function with semaphore control
   * @param fn The function to execute once a permit is acquired
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/**
 * Run a set of promises with limited concurrency
 * @param items The items to process
 * @param concurrency Maximum number of concurrent operations
 * @param fn The function to execute for each item
 * @returns Results of all operations
 */
export async function runWithConcurrencyLimit<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const semaphore = new Semaphore(concurrency);
  
  return Promise.all(
    items.map((item, index) => 
      semaphore.execute(() => fn(item, index))
    )
  );
}

/**
 * Process items in batches with controlled concurrency
 * @param items The items to process
 * @param batchSize Size of each batch
 * @param concurrency Maximum concurrent operations per batch
 * @param fn The function to execute for each item
 * @param onBatchComplete Optional callback when a batch completes
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  onBatchComplete?: (results: R[], batchIndex: number) => void
): Promise<R[]> {
  const results: R[] = [];
  
  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);
    
    // Process the current batch with limited concurrency
    const batchResults = await runWithConcurrencyLimit(
      batch,
      Math.min(concurrency, batch.length),
      (item, index) => fn(item, i + index)
    );
    
    results.push(...batchResults);
    
    if (onBatchComplete) {
      onBatchComplete(batchResults, batchIndex);
    }
  }
  
  return results;
}
