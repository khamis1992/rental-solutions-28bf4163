
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  sparkline?: Array<number>;
  showSparkline?: boolean;
  loading?: boolean;
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
  onClick,
  sparkline,
  showSparkline,
  loading = false,
}: StatCardProps) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md", 
        onClick ? "hover:bg-accent/10 cursor-pointer" : "", 
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="text-2xl font-bold mt-2 tracking-tight truncate animate-fade-in">
                {value}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground mt-1 truncate">{description}</p>
              )}
              
              {trend !== undefined && (
                <div className="flex items-center mt-2 animate-slide-in">
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
                    trend > 0 ? "bg-green-100 text-green-700" : 
                    trend < 0 ? "bg-red-100 text-red-700" : 
                    "bg-gray-100 text-gray-700"
                  )}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </span>
                  {trendLabel && <span className="text-xs text-muted-foreground ml-2">{trendLabel}</span>}
                </div>
              )}

              {showSparkline && sparkline && sparkline.length > 0 && (
                <div className="mt-3 h-8">
                  <SparklineChart data={sparkline} />
                </div>
              )}
            </div>
            
            {Icon && (
              <div className={cn(
                "p-3 rounded-full shrink-0 ml-3 transition-transform duration-300 hover:scale-110",
                "bg-primary/10",
                iconColor
              )}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Simple sparkline chart component
const SparklineChart = ({ data }: { data: number[] }) => {
  // Normalize data for display
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  // Calculate points for the SVG path
  const width = 100;
  const height = 20;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range * height);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path
        d={`M0,${height} L${points} L${width},${height}`}
        fill="rgba(59, 130, 246, 0.1)"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="rgba(59, 130, 246, 0.8)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export { StatCard };
