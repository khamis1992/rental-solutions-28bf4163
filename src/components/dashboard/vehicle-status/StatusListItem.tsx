
import React from 'react';
import { cn } from '@/lib/utils';
import { StatusConfig } from './types';
import { LucideIcon } from 'lucide-react';

interface StatusListItemProps {
  status: StatusConfig;
  count: number;
  onClick: () => void;
}

export const StatusListItem: React.FC<StatusListItemProps> = ({
  status,
  count,
  onClick
}) => {
  const Icon = status.icon as LucideIcon;
  
  return (
    <div 
      key={status.key} 
      className={cn(
        "flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-slate-100",
        status.key === 'stolen' || status.key === 'accident' || status.key === 'critical' 
          ? "bg-red-50 hover:bg-red-100" 
          : "bg-slate-50 hover:bg-slate-100"
      )}
      onClick={onClick}
    >
      <div 
        className="p-1.5 rounded-md" 
        style={{ backgroundColor: `${status.color}20` }}
      >
        <Icon 
          className="text-primary"
          size={16} 
          color={status.color}
        />
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{status.name}</span>
          <span className="text-sm font-semibold">{count}</span>
        </div>
        <p className="text-xs text-muted-foreground">{status.description}</p>
      </div>
    </div>
  );
};
