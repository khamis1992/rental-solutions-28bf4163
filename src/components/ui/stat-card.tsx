
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  trendLabel,
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden card-transition", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2 tracking-tight truncate">{value}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1 truncate">{description}</p>}
            
            {trend !== undefined && (
              <div className="flex items-center mt-2">
                <span className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  trend > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
                {trendLabel && <span className="text-xs text-muted-foreground ml-2">{trendLabel}</span>}
              </div>
            )}
          </div>
          
          {Icon && (
            <div className={cn(
              "p-3 rounded-full shrink-0 ml-3",
              "bg-primary/10",
              iconColor
            )}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { StatCard };
