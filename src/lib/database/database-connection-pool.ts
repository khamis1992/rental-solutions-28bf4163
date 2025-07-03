/**
 * نظام Connection Pooling محسن لقاعدة البيانات
 * Enhanced Database Connection Pooling System
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// إعدادات Connection Pool
interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
}

// حالة الاتصال
interface ConnectionStatus {
  id: string;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  queryCount: number;
  errorCount: number;
}

// إحصائيات Pool
interface PoolStatistics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  queuedRequests: number;
  totalQueries: number;
  totalErrors: number;
  averageResponseTime: number;
  hitRate: number;
}

export class DatabaseConnectionPool {
  private config: ConnectionPoolConfig;
  private connections: Map<string, SupabaseClient> = new Map();
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private requestQueue: Array<{
    resolve: (client: SupabaseClient) => void;
    reject: (error: Error) => void;
    timestamp: Date;
  }> = [];
  
  private statistics: PoolStatistics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    queuedRequests: 0,
    totalQueries: 0,
    totalErrors: 0,
    averageResponseTime: 0,
    hitRate: 0
  };

  private healthCheckInterval?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config?: Partial<ConnectionPoolConfig>) {
    this.config = {
      minConnections: 3,
      maxConnections: 15,
      idleTimeoutMs: 300000, // 5 minutes
      connectionTimeoutMs: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelayMs: 1000,
      healthCheckIntervalMs: 60000, // 1 minute
      ...config
    };
  }

  /**
   * تهيئة Pool الاتصالات
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // إنشاء الحد الأدنى من الاتصالات
      for (let i = 0; i < this.config.minConnections; i++) {
        await this.createConnection();
      }

      // بدء فحص الصحة الدوري
      this.startHealthCheck();
      
      this.isInitialized = true;
      console.log(`✅ Database connection pool initialized with ${this.connections.size} connections`);
    } catch (error) {
      console.error('❌ Failed to initialize connection pool:', error);
      throw error;
    }
  }

  /**
   * إنشاء اتصال جديد
   */
  private async createConnection(): Promise<SupabaseClient> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found');
    }

    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-connection-id': connectionId
        }
      }
    });

    // تسجيل الاتصال
    this.connections.set(connectionId, client);
    this.connectionStatus.set(connectionId, {
      id: connectionId,
      isActive: false,
      lastUsed: new Date(),
      createdAt: new Date(),
      queryCount: 0,
      errorCount: 0
    });

    this.updateStatistics();
    return client;
  }

  /**
   * الحصول على اتصال من Pool
   */
  async getConnection(): Promise<SupabaseClient> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeoutMs);

      // البحث عن اتصال خامل
      const availableConnection = this.findAvailableConnection();
      
      if (availableConnection) {
        clearTimeout(timeout);
        this.markConnectionAsActive(availableConnection);
        resolve(this.connections.get(availableConnection)!);
        return;
      }

      // إنشاء اتصال جديد إذا لم نصل للحد الأقصى
      if (this.connections.size < this.config.maxConnections) {
        this.createConnection()
          .then(client => {
            clearTimeout(timeout);
            resolve(client);
          })
          .catch(error => {
            clearTimeout(timeout);
            reject(error);
          });
        return;
      }

      // إضافة إلى queue
      this.requestQueue.push({
        resolve: (client) => {
          clearTimeout(timeout);
          resolve(client);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: new Date()
      });

      this.statistics.queuedRequests = this.requestQueue.length;
    });
  }

  /**
   * إرجاع اتصال إلى Pool
   */
  releaseConnection(client: SupabaseClient): void {
    const connectionId = this.findConnectionId(client);
    
    if (connectionId) {
      this.markConnectionAsIdle(connectionId);
      
      // معالجة queue
      if (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift()!;
        this.markConnectionAsActive(connectionId);
        request.resolve(client);
        this.statistics.queuedRequests = this.requestQueue.length;
      }
    }
  }

  /**
   * تنفيذ استعلام مع إدارة تلقائية للاتصال
   */
  async executeQuery<T>(
    queryFn: (client: SupabaseClient) => Promise<T>,
    retries: number = this.config.retryAttempts
  ): Promise<T> {
    const startTime = Date.now();
    let connection: SupabaseClient | null = null;
    
    try {
      connection = await this.getConnection();
      this.statistics.totalQueries++;
      
      const result = await queryFn(connection);
      
      // تحديث إحصائيات الأداء
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);
      
      return result;
    } catch (error) {
      this.statistics.totalErrors++;
      
      if (retries > 0) {
        console.warn(`Query failed, retrying... (${retries} attempts left)`, error);
        await this.delay(this.config.retryDelayMs);
        return this.executeQuery(queryFn, retries - 1);
      }
      
      throw error;
    } finally {
      if (connection) {
        this.releaseConnection(connection);
      }
    }
  }

  /**
   * البحث عن اتصال متاح
   */
  private findAvailableConnection(): string | null {
    for (const [id, status] of this.connectionStatus.entries()) {
      if (!status.isActive) {
        return id;
      }
    }
    return null;
  }

  /**
   * البحث عن معرف الاتصال
   */
  private findConnectionId(client: SupabaseClient): string | null {
    for (const [id, conn] of this.connections.entries()) {
      if (conn === client) {
        return id;
      }
    }
    return null;
  }

  /**
   * تحديد الاتصال كنشط
   */
  private markConnectionAsActive(connectionId: string): void {
    const status = this.connectionStatus.get(connectionId);
    if (status) {
      status.isActive = true;
      status.lastUsed = new Date();
      status.queryCount++;
    }
    this.updateStatistics();
  }

  /**
   * تحديد الاتصال كخامل
   */
  private markConnectionAsIdle(connectionId: string): void {
    const status = this.connectionStatus.get(connectionId);
    if (status) {
      status.isActive = false;
      status.lastUsed = new Date();
    }
    this.updateStatistics();
  }

  /**
   * بدء فحص الصحة الدوري
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * فحص صحة الاتصالات
   */
  private async performHealthCheck(): Promise<void> {
    const now = new Date();
    const expiredConnections: string[] = [];

    // البحث عن الاتصالات المنتهية الصلاحية
    for (const [id, status] of this.connectionStatus.entries()) {
      if (!status.isActive && 
          now.getTime() - status.lastUsed.getTime() > this.config.idleTimeoutMs) {
        expiredConnections.push(id);
      }
    }

    // إزالة الاتصالات المنتهية الصلاحية
    for (const id of expiredConnections) {
      if (this.connections.size > this.config.minConnections) {
        this.connections.delete(id);
        this.connectionStatus.delete(id);
      }
    }

    // التأكد من الحد الأدنى للاتصالات
    while (this.connections.size < this.config.minConnections) {
      try {
        await this.createConnection();
      } catch (error) {
        console.error('Failed to create minimum connection:', error);
        break;
      }
    }

    this.updateStatistics();
  }

  /**
   * تحديث الإحصائيات
   */
  private updateStatistics(): void {
    this.statistics.totalConnections = this.connections.size;
    this.statistics.activeConnections = Array.from(this.connectionStatus.values())
      .filter(status => status.isActive).length;
    this.statistics.idleConnections = this.statistics.totalConnections - this.statistics.activeConnections;
    
    // حساب hit rate
    const totalRequests = this.statistics.totalQueries + this.statistics.totalErrors;
    this.statistics.hitRate = totalRequests > 0 ? 
      ((totalRequests - this.statistics.totalErrors) / totalRequests) * 100 : 100;
  }

  /**
   * تحديث متوسط وقت الاستجابة
   */
  private updateResponseTime(responseTime: number): void {
    const currentAvg = this.statistics.averageResponseTime;
    const totalQueries = this.statistics.totalQueries;
    
    this.statistics.averageResponseTime = 
      ((currentAvg * (totalQueries - 1)) + responseTime) / totalQueries;
  }

  /**
   * تأخير لإعادة المحاولة
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * الحصول على إحصائيات Pool
   */
  getStatistics(): PoolStatistics {
    return { ...this.statistics };
  }

  /**
   * مراقبة صحة Pool
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    details: {
      connections: ConnectionStatus[];
      statistics: PoolStatistics;
      queueLength: number;
    };
  }> {
    const isHealthy = 
      this.statistics.activeConnections > 0 &&
      this.statistics.hitRate > 80 &&
      this.requestQueue.length < 10;

    return {
      isHealthy,
      details: {
        connections: Array.from(this.connectionStatus.values()),
        statistics: this.getStatistics(),
        queueLength: this.requestQueue.length
      }
    };
  }

  /**
   * إغلاق Pool
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // رفض جميع الطلبات المعلقة
    for (const request of this.requestQueue) {
      request.reject(new Error('Connection pool is closing'));
    }
    this.requestQueue.length = 0;

    // إغلاق جميع الاتصالات
    this.connections.clear();
    this.connectionStatus.clear();
    
    this.isInitialized = false;
    console.log('Database connection pool closed');
  }
}

// Instance واحد مشترك
export const databaseConnectionPool = new DatabaseConnectionPool();

// Hook للاستخدام في React
export const useDatabasePool = () => {
  const executeQuery = async <T>(
    queryFn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> => {
    return databaseConnectionPool.executeQuery(queryFn);
  };

  const getStatistics = () => databaseConnectionPool.getStatistics();
  const getHealthStatus = () => databaseConnectionPool.getHealthStatus();

  return {
    executeQuery,
    getStatistics,
    getHealthStatus
  };
}; 