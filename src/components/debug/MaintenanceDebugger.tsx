import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MaintenanceDebuggerProps {
  activeRecords: any[];
  isLoading: boolean;
  renderCount?: number;
}

export const MaintenanceDebugger: React.FC<MaintenanceDebuggerProps> = ({
  activeRecords,
  isLoading,
}) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (timeSinceLastRender < 100) {
      console.warn('⚠️ MaintenanceDebugger: Fast re-render detected!', {
        renderCount: renderCount.current,
        timeSinceLastRender,
        activeRecordsLength: activeRecords.length,
        isLoading
      });
    }
    
    lastRenderTime.current = now;
  });

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-yellow-800">🐛 Maintenance Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-700">Render Count:</span>
          <Badge variant={renderCount.current > 10 ? 'destructive' : 'secondary'}>
            {renderCount.current}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-700">Active Records:</span>
          <Badge variant="outline">{activeRecords.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-yellow-700">Is Loading:</span>
          <Badge variant={isLoading ? 'default' : 'secondary'}>
            {isLoading ? 'Yes' : 'No'}
          </Badge>
        </div>
        {renderCount.current > 5 && (
          <div className="text-xs text-red-600 font-medium">
            ⚠️ High render count detected - check for infinite loops!
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 