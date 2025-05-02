
import React from 'react';
import { StatusConfig } from './types';
import { LucideIcon } from 'lucide-react';

interface StatusListItemProps {
  status: StatusConfig;
  count: number;
  totalVehicles?: number;
  onClick?: () => void;
}

export const StatusListItem = ({ status, count, totalVehicles = 0, onClick }: StatusListItemProps) => {
  const percentage = totalVehicles > 0 ? Math.round((count / totalVehicles) * 100) : 0;
  
  const handleClick = () => {
    if (onClick) onClick();
  };
  
  const Icon = status.icon as LucideIcon;
  
  return (
    <div 
      className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer" 
      onClick={handleClick}
    >
      <div className="mr-3">
        <Icon className="h-6 w-6" style={{ color: status.color }} />
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <span className="font-medium">{status.name}</span>
          <span className="text-sm text-gray-600">{count}</span>
        </div>
        <div className="text-xs text-gray-500">{status.description}</div>
        {totalVehicles > 0 && (
          <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${percentage}%`,
                backgroundColor: status.color
              }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusListItem;
