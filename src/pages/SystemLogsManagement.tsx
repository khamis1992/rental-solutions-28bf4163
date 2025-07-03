/**
 * صفحة إدارة السجلات الشاملة
 * Comprehensive System Logs Management Page
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useComprehensiveLogging } from '@/hooks/use-comprehensive-logging';
import { 
  comprehensiveLogger, 
  LogEntry, 
  LogLevel, 
  EventType, 
  EntityType,
  LogStatistics
} from '@/services/comprehensive-logging-service';
import {
  Search,
  Download,
  Filter,
  Trash2,
  AlertTriangle,
  Activity,
  Database,
  User,
  Settings,
  BarChart3,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  RefreshCw
} from 'lucide-react';

// واجهة الفلاتر
interface LogFilters {
  level?: LogLevel;
  event_type?: EventType;
  entity_type?: EntityType;
  entity_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  component?: string;
}

// واجهة الإحصائيات
interface LogStats {
  total_logs: number;
  error_count: number;
  error_rate: number;
  avg_response_time: number;
  logs_by_level: Record<string, number>;
  logs_by_event_type: Record<string, number>;
  recent_errors: LogEntry[];
  slowest_operations: Array<{
    operation: string;
    avg_duration: number;
    count: number;
  }>;
}

const SystemLogsManagement: React.FC = () => {
  const { toast } = useToast();
  const { logUserAction, logInfo } = useComprehensiveLogging('SystemLogsManagement');

  // الحالات
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({});
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // تحميل السجلات
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await comprehensiveLogger.getLogs(filters);
      setLogs(data);
      
      await logInfo('Logs fetched successfully', { 
        count: data.length, 
        filters 
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'خطأ في تحميل السجلات',
        description: 'حدث خطأ أثناء تحميل السجلات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // تحميل الإحصائيات
  const fetchStats = async () => {
    try {
      const data = await comprehensiveLogger.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // تأثيرات
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs();
        fetchStats();
      }, 30000); // كل 30 ثانية
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  // تصدير السجلات
  const exportLogs = async (format: 'json' | 'csv') => {
    try {
      const data = await comprehensiveLogger.exportLogs(format, filters);
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await logUserAction('export_logs', 'system', undefined, { format, count: logs.length });
      
      toast({
        title: 'تم تصدير السجلات',
        description: `تم تصدير ${logs.length} سجل بنجاح`,
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير السجلات',
        variant: 'destructive'
      });
    }
  };

  // أيقونات المستويات
  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // ألوان المستويات
  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  // إحصائيات سريعة
  const quickStats = useMemo(() => {
    if (!stats) return [];
    
    const errorCount = stats.logs_by_level?.error || 0;
    const errorRate = stats.total_logs > 0 ? (errorCount / stats.total_logs) * 100 : 0;
    
    return [
      {
        title: 'إجمالي السجلات',
        value: stats.total_logs.toLocaleString('ar-QA'),
        icon: <Activity className="h-4 w-4" />,
        color: 'blue'
      },
      {
        title: 'معدل الأخطاء',
        value: `${errorRate.toFixed(1)}%`,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: errorRate > 5 ? 'red' : 'green'
      },
      {
        title: 'متوسط الاستجابة',
        value: `${Math.round(stats.performance_metrics?.avg_response_time || 0)}ms`,
        icon: <Clock className="h-4 w-4" />,
        color: (stats.performance_metrics?.avg_response_time || 0) > 1000 ? 'red' : 'green'
      },
      {
        title: 'الأخطاء الأخيرة',
        value: (stats.recent_errors?.length || 0).toLocaleString('ar-QA'),
        icon: <XCircle className="h-4 w-4" />,
        color: (stats.recent_errors?.length || 0) > 10 ? 'red' : 'green'
      }
    ];
  }, [stats]);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة السجلات الشاملة</h1>
          <p className="text-gray-600 mt-1">مراقبة وتتبع جميع الأحداث والأخطاء في النظام</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoRefresh ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}
          </Button>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-600`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`text-${stat.color}-600`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="logs">السجلات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات</TabsTrigger>
        </TabsList>

        {/* تبويبة النظرة العامة */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الأخطاء الأخيرة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  الأخطاء الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  {stats?.recent_errors?.map((error, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border-b last:border-b-0">
                      {getLevelIcon(error.level)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{error.message}</p>
                        <p className="text-xs text-gray-500">
                          {error.timestamp ? new Date(error.timestamp).toLocaleString('ar-QA') : 'غير محدد'}
                        </p>
                        {error.component && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {error.component}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 p-4">
                      لا توجد أخطاء حديثة
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* أبطأ العمليات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  أبطأ العمليات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-60">
                  {stats?.performance_metrics?.slowest_operations?.map((op: { operation: string; avg_duration: number; count: number }, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div>
                        <p className="text-sm font-medium">{op.operation}</p>
                        <p className="text-xs text-gray-500">{op.count} مرة</p>
                      </div>
                      <Badge variant="secondary">
                        {Math.round(op.avg_duration)}ms
                      </Badge>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 p-4">
                      لا توجد بيانات عن العمليات
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويبة السجلات */}
        <TabsContent value="logs" className="space-y-6">
          {/* فلاتر البحث */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                فلاتر البحث
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">البحث</label>
                  <Input
                    placeholder="ابحث في الرسائل..."
                    value={filters.search || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">المستوى</label>
                  <Select 
                    value={filters.level || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      level: value === 'all' ? undefined : value as LogLevel 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="جميع المستويات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع المستويات</SelectItem>
                      <SelectItem value="critical">حرج</SelectItem>
                      <SelectItem value="error">خطأ</SelectItem>
                      <SelectItem value="warn">تحذير</SelectItem>
                      <SelectItem value="info">معلومات</SelectItem>
                      <SelectItem value="debug">تصحيح</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">نوع الحدث</label>
                  <Select 
                    value={filters.event_type || 'all'} 
                    onValueChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      event_type: value === 'all' ? undefined : value as EventType 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="جميع الأحداث" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأحداث</SelectItem>
                      <SelectItem value="user_action">إجراء المستخدم</SelectItem>
                      <SelectItem value="system_operation">عملية النظام</SelectItem>
                      <SelectItem value="database_operation">عملية قاعدة البيانات</SelectItem>
                      <SelectItem value="api_call">استدعاء API</SelectItem>
                      <SelectItem value="payment">دفعة</SelectItem>
                      <SelectItem value="maintenance">صيانة</SelectItem>
                      <SelectItem value="error">خطأ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end gap-2">
                  <Button onClick={() => setFilters({})}>
                    مسح الفلاتر
                  </Button>
                  <Button variant="outline" onClick={() => exportLogs('json')}>
                    <Download className="h-4 w-4 mr-2" />
                    JSON
                  </Button>
                  <Button variant="outline" onClick={() => exportLogs('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* جدول السجلات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>السجلات ({logs.length.toLocaleString('ar-QA')})</span>
                {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      {getLevelIcon(log.level)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getLevelColor(log.level)} className="text-xs">
                            {log.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.event_type}
                          </Badge>
                          {log.component && (
                            <Badge variant="secondary" className="text-xs">
                              {log.component}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp!).toLocaleString('ar-QA')}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{log.message}</p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              عرض التفاصيل
                            </summary>
                            <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      {log.duration_ms && (
                        <Badge variant="outline" className="text-xs">
                          {log.duration_ms}ms
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويبة التحليلات */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* توزيع المستويات */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع المستويات</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.logs_by_level && Object.entries(stats.logs_by_level).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(level as LogLevel)}
                      <span className="text-sm">{level}</span>
                    </div>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 p-4">
                    لا توجد بيانات متاحة
                  </div>
                )}
              </CardContent>
            </Card>

            {/* توزيع أنواع الأحداث */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع أنواع الأحداث</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.logs_by_event_type && Object.entries(stats.logs_by_event_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-2">
                    <span className="text-sm">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                )) || (
                  <div className="text-center text-gray-500 p-4">
                    لا توجد بيانات متاحة
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويبة التنبيهات */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                إعدادات التنبيهات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                سيتم إضافة واجهة إدارة التنبيهات قريباً
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemLogsManagement; 