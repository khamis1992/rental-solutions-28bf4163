
/**
 * Error Notification Manager
 * Manages displaying error notifications to prevent notification fatigue
 */

import { toast } from 'sonner';

interface NotificationOptions {
  duration?: number;
  description?: string;
  id?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

interface NotificationState {
  active: Map<string, {
    count: number;
    timestamp: number;
    timeoutId?: NodeJS.Timeout;
  }>;
  suppressed: Set<string>;
  cooldowns: Map<string, number>;
}

// State management for notifications across the app
const state: NotificationState = {
  active: new Map(), // Currently displayed notifications by ID
  suppressed: new Set(), // Notifications that are currently suppressed
  cooldowns: new Map(), // Cooldown periods for specific notification types
};

const DEFAULT_COOLDOWN = 30000; // 30 seconds between duplicate notifications
const SUPPRESS_THRESHOLD = 3; // Number of times a notification can appear before suppressing
const SUPPRESS_DURATION = 5 * 60 * 1000; // 5 minutes suppression

/**
 * Shows an error notification with duplicate prevention
 * @param title Error title
 * @param options Notification options
 * @returns The notification ID if shown, null if suppressed
 */
export function showErrorNotification(title: string, options: NotificationOptions = {}): string | null {
  const id = options.id || `error-${title}`;
  
  // Check if notification is suppressed
  if (state.suppressed.has(id)) {
    console.log(`Notification suppressed (ID: ${id})`);
    return null;
  }
  
  // Check cooldown period
  const lastShown = state.cooldowns.get(id) || 0;
  const now = Date.now();
  if (now - lastShown < DEFAULT_COOLDOWN) {
    // Update existing notification instead if it's active
    const existing = state.active.get(id);
    if (existing) {
      // Increment occurrence count for existing notification
      existing.count++;
      
      // Update the toast if frequency becomes an issue
      if (existing.count >= SUPPRESS_THRESHOLD) {
        toast.error(title, {
          id,
          description: `${options.description} (Occurred ${existing.count} times. Further notifications will be suppressed for 5 minutes)`,
          duration: options.duration,
        });
        
        // Suppress after threshold
        suppressNotification(id);
      }
      
      return id;
    }
    
    return null;
  }
  
  // Show the notification
  toast.error(title, {
    id,
    description: options.description,
    duration: options.duration,
    action: options.action,
  });
  
  // Track the active notification
  state.active.set(id, {
    count: 1,
    timestamp: now,
    timeoutId: setTimeout(() => {
      state.active.delete(id);
    }, options.duration || 5000)
  });
  
  // Update cooldown timestamp
  state.cooldowns.set(id, now);
  
  return id;
}

/**
 * Suppress a notification for a period of time
 * @param id Notification ID to suppress
 * @param duration Duration in ms (default: 5 minutes)
 */
export function suppressNotification(id: string, duration: number = SUPPRESS_DURATION): void {
  state.suppressed.add(id);
  
  // Clear any existing timeout
  const existing = state.active.get(id);
  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId);
  }
  
  // Remove from active notifications
  state.active.delete(id);
  
  // Set timeout to remove from suppressed list
  setTimeout(() => {
    state.suppressed.delete(id);
  }, duration);
}

/**
 * Clear a notification by ID
 * @param id Notification ID to clear
 */
export function clearNotification(id: string): void {
  toast.dismiss(id);
  
  const existing = state.active.get(id);
  if (existing?.timeoutId) {
    clearTimeout(existing.timeoutId);
  }
  
  state.active.delete(id);
}

/**
 * Clear all active notifications
 */
export function clearAllNotifications(): void {
  toast.dismiss();
  
  // Clear all timeouts
  state.active.forEach((notification) => {
    if (notification.timeoutId) {
      clearTimeout(notification.timeoutId);
    }
  });
  
  state.active.clear();
}
