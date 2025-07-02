
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Bell, 
  X, 
  Eye, 
  Filter,
  Settings,
  TrendingUp,
  Calendar,
  DollarSign,
  Car,
  FileText,
  Users,
  Zap,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Target
} from 'lucide-react';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';

// Enhanced alert types
interface SmartAlert {
  id: string;
  type: 'maintenance' | 'payment' | 'contract' | 'vehicle' | 'legal' | 'insurance' | 'inspection';
  category: 'financial' | 'operational' | 'compliance' | 'customer';
  priority: 'critical' | 'high' | 'medium' | 'low';
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  description: string;
  details?: string;
  actionText?: string;
  actionUrl?: string;
  relatedEntity?: {
    type: 'vehicle' | 'customer' | 'agreement';
    id: string;
    name: string;
  };
  createdAt: Date;
  dueDate?: Date;
  isRead: boolean;
  isResolved: boolean;
  estimatedImpact?: 'high' | 'medium' | 'low';
  tags?: string[];
  metadata?: Record<string, any>;
}

interface AlertFilters {
  priority: string[];
  category: string[];
  type: string[];
  status: 'all' | 'unread' | 'unresolved';
  timeRange: 'today' | 'week' | 'month' | 'all';
}

// Enhanced data fetching
const fetchEnhancedSmartAlerts = async (): Promise<SmartAlert[]> => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const alerts: SmartAlert[] = [];

  try {
    // Critical Payment Alerts
    const { data: criticalPayments } = await supabase
      .from('unified_payments')
      .select('id, amount, due_date, leases(agreement_number, profiles(full_name))')
      .eq('status', 'pending')
      .lt('due_date', todayStr);

    if (criticalPayments?.length) {
      const totalAmount = criticalPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      alerts.push({
        id: 'critical-overdue-payments',
        type: 'payment',
        category: 'financial',
        priority: 'critical',
        severity: 'urgent',
        title: `${criticalPayments.length} دفعة متأخرة حرجة`,
        description: `إجمالي المبلغ: ${formatCurrency(totalAmount)}`,
        details: 'تتطلب إجراء فوري لتجنب التأثير على التدفق النقدي',
        actionText: 'عرض الدفعات المتأخرة',
        actionUrl: '/financials/transactions',
        estimatedImpact: 'high',
        tags: ['financial', 'urgent', 'overdue'],
        createdAt: new Date(),
        isRead: false,
        isResolved: false,
        metadata: { count: criticalPayments.length, totalAmount }
      });
    }

    // Vehicle Maintenance Alerts
    const { data: maintenanceVehicles } = await supabase
      .from('vehicles')
      .select('id, make, model, mileage, license_plate')
      .eq('status', 'maintenance');

    if (maintenanceVehicles?.length) {
      alerts.push({
        id: 'maintenance-backlog',
        type: 'maintenance',
        category: 'operational',
        priority: maintenanceVehicles.length > 5 ? 'high' : 'medium',
        severity: 'warning',
        title: `${maintenanceVehicles.length} مركبة في الصيانة`,
        description: 'قد تؤثر على توفر الأسطول',
        details: `المركبات: ${maintenanceVehicles.slice(0, 3).map(v => v.license_plate).join(', ')}`,
        actionText: 'إدارة الصيانة',
        actionUrl: '/maintenance',
        estimatedImpact: maintenanceVehicles.length > 5 ? 'high' : 'medium',
        tags: ['maintenance', 'fleet'],
        createdAt: new Date(),
        isRead: false,
        isResolved: false,
        metadata: { vehicles: maintenanceVehicles }
      });
    }

    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  } catch (error) {
    console.error('Error fetching enhanced alerts:', error);
    return [];
  }
};

