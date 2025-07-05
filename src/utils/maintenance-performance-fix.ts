/**
 * Performance optimization utilities for Maintenance components
 * Prevents infinite refresh issues
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

// Utility to detect infinite re-renders
export const useRenderTracker = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;

    if (timeSinceLastRender < 100 && renderCount.current > 5) {
      console.warn(`🚨 ${componentName}: Potential infinite render detected!`, {
        renderCount: renderCount.current,
        timeSinceLastRender
      });
    }

    lastRenderTime.current = now;
  });

  return renderCount.current;
};

// Stable maintenance record comparison
export const compareMaintenanceRecords = (prevRecords: any[], nextRecords: any[]) => {
  if (prevRecords.length !== nextRecords.length) return false;
  
  return prevRecords.every((record, index) => {
    const nextRecord = nextRecords[index];
    return (
      record.id === nextRecord?.id &&
      record.status === nextRecord?.status &&
      record.scheduled_date === nextRecord?.scheduled_date
    );
  });
};

// Memoized maintenance handlers
export const useStableMaintenanceHandlers = (
  onEdit?: (record: any) => void,
  onDelete?: (id: string) => void
) => {
  const stableOnEdit = useCallback((record: any) => {
    onEdit?.(record);
  }, [onEdit]);

  const stableOnDelete = useCallback((id: string) => {
    onDelete?.(id);
  }, [onDelete]);

  return useMemo(() => ({
    onEdit: stableOnEdit,
    onDelete: stableOnDelete
  }), [stableOnEdit, stableOnDelete]);
};

// Debounced state updater for maintenance records
export const useDebouncedMaintenanceUpdate = (callback: () => void, delay: number = 300) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);
}; 