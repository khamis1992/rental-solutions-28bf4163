
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Clock, CheckCircle, BarChart3, Activity, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface AlertAnalytics {
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    resolvedToday: number;
    averageResolutionTime: number;
    alertTrend: 'up' | 'down' | 'stable';
  };
  byPriority: Array<{
    priority: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    avgResolutionTime: number;
    impactScore: number;
  }>;
  timeline: Array<{
    date: string;
    created: number;
    resolved: number;
    critical: number;
  }>;
  performance: {
    resolutionRate: number;
    responseTime: number;
    escalationRate: number;
    customerSatisfaction: number;
  };
  trends: Array<{
    metric: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  topAlertTypes: Array<{
    type: string;
    count: number;
    avgImpact: number;
    frequency: number;
  }>;
}

// Mock data - in real implementation, this would come from your backend
const mockAnalytics: AlertAnalytics = {
  summary: {
    totalAlerts: 45,
    criticalAlerts: 8,
    resolvedToday: 12,
    averageResolutionTime: 4.2,
    alertTrend: 'up'
  },
  byPriority: [
    { priority: 'critical', count: 8, percentage: 18, color: '#ef4444' },
    { priority: 'high', count: 15, percentage: 33, color: '#f97316' },
    { priority: 'medium', count: 18, percentage: 40, color: '#eab308' },
    { priority: 'low', count: 4, percentage: 9, color: '#3b82f6' }
  ],
  byCategory: [
    { category: 'financial', count: 20, avgResolutionTime: 3.5, impactScore: 8.5 },
    { category: 'operational', count: 15, avgResolutionTime: 5.2, impactScore: 7.8 },
    { category: 'compliance', count: 7, avgResolutionTime: 2.1, impactScore: 9.2 },
    { category: 'customer', count: 3, avgResolutionTime: 1.8, impactScore: 6.5 }
  ],
  timeline: [
    { date: '2024-01-01', created: 12, resolved: 8, critical: 2 },
    { date: '2024-01-02', created: 15, resolved: 10, critical: 3 },
    { date: '2024-01-03', created: 8, resolved: 12, critical: 1 },
    { date: '2024-01-04', created: 18, resolved: 15, critical: 4 },
    { date: '2024-01-05', created: 22, resolved: 18, critical: 5 },
    { date: '2024-01-06', created: 16, resolved: 20, critical: 2 },
    { date: '2024-01-07', created: 14, resolved: 16, critical: 3 }
  ],
  performance: {
    resolutionRate: 78,
    responseTime: 2.5,
    escalationRate: 15,
    customerSatisfaction: 4.2
  },
  trends: [
    { metric: 'Alert Volume', current: 45, previous: 38, change: 18.4, trend: 'up' },
    { metric: 'Resolution Time', current: 4.2, previous: 5.1, change: -17.6, trend: 'down' },
    { metric: 'Critical Alerts', current: 8, previous: 12, change: -33.3, trend: 'down' },
    { metric: 'Response Rate', current: 92, previous: 87, change: 5.7, trend: 'up' }
  ],
  topAlertTypes: [
    { type: 'overdue_payments', count: 12, avgImpact: 8.5, frequency: 0.85 },
    { type: 'maintenance_backlog', count: 8, avgImpact: 7.2, frequency: 0.65 },
    { type: 'contract_expiry', count: 6, avgImpact: 6.8, frequency: 0.45 },
    { type: 'low_utilization', count: 4, avgImpact: 5.5, frequency: 0.25 }
  ]
};

export const SmartAlertsAnalytics: React.FC<{ className?: string }> = ({ className }) => {
  const analytics = mockAnalytics;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatChange = (change: number) => {
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}%`;
  };

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-2xl font-bold">{analytics.summary.totalAlerts}</p>
                <p className="text-sm text-muted-foreground">إجمالي التنبيهات</p>
              </div>
              <div className="flex items-center space-x-1 space-x-reverse">
                {getTrendIcon(analytics.summary.alertTrend)}
                <AlertTriangle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{analytics.summary.criticalAlerts}</p>
                <p className="text-sm text-muted-foreground">تنبيهات حرجة</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{analytics.summary.resolvedToday}</p>
                <p className="text-sm text-muted-foreground">تم حلها اليوم</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-2xl font-bold">{analytics.summary.averageResolutionTime}h</p>
                <p className="text-sm text-muted-foreground">متوسط وقت الحل</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">توزيع الأولويات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.byPriority}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ priority, percentage }) => `${priority} ${percentage}%`}
                  >
                    {analytics.byPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} تنبيه`, 'العدد']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right">اتجاه التنبيهات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="تم إنشاؤها"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="2"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                    name="تم حلها"
                  />
                  <Line
                    type="monotone"
                    dataKey="critical"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="حرجة"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تحليل حسب الفئة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.byCategory.map(category => (
              <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Badge variant="outline">
                    {category.count} تنبيه
                  </Badge>
                  <div className="text-sm text-gray-600">
                    <div>متوسط وقت الحل: {category.avgResolutionTime}h</div>
                    <div>درجة التأثير: {category.impactScore}/10</div>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="font-medium">
                    {category.category === 'financial' ? 'مالي' :
                     category.category === 'operational' ? 'تشغيلي' :
                     category.category === 'compliance' ? 'امتثال' : 'عملاء'}
                  </h4>
                  <Progress value={category.impactScore * 10} className="w-32 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-right">
              <div className="flex items-center justify-end space-x-2 space-x-reverse mb-2">
                <Target className="h-5 w-5 text-green-500" />
                <h3 className="font-medium">معدل الحل</h3>
              </div>
              <div className="text-2xl font-bold text-green-600">{analytics.performance.resolutionRate}%</div>
              <Progress value={analytics.performance.resolutionRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-right">
              <div className="flex items-center justify-end space-x-2 space-x-reverse mb-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">وقت الاستجابة</h3>
              </div>
              <div className="text-2xl font-bold text-blue-600">{analytics.performance.responseTime}h</div>
              <div className="text-sm text-gray-600 mt-1">متوسط</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-right">
              <div className="flex items-center justify-end space-x-2 space-x-reverse mb-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium">معدل التصعيد</h3>
              </div>
              <div className="text-2xl font-bold text-orange-600">{analytics.performance.escalationRate}%</div>
              <div className="text-sm text-gray-600 mt-1">من إجمالي التنبيهات</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-right">
              <div className="flex items-center justify-end space-x-2 space-x-reverse mb-2">
                <CheckCircle className="h-5 w-5 text-purple-500" />
                <h3 className="font-medium">رضا العملاء</h3>
              </div>
              <div className="text-2xl font-bold text-purple-600">{analytics.performance.customerSatisfaction}/5</div>
              <div className="flex mt-1">
                {[1,2,3,4,5].map(star => (
                  <div key={star} className={`w-3 h-3 ${star <= Math.floor(analytics.performance.customerSatisfaction) ? 'bg-yellow-400' : 'bg-gray-300'} rounded-full ml-1`} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تحليل الاتجاهات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.trends.map(trend => (
              <div key={trend.metric} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  {getTrendIcon(trend.trend)}
                  <h4 className="font-medium text-right">{trend.metric}</h4>
                </div>
                <div className="text-2xl font-bold">{trend.current}</div>
                <div className={`text-sm ${trend.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatChange(trend.change)} من الشهر الماضي
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Alert Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">أنواع التنبيهات الأكثر شيوعاً</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.topAlertTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="العدد" />
                <Bar dataKey="avgImpact" fill="#f59e0b" name="متوسط التأثير" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
