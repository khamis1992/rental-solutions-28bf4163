import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Car, 
  CreditCard, 
  Wrench, 
  Gavel, 
  User, 
  Clock,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  FileText,
  Settings,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ActivityService, SystemActivity } from '@/services/activity-service';

const ActivityPage = () => {
  const { toast } = useToast();
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalToday: 0,
    errorsAndWarnings: 0,
    activeUsers: 0
  });

  useEffect(() => {
    loadSystemActivities();
    loadActivityStats();
  }, []);

  const loadSystemActivities = async () => {
    setIsLoading(true);
    try {
      const realActivities = await ActivityService.getSystemActivities(50);
      setActivities(realActivities);
    } catch (error) {
      console.error('Error loading system activities:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل سجل النشاط",
        variant: "destructive",
      });
      // Fallback to empty array
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActivityStats = async () => {
    try {
      const activityStats = await ActivityService.getActivityStats();
      setStats(activityStats);
    } catch (error) {
      console.error('Error loading activity stats:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <User className="h-5 w-5" />;
      case 'vehicle':
        return <Car className="h-5 w-5" />;
      case 'payment':
      case 'financial':
        return <CreditCard className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      case 'legal':
        return <Gavel className="h-5 w-5" />;
      case 'agreement':
        return <FileText className="h-5 w-5" />;
      case 'admin':
        return <Settings className="h-5 w-5" />;
      case 'system':
        return <Activity className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'vehicle':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'payment':
      case 'financial':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'legal':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'agreement':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'admin':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'system':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      customer: 'العملاء',
      vehicle: 'المركبات',
      payment: 'المدفوعات',
      financial: 'المالية',
      maintenance: 'الصيانة',
      legal: 'القانونية',
      agreement: 'العقود',
      admin: 'الإدارة',
      system: 'النظام'
    };
    return labels[type] || type;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMs = now.getTime() - activityTime.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
    return `منذ ${diffInDays} يوم`;
  };

  return (
    <PageContainer
      title="سجل النشاط الشامل"
      description="مراقبة وتتبع جميع أنشطة النظام والمستخدمين"
    >
      <div dir="rtl">
        <PageHeader
          title="سجل النشاط الشامل للنظام"
          subtitle="مراقبة وتتبع جميع العمليات والتغييرات في النظام مع تفاصيل المستخدمين"
          icon={<Activity className="w-6 h-6 text-blue-500" />}
          align="right"
          dir="rtl"
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">إجمالي الأنشطة</p>
                  <p className="text-2xl font-bold">{activities.length}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">أنشطة اليوم</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalToday}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">تحذيرات وأخطاء</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.errorsAndWarnings}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">المستخدمين النشطين</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.activeUsers}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center justify-between flex-row-reverse">
              <div className="flex items-center gap-2 flex-row-reverse">
                <Badge variant="secondary" className="text-right">
                  {activities.length} نشاط
                </Badge>
                <button
                  onClick={() => {
                    loadSystemActivities();
                    loadActivityStats();
                  }}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isLoading ? "جاري التحديث..." : "تحديث"}
                </button>
              </div>
              <span>سجل الأنشطة المفصل</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">جاري تحميل سجل النشاط...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>لا توجد أنشطة في النظام</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${getSeverityColor(activity.severity)}`}
                  >
                    <div className="flex items-start gap-4 flex-row-reverse">
                      {/* Main Content */}
                      <div className="flex-1 text-right">
                        {/* Header */}
                        <div className="flex items-center justify-between flex-row-reverse mb-2">
                          <span className="text-sm text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)} • {format(new Date(activity.timestamp), 'PPP p', { locale: ar })}
                          </span>
                          <div className="flex items-center gap-2 flex-row-reverse">
                            {getSeverityIcon(activity.severity)}
                            <Badge variant="outline" className={`text-xs ${getActivityColor(activity.type)}`}>
                              {getTypeLabel(activity.type)}
                            </Badge>
                          </div>
                        </div>

                        {/* Description */}
                        <h3 className="font-semibold text-right mb-2">{activity.description}</h3>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {/* User Info */}
                          <div className="text-right">
                            <span className="text-muted-foreground">المستخدم: </span>
                            <span className="font-medium">{activity.user_name} ({activity.user_role})</span>
                          </div>

                          {/* Entity Info */}
                          {activity.entity_id && (
                            <div className="text-right">
                              <span className="text-muted-foreground">المعرف: </span>
                              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{activity.entity_id}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Icon */}
                      <div className={`p-3 rounded-full ${getActivityColor(activity.type)} flex-shrink-0`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ActivityPage; 