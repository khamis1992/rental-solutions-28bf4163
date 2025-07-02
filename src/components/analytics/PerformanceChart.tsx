import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';
import { performanceAnalytics, PerformanceMetric } from '@/services/performance-analytics';

interface PerformanceChartProps {
  metricName: string;
  title?: string;
  chartType?: 'line' | 'area' | 'bar' | 'pie';
  timeRange?: number; // in milliseconds
  height?: number;
  showTrend?: boolean;
  showAverage?: boolean;
  className?: string;
}

interface ChartDataPoint {
  timestamp: number;
  value: number;
  formattedTime: string;
  formattedValue: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  metricName,
  title,
  chartType = 'line',
  timeRange = 30 * 60 * 1000, // 30 minutes default
  height = 300,
  showTrend = true,
  showAverage = true,
  className
}) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadChartData();
    
    if (autoRefresh) {
      const interval = setInterval(loadChartData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [metricName, timeRange, autoRefresh]);

  const loadChartData = () => {
    try {
      setIsLoading(true);
      const metrics = performanceAnalytics.getMetrics('performance', timeRange);
      const filteredMetrics = metrics.filter(m => m.name === metricName);
      
      const chartData = filteredMetrics
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(metric => ({
          timestamp: metric.timestamp,
          value: metric.value,
          formattedTime: formatTime(metric.timestamp),
          formattedValue: formatValue(metric.value, metric.unit)
        }));

      setData(chartData);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(isArabic ? 'ar' : 'en', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatValue = (value: number, unit: string): string => {
    if (unit === 'ms') {
      return value < 1000 ? `${Math.round(value)}ms` : `${(value / 1000).toFixed(1)}s`;
    }
    if (unit === 'bytes') {
      if (value < 1024) return `${Math.round(value)}B`;
      if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`;
      return `${(value / (1024 * 1024)).toFixed(1)}MB`;
    }
    if (unit === 'count') {
      return Math.round(value).toString();
    }
    return `${value.toFixed(2)}${unit}`;
  };

  const statistics = useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map(d => d.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate trend
    const recentValues = values.slice(-5);
    const olderValues = values.slice(-10, -5);
    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg * 1.1) trend = 'up';
    else if (recentAvg < olderAvg * 0.9) trend = 'down';

    return { average, min, max, trend };
  }, [data]);

  const chartColors = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    gradient: ['#3b82f6', '#1d4ed8']
  };

  const getChartColor = () => {
    if (!statistics) return chartColors.primary;
    
    if (metricName.includes('Error') || metricName.includes('Failed')) {
      return chartColors.danger;
    }
    if (metricName.includes('Success') || metricName.includes('Complete')) {
      return chartColors.success;
    }
    if (metricName.includes('Warning') || metricName.includes('Slow')) {
      return chartColors.warning;
    }
    return chartColors.primary;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`${isArabic ? 'الوقت:' : 'Time:'} ${label}`}</p>
          <p className="text-sm text-blue-600">
            {`${isArabic ? 'القيمة:' : 'Value:'} ${payload[0].payload.formattedValue}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{isArabic ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              interval={isMobile ? 'preserveStartEnd' : 0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getChartColor()} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={getChartColor()} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={getChartColor()}
              fillOpacity={1}
              fill="url(#colorGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              interval={isMobile ? 'preserveStartEnd' : 0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={getChartColor()} radius={[2, 2, 0, 0]} />
          </BarChart>
        );

      case 'pie':
        const pieData = data.slice(-6).map((item, index) => ({
          name: item.formattedTime,
          value: item.value,
          fill: `hsl(${210 + index * 30}, 70%, ${50 + index * 5}%)`
        }));

        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, value }) => `${name}: ${formatValue(value, 'ms')}`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="formattedTime" 
              tick={{ fontSize: 12 }}
              interval={isMobile ? 'preserveStartEnd' : 0}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getChartColor()}
              strokeWidth={2}
              dot={{ fill: getChartColor(), strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: getChartColor(), strokeWidth: 2 }}
            />
            {showAverage && statistics && (
              <Line
                type="monotone"
                dataKey={() => statistics.average}
                stroke="#94a3b8"
                strokeDasharray="5 5"
                dot={false}
                strokeWidth={1}
              />
            )}
          </LineChart>
        );
    }
  };

  const getChartIcon = () => {
    switch (chartType) {
      case 'area':
      case 'line':
        return <LineChartIcon className="w-4 h-4" />;
      case 'bar':
        return <BarChart3 className="w-4 h-4" />;
      case 'pie':
        return <PieChartIcon className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <CardTitle className={`flex items-center gap-2 text-lg ${isArabic ? 'flex-row-reverse' : ''}`}>
            {getChartIcon()}
            {title || metricName}
          </CardTitle>
          
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {showTrend && statistics && (
              <Badge variant={
                statistics.trend === 'up' ? 'destructive' :
                statistics.trend === 'down' ? 'default' : 'secondary'
              }>
                {statistics.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                {statistics.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                {statistics.trend === 'stable' && <Activity className="w-3 h-3 mr-1" />}
                {isArabic ? 
                  (statistics.trend === 'up' ? 'ارتفاع' : statistics.trend === 'down' ? 'انخفاض' : 'مستقر') :
                  statistics.trend
                }
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="touch-friendly"
            >
              <Zap className={`w-3 h-3 ${autoRefresh ? 'text-green-500' : 'text-gray-400'}`} />
            </Button>
          </div>
        </div>

        {statistics && (
          <div className={`flex items-center gap-4 text-sm text-gray-600 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span>
              {isArabic ? 'متوسط:' : 'Avg:'} {formatValue(statistics.average, 'ms')}
            </span>
            <span>
              {isArabic ? 'أدنى:' : 'Min:'} {formatValue(statistics.min, 'ms')}
            </span>
            <span>
              {isArabic ? 'أعلى:' : 'Max:'} {formatValue(statistics.max, 'ms')}
            </span>
            <span>
              {isArabic ? 'نقاط البيانات:' : 'Data Points:'} {data.length}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div style={{ height }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-sm text-gray-500">
                  {isArabic ? 'جاري التحميل...' : 'Loading...'}
                </span>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart; 