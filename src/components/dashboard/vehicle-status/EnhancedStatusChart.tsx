import React, { useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface EnhancedStatusChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    key: string;
    filterValue: string;
    percentage: number;
  }>;
  chartType: 'donut' | 'pie' | 'bar';
  onSegmentClick: (data: any) => void;
  showAnimations?: boolean;
}

export const EnhancedStatusChart: React.FC<EnhancedStatusChartProps> = ({
  data,
  chartType,
  onSegmentClick,
  showAnimations = true
}) => {
  const { language } = useLanguage();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-xl p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-foreground">{data.name}</span>
          </div>
          <div className="space-y-1 text-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">العدد:</span>
              <span className="font-medium">{data.value} مركبة</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">النسبة:</span>
              <span className="font-medium">{data.percentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    if (percent < 0.05) return null; // Hide labels for small segments
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold drop-shadow-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[4, 4, 0, 0]}
            cursor="pointer"
            onClick={onSegmentClick}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <defs>
            {data.map((entry, index) => (
              <filter key={`glow-${index}`} id={`glow-${index}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showAnimations ? CustomLabel : false}
            innerRadius={chartType === 'donut' ? 90 : 0}
            outerRadius={140}
            paddingAngle={2}
            dataKey="value"
            onClick={onSegmentClick}
            cursor="pointer"
            animationDuration={showAnimations ? 1000 : 0}
            animationBegin={0}
            onMouseEnter={(_, index) => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke={hoveredIndex === index ? entry.color : "hsl(var(--background))"}
                strokeWidth={hoveredIndex === index ? 3 : 2}
                filter={hoveredIndex === index ? `url(#glow-${index})` : undefined}
                style={{
                  transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                  transformOrigin: 'center',
                  transition: 'all 0.2s ease-in-out'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center information for donut chart */}
      {chartType === 'donut' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="text-2xl font-bold text-foreground">
              {data.reduce((sum, item) => sum + item.value, 0)}
            </div>
            <div className="text-sm text-muted-foreground">إجمالي المركبات</div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.length} فئة نشطة
            </div>
          </div>
        </div>
      )}
    </div>
  );
};