
import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: number;
  trendLabel?: string;
  className?: string;
  onClick?: () => void;
}

const StatCardComponent = ({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
  trendLabel,
  className,
  onClick,
}: StatCardProps) => {
  const { isRTL } = useTranslation();
  
  // Memoize the trend display
  const trendDisplay = React.useMemo(() => {
    if (trend === undefined) return null;
    
    const trendClass = cn(
      "text-xs font-medium px-2 py-0.5 rounded-full",
      trend > 0 ? "bg-green-100 text-green-700" : 
      trend < 0 ? "bg-red-100 text-red-700" : 
      "bg-gray-100 text-gray-700"
    );
    
    return (
      <div className="flex items-center mt-2">
        <span className={trendClass}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        {trendLabel && <span className={`text-xs text-muted-foreground ${isRTL ? 'mr-2' : 'ml-2'}`}>{trendLabel}</span>}
      </div>
    );
  }, [trend, trendLabel, isRTL]);
  
  // Memoize the icon display
  const iconDisplay = React.useMemo(() => {
    if (!Icon) return null;
    
    return (
      <div className={cn(
        "p-3 rounded-full shrink-0",
        "bg-primary/10",
        iconColor,
        isRTL ? "mr-3" : "ml-3"
      )}>
        <Icon className="h-5 w-5" />
      </div>
    );
  }, [Icon, iconColor, isRTL]);
  
  return (
    <Card 
      className={cn("overflow-hidden card-transition", 
        onClick ? "hover:bg-accent/5" : "", 
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2 tracking-tight truncate">{value}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1 truncate">{description}</p>}
            {trendDisplay}
          </div>
          {iconDisplay}
        </div>
      </CardContent>
    </Card>
  );
};

// Memoize the StatCard for better performance
export const StatCard = memo(StatCardComponent);
