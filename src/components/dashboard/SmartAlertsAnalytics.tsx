
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export const SmartAlertsAnalytics: React.FC = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          تحليلات التنبيهات الذكية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600">
            سيتم تطوير تحليلات التنبيهات الذكية قريباً.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
