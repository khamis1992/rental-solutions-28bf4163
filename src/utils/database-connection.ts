/**
 * Database Connection Monitoring Utilities
 * 
 * This module provides tools for monitoring and maintaining database connections
 * including health checks, reconnection strategies, and connection pooling.
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { handleConnectionError } from '@/utils/error-handler';

// Connection status type
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'degraded';

// Connection state tracking
let connectionState: {
  status: ConnectionStatus;
  lastChecked: number;
  failedAttempts: number;
  isMonitoring: boolean;
  intervalId?: number;
} = {
  status: 'connecting',
  lastChecked: 0,
  failedAttempts: 0,
  isMonitoring: false,
};

// Configuration
const CONFIG = {
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  MAX_FAILED_ATTEMPTS: 3,
  RECONNECT_DELAY: 5000, // 5 seconds
  CACHE_TTL: 10000, // 10 seconds - how long to cache health check results
};

/**
 * Performs a lightweight database health check
 * @returns Promise resolving to a boolean indicating connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // If we have a recent health check, use cached result
    if (Date.now() - connectionState.lastChecked < CONFIG.CACHE_TTL) {
      return connectionState.status === 'connected';
    }

    // Perform a lightweight query to test the connection
    const { error } = await supabase.from('vehicles').select('count', { count: 'exact', head: true });
    
    // Update connection state
    connectionState.lastChecked = Date.now();
    
    if (error) {
      connectionState.failedAttempts++;
      connectionState.status = connectionState.failedAttempts >= CONFIG.MAX_FAILED_ATTEMPTS 
        ? 'disconnected' 
        : 'degraded';
      
      console.warn(`Database connection issue (attempt ${connectionState.failedAttempts}):`, error.message);
      return false;
    }
    
    // Reset on successful connection
    connectionState.failedAttempts = 0;
    connectionState.status = 'connected';
    return true;
  } catch (error) {
    // Unexpected errors
    connectionState.failedAttempts++;
    connectionState.status = 'disconnected';
    connectionState.lastChecked = Date.now();
    
    handleConnectionError(error);
    return false;
  }
}

/**
 * Starts continuous monitoring of database connection
 * @param onStatusChange Optional callback when connection status changes
 * @returns Function to stop monitoring
 */
export function startConnectionMonitoring(
  onStatusChange?: (status: ConnectionStatus) => void
): () => void {
  // Prevent multiple monitors
  if (connectionState.isMonitoring) {
    return stopConnectionMonitoring;
  }
  
  // Initial check
  checkDatabaseHealth().then(isHealthy => {
    if (onStatusChange) {
      onStatusChange(isHealthy ? 'connected' : 'degraded');
    }
  });
  
  // Set up interval
  connectionState.isMonitoring = true;
  connectionState.intervalId = window.setInterval(async () => {
    const prevStatus = connectionState.status;
    const isHealthy = await checkDatabaseHealth();
    
    // Notify on status change
    if (connectionState.status !== prevStatus && onStatusChange) {
      onStatusChange(connectionState.status);
      
      // Show toast on disconnection
      if (connectionState.status === 'disconnected') {
        toast.error('Database connection lost', {
          description: 'Attempting to reconnect...',
        });
      }
      
      // Show toast on reconnection
      if (prevStatus === 'disconnected' && connectionState.status === 'connected') {
        toast.success('Database connection restored', {
          description: 'Your connection is working again',
        });
      }
    }
  }, CONFIG.HEALTH_CHECK_INTERVAL);
  
  return stopConnectionMonitoring;
}

/**
 * Stops the connection monitoring
 */
export function stopConnectionMonitoring(): void {
  if (connectionState.intervalId) {
    window.clearInterval(connectionState.intervalId);
    connectionState.isMonitoring = false;
    connectionState.intervalId = undefined;
  }
}

/**
 * Gets the current connection status
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionState.status;
}

/**
 * Attempts to immediately reconnect to the database
 * @returns Promise that resolves to a boolean indicating success
 */
export async function attemptReconnection(): Promise<boolean> {
  connectionState.status = 'connecting';
  const isHealthy = await checkDatabaseHealth();
  return isHealthy;
}
