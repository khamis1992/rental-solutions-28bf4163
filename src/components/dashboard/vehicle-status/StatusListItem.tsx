
import React from 'react';

interface Status {
  key: string;
  name: string;
  color: string;
  icon?: React.ElementType;
  filterValue: string;
}

interface StatusListItemProps {
  status: Status;
  count: number;
  onClick: () => void;
}

export const StatusListItem: React.FC<StatusListItemProps> = ({ status, count, onClick }) => {
  const { name, color, icon: Icon } = status;
  const isHighlight = ['critical', 'accident', 'stolen', 'attention'].includes(status.key);
  
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-2.5 rounded-md border border-transparent cursor-pointer transition-all hover:shadow-sm ${
        isHighlight 
          ? `bg-red-50 border-red-100 hover:bg-red-100`
          : `hover:bg-gray-100 hover:border-gray-200`
      }`}
    >
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${color}`} />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <span className={`font-bold text-sm px-2 py-0.5 rounded-full ${
        isHighlight 
          ? 'bg-red-100 text-red-700' 
          : status.key === 'available' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-700'
      }`}>
        {count}
      </span>
    </div>
  );
};
