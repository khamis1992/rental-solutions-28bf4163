
/**
 * Simple NetworkStatusIndicator Component
 * 
 * Displays the current database connection status with a visual indicator
 */
import { useState } from 'react';
import { Wifi } from 'lucide-react';

// Simplified version for testing
export function NetworkStatusIndicator() {
  const [isConnected] = useState(true);

  return (
    <div className="flex items-center gap-1.5">
      <span className={isConnected ? "text-green-500" : "text-red-500"}>
        <Wifi className="h-4 w-4" />
      </span>
    </div>
  );
}
