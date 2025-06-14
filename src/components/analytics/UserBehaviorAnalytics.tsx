import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  MousePointer, 
  Clock, 
  Smartphone, 
  Monitor, 
  Globe,
  TrendingUp,
  Activity,
  Eye,
  Navigation,
  RefreshCw,
  BarChart3,
  PieChart,
  Target
} from 'lucide-react';
import { performanceAnalytics, UserAction } from '@/services/performance-analytics';

interface UserBehaviorAnalyticsProps {
  className?: string;
  timeRange?: number;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  actions: UserAction[];
  duration: number;
  pageViews: number;
  interactions: number;
  isMobile: boolean;
}

interface ComponentInteraction {
  component: string;
  actions: number;
  successRate: number;
  avgDuration: number;
  lastInteraction: number;
}

interface UserFlow {
  path: string[];
  count: number;
  avgDuration: number;
  dropOffRate: number;
}

const UserBehaviorAnalytics: React.FC<UserBehaviorAnalyticsProps> = ({
  className,
  timeRange = 24 * 60 * 60 * 1000 // 24 hours default
}) => {
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [componentInteractions, setComponentInteractions] = useState<ComponentInteraction[]>([]);
  const [userFlows, setUserFlows] = useState<UserFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(loadAnalyticsData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [timeRange, autoRefresh]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      
      const actions = performanceAnalytics.getUserActions(timeRange);
      setUserActions(actions);
      
      // Process sessions
      const sessionMap = new Map<string, UserAction[]>();
      actions.forEach(action => {
        if (!sessionMap.has(action.sessionId)) {
          sessionMap.set(action.sessionId, []);
        }
        sessionMap.get(action.sessionId)!.push(action);
      });

      const processedSessions: UserSession[] = Array.from(sessionMap.entries()).map(([sessionId, sessionActions]) => {
        const sortedActions = sessionActions.sort((a, b) => a.timestamp - b.timestamp);
        const startTime = sortedActions[0]?.timestamp || Date.now();
        const endTime = sortedActions[sortedActions.length - 1]?.timestamp;
        const duration = endTime ? endTime - startTime : 0;
        
        return {
          sessionId,
          startTime,
          endTime,
          actions: sortedActions,
          duration,
          pageViews: sortedActions.filter(a => a.action === 'page_view').length,
          interactions: sortedActions.filter(a => a.action !== 'page_view').length,
          isMobile: sortedActions.some(a => a.metadata?.isMobile) || false
        };
      });

      setSessions(processedSessions);

      // Process component interactions
      const componentMap = new Map<string, UserAction[]>();
      actions.forEach(action => {
        if (!componentMap.has(action.component)) {
          componentMap.set(action.component, []);
        }
        componentMap.get(action.component)!.push(action);
      });

      const processedComponents: ComponentInteraction[] = Array.from(componentMap.entries()).map(([component, componentActions]) => {
        const successfulActions = componentActions.filter(a => a.success);
        const successRate = componentActions.length > 0 ? (successfulActions.length / componentActions.length) * 100 : 0;
        const durations = componentActions.filter(a => a.duration).map(a => a.duration!);
        const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        const lastInteraction = Math.max(...componentActions.map(a => a.timestamp));

        return {
          component,
          actions: componentActions.length,
          successRate,
          avgDuration,
          lastInteraction
        };
      });

      setComponentInteractions(processedComponents.sort((a, b) => b.actions - a.actions));

      // Process user flows (simplified)
      const flows = processedSessions.map(session => {
        const pageViews = session.actions.filter(a => a.action === 'page_view');
        const path = pageViews.map(pv => pv.metadata?.page || pv.component);
        return {
          path,
          duration: session.duration,
          completed: session.actions.some(a => a.action === 'form_submit' && a.success)
        };
      });

      // Group similar flows
      const flowMap = new Map<string, { count: number; durations: number[]; completed: number }>();
      flows.forEach(flow => {
        const pathKey = flow.path.slice(0, 3).join(' → '); // First 3 steps
        if (!flowMap.has(pathKey)) {
          flowMap.set(pathKey, { count: 0, durations: [], completed: 0 });
        }
        const flowData = flowMap.get(pathKey)!;
        flowData.count++;
        flowData.durations.push(flow.duration);
        if (flow.completed) flowData.completed++;
      });

      const processedFlows: UserFlow[] = Array.from(flowMap.entries()).map(([pathKey, data]) => ({
        path: pathKey.split(' → '),
        count: data.count,
        avgDuration: data.durations.reduce((a, b) => a + b, 0) / data.durations.length,
        dropOffRate: ((data.count - data.completed) / data.count) * 100
      }));

      setUserFlows(processedFlows.sort((a, b) => b.count - a.count));

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getEngagementLevel = (session: UserSession): 'high' | 'medium' | 'low' => {
    if (session.interactions > 10 && session.duration > 300000) return 'high'; // 5+ minutes, 10+ interactions
    if (session.interactions > 5 && session.duration > 120000) return 'medium'; // 2+ minutes, 5+ interactions
    return 'low';
  };

  const getEngagementColor = (level: 'high' | 'medium' | 'low'): string => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
    }
  };

  // Calculate overall metrics
  const totalSessions = sessions.length;
  const avgSessionDuration = sessions.length > 0 
    ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length 
    : 0;
  const mobileUsers = sessions.filter(s => s.isMobile).length;
  const mobilePercentage = totalSessions > 0 ? (mobileUsers / totalSessions) * 100 : 0;
  const avgInteractionsPerSession = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + s.interactions, 0) / sessions.length
    : 0;

  if (isLoading && userActions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{isArabic ? 'جاري تحليل سلوك المستخدمين...' : 'Analyzing user behavior...'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
        <div>
          <h2 className="text-2xl font-bold">
            {isArabic ? 'تحليل سلوك المستخدمين' : 'User Behavior Analytics'}
          </h2>
          <p className="text-gray-600">
            {isArabic ? 'فهم أنماط التفاعل والمشاركة' : 'Understanding interaction patterns and engagement'}
          </p>
        </div>
        
        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
          className="touch-friendly"
        >
          <Activity className="w-4 h-4" />
          {isArabic ? 'تحديث تلقائي' : 'Auto Refresh'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Users className="w-8 h-8 text-blue-500" />
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <p className="text-2xl font-bold">{totalSessions}</p>
                <p className="text-sm text-gray-600">
                  {isArabic ? 'جلسات المستخدمين' : 'User Sessions'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Clock className="w-8 h-8 text-green-500" />
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <p className="text-2xl font-bold">{formatDuration(avgSessionDuration)}</p>
                <p className="text-sm text-gray-600">
                  {isArabic ? 'متوسط مدة الجلسة' : 'Avg Session Duration'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Smartphone className="w-8 h-8 text-purple-500" />
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <p className="text-2xl font-bold">{mobilePercentage.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">
                  {isArabic ? 'مستخدمو الجوال' : 'Mobile Users'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <MousePointer className="w-8 h-8 text-orange-500" />
              <div className={isArabic ? 'text-right' : 'text-left'}>
                <p className="text-2xl font-bold">{avgInteractionsPerSession.toFixed(1)}</p>
                <p className="text-sm text-gray-600">
                  {isArabic ? 'تفاعلات/جلسة' : 'Interactions/Session'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="sessions">
            {isArabic ? 'الجلسات' : 'Sessions'}
          </TabsTrigger>
          <TabsTrigger value="components">
            {isArabic ? 'المكونات' : 'Components'}
          </TabsTrigger>
          <TabsTrigger value="flows">
            {isArabic ? 'مسارات المستخدم' : 'User Flows'}
          </TabsTrigger>
          <TabsTrigger value="engagement">
            {isArabic ? 'المشاركة' : 'Engagement'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Users className="w-5 h-5" />
                {isArabic ? 'جلسات المستخدمين الحديثة' : 'Recent User Sessions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sessions.slice(0, 10).map(session => {
                  const engagement = getEngagementLevel(session);
                  return (
                    <div key={session.sessionId} className="border rounded-lg p-3">
                      <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                          {session.isMobile ? 
                            <Smartphone className="w-4 h-4 text-purple-500" /> : 
                            <Monitor className="w-4 h-4 text-blue-500" />
                          }
                          <div className={isArabic ? 'text-right' : 'text-left'}>
                            <p className="font-medium text-sm">
                              {isArabic ? 'الجلسة:' : 'Session:'} {session.sessionId.slice(-8)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDuration(session.duration)} • {session.interactions} {isArabic ? 'تفاعل' : 'interactions'}
                            </p>
                          </div>
                        </div>
                        
                        <Badge className={getEngagementColor(engagement)}>
                          {isArabic ? 
                            (engagement === 'high' ? 'عالي' : engagement === 'medium' ? 'متوسط' : 'منخفض') :
                            engagement
                          }
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Target className="w-5 h-5" />
                {isArabic ? 'تفاعل المكونات' : 'Component Interactions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {componentInteractions.slice(0, 10).map(component => (
                  <div key={component.component} className="border rounded-lg p-3">
                    <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-medium">{component.component}</p>
                        <p className="text-sm text-gray-600">
                          {component.actions} {isArabic ? 'إجراء' : 'actions'} • 
                          {component.avgDuration > 0 && ` ${formatDuration(component.avgDuration)} avg`}
                        </p>
                      </div>
                      <Badge variant={component.successRate > 90 ? 'default' : component.successRate > 70 ? 'secondary' : 'destructive'}>
                        {component.successRate.toFixed(1)}% {isArabic ? 'نجاح' : 'success'}
                      </Badge>
                    </div>
                    <Progress value={component.successRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Navigation className="w-5 h-5" />
                {isArabic ? 'مسارات المستخدم الشائعة' : 'Common User Flows'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userFlows.slice(0, 8).map((flow, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-medium text-sm">
                          {flow.path.join(' → ')}
                        </p>
                        <p className="text-xs text-gray-600">
                          {flow.count} {isArabic ? 'مستخدم' : 'users'} • {formatDuration(flow.avgDuration)}
                        </p>
                      </div>
                      <Badge variant={flow.dropOffRate < 20 ? 'default' : flow.dropOffRate < 50 ? 'secondary' : 'destructive'}>
                        {flow.dropOffRate.toFixed(1)}% {isArabic ? 'تسرب' : 'drop-off'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <TrendingUp className="w-5 h-5" />
                  {isArabic ? 'مستويات المشاركة' : 'Engagement Levels'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['high', 'medium', 'low'].map(level => {
                    const count = sessions.filter(s => getEngagementLevel(s) === level).length;
                    const percentage = totalSessions > 0 ? (count / totalSessions) * 100 : 0;
                    
                    return (
                      <div key={level}>
                        <div className={`flex items-center justify-between mb-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                          <span className="text-sm font-medium">
                            {isArabic ? 
                              (level === 'high' ? 'مشاركة عالية' : level === 'medium' ? 'مشاركة متوسطة' : 'مشاركة منخفضة') :
                              `${level.charAt(0).toUpperCase() + level.slice(1)} Engagement`
                            }
                          </span>
                          <span className="text-sm text-gray-600">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                  <Eye className="w-5 h-5" />
                  {isArabic ? 'إحصائيات سريعة' : 'Quick Stats'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm">{isArabic ? 'إجمالي الإجراءات:' : 'Total Actions:'}</span>
                    <span className="font-medium">{userActions.length}</span>
                  </div>
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm">{isArabic ? 'معدل النجاح:' : 'Success Rate:'}</span>
                    <span className="font-medium">
                      {userActions.length > 0 ? 
                        ((userActions.filter(a => a.success).length / userActions.length) * 100).toFixed(1) : 0
                      }%
                    </span>
                  </div>
                  <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm">{isArabic ? 'الجلسات النشطة:' : 'Active Sessions:'}</span>
                    <span className="font-medium">
                      {sessions.filter(s => !s.endTime || (Date.now() - s.startTime) < 1800000).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserBehaviorAnalytics; 