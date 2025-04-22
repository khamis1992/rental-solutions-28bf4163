
/**
 * Resource Queue for optimizing loading of resources
 */

export type ResourceQueueOptions = {
  maxConcurrent?: number;
  timeout?: number;
};

class ResourceQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing: number = 0;
  private maxConcurrent: number;
  private timeout: number;

  constructor({ maxConcurrent = 4, timeout = 30000 }: ResourceQueueOptions = {}) {
    this.maxConcurrent = maxConcurrent;
    this.timeout = timeout;
  }

  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(() => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Resource loading timed out'));
        }, this.timeout);
        
        return task()
          .then((result) => {
            clearTimeout(timeoutId);
            resolve(result);
            return result;
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
            throw error;
          });
      });
      
      this.processNext();
    });
  }

  private processNext() {
    if (this.processing >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.processing++;
    const task = this.queue.shift();
    if (!task) return;

    Promise.resolve(task())
      .catch(error => console.error('Error processing queue task:', error))
      .finally(() => {
        this.processing--;
        this.processNext();
      });
  }

  clear() {
    this.queue = [];
  }
}

export const globalResourceQueue = new ResourceQueue();

export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return globalResourceQueue.add(() => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  });
};

// Alias for backward compatibility
export const loadImage = preloadImage;
