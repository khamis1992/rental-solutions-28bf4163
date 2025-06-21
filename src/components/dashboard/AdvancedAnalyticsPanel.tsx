
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Car, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

export const AdvancedAnalyticsPanel = () => {
  // Mock data - replace with actual data from your hooks/API
  const analyticsData = [
    {
      title: "معدل الاستخدام",
      value: "87%",
      change: "+5.2%",
      trend: "up",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "العملاء النشطون",
      value: "142",
      change: "+12",
      trend: "up", 
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "المركبات المتاحة",
      value: "23",
      change: "-3",
      trend: "down",
      icon: Car,
      color: "text-orange-600"
    },
    {
      title: "الإيرادات الشهرية",
      value: "QAR 45,230",
      change: "+8.1%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "التنبيهات النشطة",
      value: "7",
      change: "+2",
      trend: "up",
      icon: AlertTriangle,
      color: "text-red-600"
    },
    {
      title: "المهام المكتملة",
      value: "95%",
      change: "+3%",
      trend: "up",
      icon: CheckCircle,
      color: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {analyticsData.map((metric, index) => (
        <Card key={index} className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-right">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-right">
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center justify-end mt-1">
                <Badge 
                  variant={metric.trend === 'up' ? 'success' : 'secondary'}
                  className="text-xs"
                >
                  {metric.change}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
