
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface DataCardProps {
  title: string;
  value: string | number | React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
  className?: string;
  valueClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
}

export function DataCard({
  title,
  value,
  description,
  icon,
  trend,
  isLoading = false,
  className,
  valueClassName,
  iconClassName,
  onClick,
}: DataCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden",
        onClick && "transition-all hover:shadow-md cursor-pointer",
        className
      )} 
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className={cn("text-muted-foreground", iconClassName)}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading data...</p>
          </div>
        ) : (
          <>
            <div className={cn("text-2xl font-bold", valueClassName)}>
              {value}
            </div>
            {(description || trend) && (
              <div className="flex items-center justify-between">
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
                {trend && (
                  <p className={cn(
                    "text-xs",
                    trend.isPositive ? "text-green-500" : "text-red-500"
                  )}>
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function DataCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-5 w-24 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-6 w-6 bg-gray-200 animate-pulse rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
        <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
      </CardContent>
    </Card>
  );
}

