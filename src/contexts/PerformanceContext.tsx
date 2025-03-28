
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { startMeasure, getMetrics, clearMetrics, PerformanceMetric } from '@/utils/performance-monitoring';

interface PerformanceContextType {
  metrics: PerformanceMetric[];
  clearMetrics: () => void;
  isCollecting: boolean;
  startCollection: () => void;
  stopCollection: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const location = useLocation();

  // Update metrics periodically when collection is active
  useEffect(() => {
    if (!isCollecting) return;
    
    const intervalId = setInterval(() => {
      setMetrics(getMetrics());
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, [isCollecting]);

  // Measure route changes
  useEffect(() => {
    const endMeasure = startMeasure(`route:${location.pathname}`, { 
      path: location.pathname,
      search: location.search,
    });
    
    return () => {
      endMeasure();
    };
  }, [location.pathname, location.search]);

  const startCollection = () => {
    setIsCollecting(true);
  };

  const stopCollection = () => {
    setIsCollecting(false);
  };

  const handleClearMetrics = () => {
    clearMetrics();
    setMetrics([]);
  };

  return (
    <PerformanceContext.Provider
      value={{
        metrics,
        clearMetrics: handleClearMetrics,
        isCollecting,
        startCollection,
        stopCollection
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformanceContext = () => {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
};
