import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  getAuthToken?: () => string | null;
  onRateLimit?: (retryAfter: number) => void;
  onMonitor?: (info: { url: string; method: string; duration: number; payloadSize: number; responseSize: number }) => void;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  throttleLimit?: number;
  cache?: Map<string, any>;
}

export class ApiClient {
  private axios: AxiosInstance;
  private getAuthToken?: () => string | null;
  private onRateLimit?: (retryAfter: number) => void;
  private onMonitor?: (info: { url: string; method: string; duration: number; payloadSize: number; responseSize: number }) => void;
  private maxRetries: number;
  private retryBaseDelayMs: number;
  private throttleLimit: number;
  private cache: Map<string, any>;
  private throttleQueue: (() => void)[] = [];
  private activeRequests = 0;

  constructor(options: ApiClientOptions) {
    this.axios = axios.create({ baseURL: options.baseURL });
    this.getAuthToken = options.getAuthToken;
    this.onRateLimit = options.onRateLimit;
    this.onMonitor = options.onMonitor;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 300;
    this.throttleLimit = options.throttleLimit ?? 8;
    this.cache = options.cache || new Map();

    // Request interceptor for auth
    this.axios.interceptors.request.use(config => {
      const token = this.getAuthToken?.();
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  }

  private async request<T>(config: AxiosRequestConfig, useCache = false): Promise<T> {
    const cacheKey = config.method + ':' + config.url + ':' + JSON.stringify(config.params || config.data || {});
    if (useCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Throttling
    if (this.activeRequests >= this.throttleLimit) {
      await new Promise<void>(resolve => this.throttleQueue.push(resolve));
    }
    this.activeRequests++;

    let retries = 0;
    let lastError: any;
    const start = Date.now();
    let payloadSize = config.data ? JSON.stringify(config.data).length : 0;
    try {
      while (retries <= this.maxRetries) {
        try {
          const response: AxiosResponse<T> = await this.axios.request<T>(config);
          const responseSize = JSON.stringify(response.data).length;
          if (this.onMonitor) {
            this.onMonitor({
              url: config.url || '',
              method: config.method || 'GET',
              duration: Date.now() - start,
              payloadSize,
              responseSize,
            });
          }
          if (useCache) this.cache.set(cacheKey, response.data);
          return response.data;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            const err = error as AxiosError;
            // Rate limit (HTTP 429)
            if (err.response?.status === 429) {
              const retryAfter = Number(err.response.headers['retry-after']) || (2 ** retries) * this.retryBaseDelayMs;
              this.onRateLimit?.(retryAfter);
              await this.sleep(retryAfter);
              retries++;
              continue;
            }
            // Network or 5xx errors: retry
            if (!err.response || (err.response.status >= 500 && err.response.status < 600)) {
              await this.sleep((2 ** retries) * this.retryBaseDelayMs);
              retries++;
              continue;
            }
            // CORS errors
            if (err.code === 'ERR_NETWORK' && err.message.includes('CORS')) {
              throw new Error('CORS error: Please check API CORS settings.');
            }
            // Other errors: do not retry
            throw err;
          } else {
            throw error;
          }
        }
      }
      throw lastError || new Error('API request failed after retries');
    } finally {
      this.activeRequests--;
      if (this.throttleQueue.length > 0) {
        const next = this.throttleQueue.shift();
        if (next) next();
      }
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get<T>(url: string, params?: any, useCache = false) {
    return this.request<T>({ method: 'GET', url, params }, useCache);
  }

  post<T>(url: string, data?: any) {
    return this.request<T>({ method: 'POST', url, data });
  }

  put<T>(url: string, data?: any) {
    return this.request<T>({ method: 'PUT', url, data });
  }

  delete<T>(url: string, params?: any) {
    return this.request<T>({ method: 'DELETE', url, params });
  }
}

// Example usage and documentation:
/**
 * ApiClient centralizes API logic:
 * - Auth header injection
 * - Consistent error handling
 * - Automatic retries (exponential backoff)
 * - Rate limiting/throttling
 * - Caching (in-memory)
 * - Monitoring (timing, payload size)
 * - CORS error detection
 *
 * Usage:
 * const api = new ApiClient({ baseURL: '/api', getAuthToken: () => localStorage.getItem('token') });
 * api.get('/customers', { status: 'active' })
 */
