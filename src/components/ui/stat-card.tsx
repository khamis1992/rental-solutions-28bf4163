import React from 'react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  highlight?: boolean;
  className?: string;
}

export const StatCard = React.memo(function StatCard({ title, value, subtitle, icon, isLoading = false, highlight = false, className }: StatCardProps) {
  return (
    <Card className={`p-5 dashboard-card ${highlight ? 'border-red-200 bg-red-50' : ''} ${className || ''}`}>
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
        </div>
        <div>
          {icon}
        </div>
      </div>
    </Card>
  );
});
