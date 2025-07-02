import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Zap } from 'lucide-react';

interface PerformanceChartProps {
  metricName: string;
  title?: string;
  className?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  metricName,
  title,
  className
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-4 h-4" />
            {title || metricName}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <Activity className="w-3 h-3 mr-1" />
              Stable
            </Badge>
            
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
      </CardHeader>

      <CardContent>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Performance Chart - Data visualization coming soon</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;