import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Target, 
  Brain, 
  Zap,
  DollarSign,
  Users,
  Car,
  BarChart3,
  Activity,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalyticsEngine } from '../core/AnalyticsEngine';
import { formatCurrency } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmartMetricCardProps {
  metric: any;
  onClick?: () => void;
  isSelected?: boolean;
}

const SmartMetricCard: React.FC<SmartMetricCardProps> = ({ metric, onClick, isSelected }) => {
  const { language } = useLanguage();
  
  const getChangeIcon = () => {
    switch (metric.changeType) {
      case 'increase':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'decrease':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = () => {
    switch (metric.changeType) {
      case 'increase':
        return 'text-green-600 bg-green-50';
      case 'decrease':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = () => {
    switch (metric.category) {
      case 'financial':
        return <DollarSign className="h-5 w-5 text-emerald-500" />;
      case 'customer':
        return <Users className="h-5 w-5 text-blue-500" />;
      case 'fleet':
        return <Car className="h-5 w-5 text-purple-500" />;
      default:
        return <BarChart3 className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'QAR') {
      return formatCurrency(value);
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg",
        isSelected && "ring-2 ring-primary shadow-lg",
        "bg-gradient-to-br from-background to-background/50"
      )}
      onClick={onClick}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
        {getCategoryIcon()}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {getCategoryIcon()}
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                {metric.name}
              </h3>
              <p className="text-2xl font-bold text-foreground">
                {formatValue(metric.value, metric.unit)}
              </p>
            </div>
          </div>
          
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            getChangeColor()
          )}>
            {getChangeIcon()}
            {Math.abs(metric.change).toFixed(1)}%
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">الثقة</span>
            <span className="font-medium">{(metric.confidence * 100).toFixed(0)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary rounded-full h-1.5 transition-all duration-300"
              style={{ width: `${metric.confidence * 100}%` }}
            />
          </div>

          {metric.forecast && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">توقع 30 يوم</span>
                <span className="font-medium text-primary">
                  {formatValue(metric.forecast.next30Days, metric.unit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface SmartAlertCardProps {
  alert: any;
  onDismiss: (id: string) => void;
}

const SmartAlertCard: React.FC<SmartAlertCardProps> = ({ alert, onDismiss }) => {
  const { language } = useLanguage();
  
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertColor = () => {
    switch (alert.type) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className={cn("border-l-4", getAlertColor())} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getAlertIcon()}
            <h4 className="font-semibold text-sm">{alert.title}</h4>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDismiss(alert.id)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">
          {alert.description}
        </p>

        {alert.suggestedActions && alert.suggestedActions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground mb-1">الإجراءات المقترحة:</p>
            {alert.suggestedActions.slice(0, 2).map((action: string, index: number) => (
              <p key={index} className="text-xs text-muted-foreground">
                • {action}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface SmartInsightCardProps {
  insight: any;
  onMarkAsRead: (id: string) => void;
}

const SmartInsightCard: React.FC<SmartInsightCardProps> = ({ insight, onMarkAsRead }) => {
  const { language } = useLanguage();
  
  const getInsightIcon = () => {
    switch (insight.type) {
      case 'trend':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'opportunity':
        return <Target className="h-5 w-5 text-green-500" />;
      case 'risk':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getImpactColor = () => {
    switch (insight.impact) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getInsightIcon()}
            <h4 className="font-semibold text-sm">{insight.title}</h4>
          </div>
          <Badge className={cn("text-xs", getImpactColor())}>
            {insight.impact === 'critical' ? 'حرج' :
             insight.impact === 'high' ? 'عالي' :
             insight.impact === 'medium' ? 'متوسط' : 'منخفض'}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {insight.description}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            الثقة: {(insight.confidence * 100).toFixed(0)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkAsRead(insight.id)}
            className="text-xs text-primary hover:text-primary/80"
          >
            عرض التفاصيل
          </Button>
        </div>

        {insight.recommendations && insight.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs font-medium mb-1">التوصيات:</p>
            {insight.recommendations.slice(0, 2).map((rec: string, index: number) => (
              <p key={index} className="text-xs text-muted-foreground">
                • {rec}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const SmartAnalyticsDashboard: React.FC = () => {
  const { language } = useLanguage();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    metrics,
    alerts,
    insights,
    isLoading,
    lastUpdate,
    error,
    refreshData,
    getMetricsByCategory,
    getActiveAlerts,
    getInsightsByImpact,
    dismissAlert,
    markInsightAsRead
  } = useAnalyticsEngine();

  const financialMetrics = useMemo(() => getMetricsByCategory('financial'), [getMetricsByCategory]);
  const fleetMetrics = useMemo(() => getMetricsByCategory('fleet'), [getMetricsByCategory]);
  const customerMetrics = useMemo(() => getMetricsByCategory('customer'), [getMetricsByCategory]);
  const activeAlerts = useMemo(() => getActiveAlerts(), [getActiveAlerts]);
  const highImpactInsights = useMemo(() => getInsightsByImpact('high'), [getInsightsByImpact]);

  if (isLoading) {
    return (
      <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 mb-2">{error}</p>
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          إعادة المحاولة
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            لوحة التحليلات الذكية
          </h2>
          <p className="text-muted-foreground mt-1">
            رؤى متقدمة ومدعومة بالذكاء الاصطناعي
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <p className="text-xs text-muted-foreground">
              آخر تحديث: {lastUpdate.toLocaleTimeString('ar-QA')}
            </p>
          )}
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            تنبيهات ذكية ({activeAlerts.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.slice(0, 4).map(alert => (
              <SmartAlertCard
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="financial">مالية</TabsTrigger>
          <TabsTrigger value="fleet">أسطول</TabsTrigger>
          <TabsTrigger value="customers">عملاء</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.slice(0, 6).map(metric => (
              <SmartMetricCard
                key={metric.id}
                metric={metric}
                onClick={() => setSelectedMetric(metric.id)}
                isSelected={selectedMetric === metric.id}
              />
            ))}
          </div>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                رؤى ذكية ({insights.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.slice(0, 4).map(insight => (
                  <SmartInsightCard
                    key={insight.id}
                    insight={insight}
                    onMarkAsRead={markInsightAsRead}
                  />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {financialMetrics.map(metric => (
              <SmartMetricCard
                key={metric.id}
                metric={metric}
                onClick={() => setSelectedMetric(metric.id)}
                isSelected={selectedMetric === metric.id}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fleetMetrics.map(metric => (
              <SmartMetricCard
                key={metric.id}
                metric={metric}
                onClick={() => setSelectedMetric(metric.id)}
                isSelected={selectedMetric === metric.id}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customerMetrics.map(metric => (
              <SmartMetricCard
                key={metric.id}
                metric={metric}
                onClick={() => setSelectedMetric(metric.id)}
                isSelected={selectedMetric === metric.id}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};