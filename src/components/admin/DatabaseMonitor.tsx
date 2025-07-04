/**
 * مكون مراقبة قاعدة البيانات
 * Database Monitoring Component
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Clock, 
  Database, 
  Activity, 
  RefreshCw, 
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { performanceMonitor } from '@/lib/database/performance-monitor';
import { getCacheStats } from '@/lib/database/simple-cache';
import { errorLogger } from '@/lib/errors/error-logger';

interface ConnectionStats {
  database_name: string;
  active_connections: number;
  idle_connections: number;
  waiting_connections: number;
  max_connections: number;
  usage_percentage: number;
}

interface SlowQuery {
  query_name: string;
  execution_time_ms: number;
  executed_at: string;
  row_count: number;
  cache_hit: boolean;
}

export const DatabaseMonitor: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // جلب بيانات مراقبة قاعدة البيانات
  const fetchMonitoringData = async () => {
    try {
      setIsLoading(true);

      // إحصائيات الاتصالات
      const { data: connections, error: connError } = await supabase
        .rpc('monitor_connections');
      
      if (!connError && connections?.[0]) {
        setConnectionStats(connections[0]);
      }

      // أبطأ الاستعلامات
      const { data: queries, error: queriesError } = await supabase
        .from('query_performance_log')
        .select('*')
        .order('execution_time_ms', { ascending: false })
        .limit(10);

      if (!queriesError) {
        setSlowQueries(queries || []);
      }

      // إحصائيات الكاش
      const cacheData = getCacheStats();
      setCacheStats(cacheData);

      // إحصائيات الأداء
      const perfData = performanceMonitor.getStats();
      setPerformanceStats(perfData);

    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'DatabaseMonitor.fetchMonitoringData',
        action: 'fetch_monitoring_data'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // تنظيف الكاش
  const cleanupCache = async () => {
    try {
      await supabase.rpc('cleanup_expired_cache');
      await fetchMonitoringData();
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'DatabaseMonitor.cleanupCache',
        action: 'cleanup_cache'
      });
    }
  };

  // صيانة دورية
  const runMaintenance = async () => {
    try {
      await supabase.rpc('daily_cache_maintenance');
      await fetchMonitoringData();
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'DatabaseMonitor.runMaintenance',
        action: 'run_maintenance'
      });
    }
  };

  useEffect(() => {
    fetchMonitoringData();
  }, []);

  // تحديث تلقائي
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000); // كل 30 ثانية
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="mr-2 text-lg">جاري تحميل بيانات المراقبة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* العنوان والأزرار */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">مراقبة قاعدة البيانات</h1>
          <p className="text-gray-600 mt-1">مراقبة الأداء والإحصائيات المتقدمة</p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className="h-4 w-4 ml-2" />
            {autoRefresh ? 'إيقاف التحديث التلقائي' : 'تحديث تلقائي'}
          </Button>
          
          <Button variant="outline" onClick={cleanupCache}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تنظيف الكاش
          </Button>
          
          <Button variant="outline" onClick={runMaintenance}>
            <Zap className="h-4 w-4 ml-2" />
            صيانة شاملة
          </Button>
          
          <Button onClick={fetchMonitoringData}>
            <Database className="h-4 w-4 ml-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* الاتصالات النشطة */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الاتصالات النشطة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {connectionStats?.active_connections || 0}
                </p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
            {connectionStats && (
              <div className="mt-4">
                <Progress 
                  value={connectionStats.usage_percentage} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {connectionStats.usage_percentage}% من الحد الأقصى
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* إحصائيات الكاش */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">نسبة إصابة الكاش</p>
                <p className="text-2xl font-bold text-green-600">
                  {cacheStats?.hitRate?.toFixed(1) || 0}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {cacheStats?.hits || 0} إصابة من {(cacheStats?.hits || 0) + (cacheStats?.misses || 0)} طلب
            </p>
          </CardContent>
        </Card>

        {/* متوسط وقت الاستعلام */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">متوسط وقت الاستعلام</p>
                <p className="text-2xl font-bold text-orange-600">
                  {performanceStats?.averageTime?.toFixed(0) || 0}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* الاستعلامات البطيئة */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">استعلامات بطيئة</p>
                <p className="text-2xl font-bold text-red-600">
                  {performanceStats?.slowQueries || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التفاصيل المتقدمة */}
      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">الاتصالات</TabsTrigger>
          <TabsTrigger value="cache">الكاش</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="queries">الاستعلامات</TabsTrigger>
        </TabsList>

        {/* تبويب الاتصالات */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                إحصائيات الاتصالات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {connectionStats ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">قاعدة البيانات:</span>
                      <Badge variant="outline">{connectionStats.database_name}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">اتصالات نشطة:</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {connectionStats.active_connections}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">اتصالات خاملة:</span>
                      <Badge variant="secondary">{connectionStats.idle_connections}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">اتصالات منتظرة:</span>
                      <Badge variant="outline">{connectionStats.waiting_connections}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الحد الأقصى:</span>
                      <Badge>{connectionStats.max_connections}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">نسبة الاستخدام:</span>
                      <Badge 
                        className={
                          connectionStats.usage_percentage > 80 
                            ? 'bg-red-100 text-red-800' 
                            : connectionStats.usage_percentage > 60
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {connectionStats.usage_percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">لا توجد بيانات اتصال متاحة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الكاش */}
        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                إحصائيات التخزين المؤقت
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cacheStats ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">إجمالي الطلبات:</span>
                      <Badge>{(cacheStats.hits || 0) + (cacheStats.misses || 0)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">إصابات الكاش:</span>
                      <Badge className="bg-green-100 text-green-800">{cacheStats.hits || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">إخفاقات الكاش:</span>
                      <Badge className="bg-red-100 text-red-800">{cacheStats.misses || 0}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">عمليات الحفظ:</span>
                      <Badge variant="outline">{cacheStats.sets || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">نسبة الإصابة:</span>
                      <Badge 
                        className={
                          cacheStats.hitRate > 80 
                            ? 'bg-green-100 text-green-800' 
                            : cacheStats.hitRate > 60
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {cacheStats.hitRate?.toFixed(1) || 0}%
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">حجم الذاكرة:</span>
                      <Badge variant="secondary">{cacheStats.memorySize || 0} عنصر</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">لا توجد بيانات كاش متاحة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الأداء */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                إحصائيات الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceStats ? (
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">إجمالي الاستعلامات:</span>
                      <Badge>{performanceStats.totalQueries || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">متوسط الوقت:</span>
                      <Badge variant="outline">
                        {performanceStats.averageTime?.toFixed(0) || 0}ms
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">استعلامات بطيئة:</span>
                      <Badge 
                        className={
                          performanceStats.slowQueries > 5 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {performanceStats.slowQueries || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">نسبة الكاش:</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {performanceStats.cacheHitRate?.toFixed(1) || 0}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">لا توجد بيانات أداء متاحة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الاستعلامات */}
        <TabsContent value="queries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                أبطأ الاستعلامات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {slowQueries.length > 0 ? (
                <div className="space-y-3">
                  {slowQueries.map((query, index) => (
                    <div 
                      key={index}
                      className="p-4 border rounded-lg bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{query.query_name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            وقت التنفيذ: {query.execution_time_ms}ms
                          </p>
                          {query.row_count && (
                            <p className="text-sm text-gray-500">
                              عدد الصفوف: {query.row_count}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {query.cache_hit ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              كاش
                            </Badge>
                          ) : (
                            <Badge variant="secondary">DB</Badge>
                          )}
                          <Badge 
                            className={
                              query.execution_time_ms > 2000 
                                ? 'bg-red-100 text-red-800' 
                                : query.execution_time_ms > 1000
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }
                          >
                            {query.execution_time_ms}ms
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">لا توجد استعلامات مسجلة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};  