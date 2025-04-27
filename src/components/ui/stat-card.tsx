
import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
  highlight?: boolean;
  className?: string;
  onClick?: () => void;
  trend?: number;
  trendLabel?: string;
}

export const StatCard = React.memo(function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  iconColor,
  isLoading = false, 
  highlight = false, 
  className,
  onClick,
  trend,
  trendLabel
}: StatCardProps) {
  return (
    <Card 
      className={`p-5 dashboard-card ${highlight ? 'border-red-200 bg-red-50' : ''} ${className || ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1"></div>
          ) : (
            <h3 className={`text-2xl font-bold ${highlight ? 'text-red-600' : ''}`}>
              {value}
            </h3>
          )}
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend !== undefined && trendLabel && (
            <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '+' : ''}{trend}% {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${iconColor || 'text-gray-500'}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
});