export const EnhancedSmartAlertsWidget: React.FC<{ className?: string }> = ({ className }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({
    priority: [],
    category: [],
    type: [],
    status: 'all',
    timeRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['enhancedSmartAlerts'],
    queryFn: fetchEnhancedSmartAlerts,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Filter alerts based on current filters
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (dismissedAlerts.includes(alert.id)) return false;
      
      if (filters.priority.length && !filters.priority.includes(alert.priority)) return false;
      if (filters.category.length && !filters.category.includes(alert.category)) return false;
      if (filters.type.length && !filters.type.includes(alert.type)) return false;
      
      if (filters.status === 'unread' && alert.isRead) return false;
      if (filters.status === 'unresolved' && alert.isResolved) return false;
      
      return true;
    });
  }, [alerts, dismissedAlerts, filters]);

  // Group alerts by category for tabs
  const alertsByCategory = useMemo(() => {
    const grouped = filteredAlerts.reduce((acc, alert) => {
      if (!acc[alert.category]) acc[alert.category] = [];
      acc[alert.category].push(alert);
      return acc;
    }, {} as Record<string, SmartAlert[]>);
    
    return {
      all: filteredAlerts,
      ...grouped
    };
  }, [filteredAlerts]);

  const alertCounts = useMemo(() => ({
    critical: filteredAlerts.filter(a => a.priority === 'critical').length,
    high: filteredAlerts.filter(a => a.priority === 'high').length,
    unread: filteredAlerts.filter(a => !a.isRead).length,
    total: filteredAlerts.length
  }), [filteredAlerts]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  const resolveAlert = (alertId: string) => {
    setResolvedAlerts(prev => [...prev, alertId]);
  };

  const getPriorityConfig = (priority: string, severity?: string) => {
    const configs = {
      critical: { 
        color: 'border-red-600 bg-red-50', 
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
        badge: 'bg-red-100 text-red-800'
      },
      high: { 
        color: 'border-orange-500 bg-orange-50', 
        icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
        badge: 'bg-orange-100 text-orange-800'
      },
      medium: { 
        color: 'border-yellow-500 bg-yellow-50', 
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        badge: 'bg-yellow-100 text-yellow-800'
      },
      low: { 
        color: 'border-blue-500 bg-blue-50', 
        icon: <Bell className="h-4 w-4 text-blue-500" />,
        badge: 'bg-blue-100 text-blue-800'
      }
    };
    
    return configs[priority as keyof typeof configs] || configs.low;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      financial: <DollarSign className="h-4 w-4" />,
      operational: <Car className="h-4 w-4" />,
      compliance: <FileText className="h-4 w-4" />,
      customer: <Users className="h-4 w-4" />
    };
    return icons[category as keyof typeof icons] || <Bell className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card className={cn("border-0 shadow-md", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-0 shadow-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between" dir="rtl">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch()}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-right flex-1">
            <div className="flex items-center justify-end space-x-2 space-x-reverse mb-2">
              <CardTitle className="text-lg font-medium">التنبيهات الذكية المحسنة</CardTitle>
              <Zap className="h-5 w-5 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-end space-x-2 space-x-reverse text-sm">
              {alertCounts.critical > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {alertCounts.critical} حرج
                </Badge>
              )}
              {alertCounts.high > 0 && (
                <Badge className="bg-orange-100 text-orange-800">
                  {alertCounts.high} عالي
                </Badge>
              )}
              <span className="text-muted-foreground">
                {alertCounts.total} تنبيه نشط
              </span>
            </div>
          </div>
        </div>

        {/* Progress indicator for urgent items */}
        {alertCounts.critical + alertCounts.high > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1" dir="rtl">
              <span>معالجة التنبيهات العاجلة</span>
              <span>{Math.round(((alertCounts.total - alertCounts.critical - alertCounts.high) / alertCounts.total) * 100)}%</span>
            </div>
            <Progress 
              value={((alertCounts.total - alertCounts.critical - alertCounts.high) / alertCounts.total) * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2">
          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" dir="rtl">
                <div>
                  <label className="text-xs font-medium text-right block mb-1">الأولوية</label>
                  <div className="space-y-1">
                    {['critical', 'high', 'medium', 'low'].map(priority => (
                      <label key={priority} className="flex items-center text-xs">
                        <span className="mr-2">
                          {priority === 'critical' ? 'حرج' : 
                           priority === 'high' ? 'عالي' : 
                           priority === 'medium' ? 'متوسط' : 'منخفض'}
                        </span>
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(priority)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({ ...prev, priority: [...prev.priority, priority] }));
                            } else {
                              setFilters(prev => ({ ...prev, priority: prev.priority.filter(p => p !== priority) }));
                            }
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-right block mb-1">الفئة</label>
                  <div className="space-y-1">
                    {['financial', 'operational', 'compliance', 'customer'].map(category => (
                      <label key={category} className="flex items-center text-xs">
                        <span className="mr-2">
                          {category === 'financial' ? 'مالي' : 
                           category === 'operational' ? 'تشغيلي' : 
                           category === 'compliance' ? 'امتثال' : 'عملاء'}
                        </span>
                        <input
                          type="checkbox"
                          checked={filters.category.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({ ...prev, category: [...prev.category, category] }));
                            } else {
                              setFilters(prev => ({ ...prev, category: prev.category.filter(c => c !== category) }));
                            }
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alerts Display */}
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-medium">لا توجد تنبيهات!</p>
                  <p className="text-sm">جميع الأمور تسير على ما يرام</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const config = getPriorityConfig(alert.priority, alert.severity);
                  return (
                    <div
                      key={alert.id}
                      className={cn("p-4 rounded-lg border-l-4", config.color)}
                      dir="rtl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getCategoryIcon(alert.category)}
                            <h4 className="font-medium text-right">{alert.title}</h4>
                            <Badge className={config.badge}>
                              {alert.priority === 'critical' ? 'حرج' : 
                               alert.priority === 'high' ? 'عالي' : 
                               alert.priority === 'medium' ? 'متوسط' : 'منخفض'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 text-right mb-2">{alert.description}</p>
                          {alert.details && (
                            <p className="text-xs text-gray-500 text-right">{alert.details}</p>
                          )}
                          {alert.actionText && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => window.location.href = alert.actionUrl || '#'}
                            >
                              {alert.actionText}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};
