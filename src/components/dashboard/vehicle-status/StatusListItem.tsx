
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusConfig } from './types';

interface StatusListItemProps {
  status: StatusConfig;
  count: number;
  totalVehicles: number;
}

export const StatusListItem = ({ status, count, totalVehicles }: StatusListItemProps) => {
  const navigate = useNavigate();
  const percentage = totalVehicles > 0 ? Math.round((count / totalVehicles) * 100) : 0;
  
  const handleClick = () => {
    navigate(`/vehicles?status=${status.filterValue}`);
  };
  
  const Icon = status.icon;
  
  return (
    <div 
      className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer" 
      onClick={handleClick}
    >
      <div className="mr-3">
        <Icon size={24} style={{ color: status.color }} />
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <span className="font-medium">{status.name}</span>
          <span className="text-sm text-gray-600">{count}</span>
        </div>
        <div className="text-xs text-gray-500">{status.description}</div>
        <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full">
          <div 
            className="h-full rounded-full" 
            style={{ 
              width: `${percentage}%`,
              backgroundColor: status.color
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default StatusListItem;
