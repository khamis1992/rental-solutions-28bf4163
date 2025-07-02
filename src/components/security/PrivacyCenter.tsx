import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  User, 
  FileText, 
  Download, 
  Trash2, 
  Edit, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  Calendar,
  Database,
  Lock,
  Unlock,
  Settings,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Globe,
  Users,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { complianceManager, DataPrivacyRequest, DataProcessingActivity } from '@/services/compliance-manager';

interface PrivacyCenterProps {
  className?: string;
}

const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ className }) => {
  const [privacyRequests, setPrivacyRequests] = useState<DataPrivacyRequest[]>([]);
  const [processingActivities, setProcessingActivities] = useState<DataProcessingActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('requests');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadPrivacyData();
  }, []);

  const loadPrivacyData = async () => {
    try {
      setIsLoading(true);
      
      // Load privacy requests
      const requests = complianceManager.getPrivacyRequests();
      setPrivacyRequests(requests);
      
      // Load processing activities
      const activities = complianceManager.getProcessingActivities();
      setProcessingActivities(activities);
      
    } catch (error) {
      console.error('Failed to load privacy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'access': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'rectification': return <Edit className="w-4 h-4 text-yellow-500" />;
      case 'erasure': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'portability': return <Download className="w-4 h-4 text-green-500" />;
      case 'restriction': return <Lock className="w-4 h-4 text-orange-500" />;
      case 'objection': return <XCircle className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'received': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      case 'extended': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'very_high': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));

    if (days > 0) return isArabic ? `منذ ${days} أيام` : `${days}d ago`;
    if (hours > 0) return isArabic ? `منذ ${hours} ساعات` : `${hours}h ago`;
    if (minutes > 0) return isArabic ? `منذ ${minutes} دقائق` : `${minutes}m ago`;
    return isArabic ? 'الآن' : 'now';
  };

  const formatDueDate = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days < 0) return isArabic ? 'متأخر' : 'Overdue';
    if (days === 0) return isArabic ? 'اليوم' : 'Today';
    if (days === 1) return isArabic ? 'غداً' : 'Tomorrow';
    return isArabic ? `خلال ${days} أيام` : `${days} days`;
  };

  const getRequestTypeLabel = (type: string) => {
    const labels = {
      access: isArabic ? 'الوصول للبيانات' : 'Data Access',
      rectification: isArabic ? 'تصحيح البيانات' : 'Data Rectification',
      erasure: isArabic ? 'حذف البيانات' : 'Data Erasure',
      portability: isArabic ? 'نقل البيانات' : 'Data Portability',
      restriction: isArabic ? 'تقييد المعالجة' : 'Processing Restriction',
      objection: isArabic ? 'الاعتراض على المعالجة' : 'Processing Objection'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      received: isArabic ? 'مستلم' : 'Received',
      processing: isArabic ? 'قيد المعالجة' : 'Processing',
      completed: isArabic ? 'مكتمل' : 'Completed',
      rejected: isArabic ? 'مرفوض' : 'Rejected',
      extended: isArabic ? 'ممدد' : 'Extended'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const filteredRequests = privacyRequests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    const matchesSearch = searchTerm === '' || 
      request.subjectEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const PrivacyMetricsCard = () => {
    const totalRequests = privacyRequests.length;
    const pendingRequests = privacyRequests.filter(r => r.status === 'processing' || r.status === 'received').length;
    const completedRequests = privacyRequests.filter(r => r.status === 'completed').length;
    const overdueRequests = privacyRequests.filter(r => r.dueDate < Date.now() && r.status !== 'completed').length;
    
    const completionRate = totalRequests > 0 ? (completedRequests / totalRequests) * 100 : 0;

    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={isArabic ? 'text-right' : 'text-left'}>
              <h3 className="text-lg font-semibold mb-4">
                {isArabic ? 'مقاييس الخصوصية' : 'Privacy Metrics'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {totalRequests}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'إجمالي الطلبات' : 'Total Requests'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {pendingRequests}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'طلبات معلقة' : 'Pending'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {completedRequests}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'طلبات مكتملة' : 'Completed'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {overdueRequests}
                  </div>
                  <div className="text-sm text-gray-600">
                    {isArabic ? 'طلبات متأخرة' : 'Overdue'}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-6xl">🔒</div>
          </div>
          
          <div className="mt-4">
            <div className={`flex items-center justify-between text-sm mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span>{isArabic ? 'معدل الإنجاز' : 'Completion Rate'}</span>
              <span className="font-medium">{completionRate.toFixed(1)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  };

  const PrivacyRequestCard: React.FC<{ request: DataPrivacyRequest }> = ({ request }) => {
    const isOverdue = request.dueDate < Date.now() && request.status !== 'completed';
    
    return (
      <Card className={`border-l-4 ${getStatusColor(request.status)} ${isOverdue ? 'bg-red-50' : ''}`}>
        <CardContent className="p-4">
          <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              {getRequestTypeIcon(request.type)}
              <span className="font-medium text-sm">{getRequestTypeLabel(request.type)}</span>
            </div>
            <Badge variant="outline" className={`text-xs ${getStatusColor(request.status)}`}>
              {getStatusLabel(request.status)}
            </Badge>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'البريد الإلكتروني:' : 'Email:'}</span>
              <span className="font-medium">{request.subjectEmail}</span>
            </div>
            
            <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'تاريخ الطلب:' : 'Request Date:'}</span>
              <span className="font-medium">{formatTimeAgo(request.requestDate)}</span>
            </div>
            
            <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span>
              <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                {formatDueDate(request.dueDate)}
              </span>
            </div>
            
            {request.assignedTo && (
              <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-600">{isArabic ? 'مُعيَّن إلى:' : 'Assigned to:'}</span>
                <span className="font-medium">{request.assignedTo}</span>
              </div>
            )}
          </div>
          
          {request.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{request.description}</p>
          )}
          
          {request.dataCategories.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">
                {isArabic ? 'فئات البيانات:' : 'Data Categories:'}
              </p>
              <div className="flex flex-wrap gap-1">
                {request.dataCategories.slice(0, 3).map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
                {request.dataCategories.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{request.dataCategories.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              {request.status === 'processing' && (
                <>
                  <Button size="sm" variant="default" className="text-xs touch-friendly">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {isArabic ? 'إكمال' : 'Complete'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs touch-friendly">
                    <XCircle className="w-3 h-3 mr-1" />
                    {isArabic ? 'رفض' : 'Reject'}
                  </Button>
                </>
              )}
            </div>
            
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {isArabic ? 'متأخر' : 'Overdue'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProcessingActivityCard: React.FC<{ activity: DataProcessingActivity }> = ({ activity }) => (
    <Card className={`border-l-4 ${getRiskLevelColor(activity.riskLevel)}`}>
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Database className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">{activity.name}</span>
          </div>
          <Badge variant="outline" className={`text-xs ${getRiskLevelColor(activity.riskLevel)}`}>
            {activity.riskLevel.replace('_', ' ')}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{activity.description}</p>
        
        <div className="space-y-2 mb-3">
          <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'الغرض:' : 'Purpose:'}</span>
            <span className="font-medium">{activity.purpose}</span>
          </div>
          
          <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'الأساس القانوني:' : 'Legal Basis:'}</span>
            <span className="font-medium">{activity.legalBasis}</span>
          </div>
          
          <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'فترة الاحتفاظ:' : 'Retention:'}</span>
            <span className="font-medium">{Math.floor(activity.retentionPeriod / 365)} {isArabic ? 'سنوات' : 'years'}</span>
          </div>
          
          <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'المالك:' : 'Owner:'}</span>
            <span className="font-medium">{activity.owner}</span>
          </div>
        </div>
        
        {activity.dataCategories.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">
              {isArabic ? 'فئات البيانات:' : 'Data Categories:'}
            </p>
            <div className="flex flex-wrap gap-1">
              {activity.dataCategories.slice(0, 3).map((category, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
              {activity.dataCategories.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{activity.dataCategories.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className={`flex items-center justify-between text-xs text-gray-500 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <span>{isArabic ? 'آخر مراجعة:' : 'Last reviewed:'} {formatTimeAgo(activity.lastReviewed)}</span>
          <Badge variant={activity.status === 'active' ? 'default' : 'secondary'} className="text-xs">
            {activity.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const NewRequestForm = () => {
    const [formData, setFormData] = useState({
      type: 'access',
      subjectEmail: '',
      description: '',
      dataCategories: [] as string[]
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        await complianceManager.submitPrivacyRequest({
          ...formData,
          subjectId: `user_${Date.now()}`,
          processingActivities: []
        });
        
        setShowNewRequestForm(false);
        setFormData({ type: 'access', subjectEmail: '', description: '', dataCategories: [] });
        loadPrivacyData();
      } catch (error) {
        console.error('Failed to submit privacy request:', error);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Plus className="w-5 h-5" />
            {isArabic ? 'طلب خصوصية جديد' : 'New Privacy Request'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {isArabic ? 'نوع الطلب' : 'Request Type'}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="access">{getRequestTypeLabel('access')}</option>
                <option value="rectification">{getRequestTypeLabel('rectification')}</option>
                <option value="erasure">{getRequestTypeLabel('erasure')}</option>
                <option value="portability">{getRequestTypeLabel('portability')}</option>
                <option value="restriction">{getRequestTypeLabel('restriction')}</option>
                <option value="objection">{getRequestTypeLabel('objection')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={formData.subjectEmail}
                onChange={(e) => setFormData({ ...formData, subjectEmail: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                {isArabic ? 'الوصف' : 'Description'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>
            
            <div className={`flex gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Button type="submit" className="touch-friendly">
                {isArabic ? 'إرسال الطلب' : 'Submit Request'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowNewRequestForm(false)}
                className="touch-friendly"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 animate-pulse" />
          <span>{isArabic ? 'جاري تحميل بيانات الخصوصية...' : 'Loading privacy data...'}</span>
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
            {isArabic ? 'مركز الخصوصية' : 'Privacy Center'}
          </h2>
          <p className="text-gray-600">
            {isArabic ? 'إدارة طلبات الخصوصية وأنشطة معالجة البيانات' : 'Manage privacy requests and data processing activities'}
          </p>
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="default"
            onClick={() => setShowNewRequestForm(true)}
            className="touch-friendly"
          >
            <Plus className="w-4 h-4" />
            {isArabic ? 'طلب جديد' : 'New Request'}
          </Button>
          
          <Button
            variant="outline"
            onClick={loadPrivacyData}
            disabled={isLoading}
            className="touch-friendly"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Privacy Metrics Overview */}
      <PrivacyMetricsCard />

      {/* New Request Form */}
      {showNewRequestForm && <NewRequestForm />}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="requests">
            {isArabic ? 'طلبات الخصوصية' : 'Privacy Requests'}
          </TabsTrigger>
          <TabsTrigger value="activities">
            {isArabic ? 'أنشطة المعالجة' : 'Processing Activities'}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            {isArabic ? 'التحليلات' : 'Analytics'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <div className={`flex flex-wrap items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder={isArabic ? 'البحث...' : 'Search...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isArabic ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="received">{getStatusLabel('received')}</option>
              <option value="processing">{getStatusLabel('processing')}</option>
              <option value="completed">{getStatusLabel('completed')}</option>
              <option value="rejected">{getStatusLabel('rejected')}</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isArabic ? 'جميع الأنواع' : 'All Types'}</option>
              <option value="access">{getRequestTypeLabel('access')}</option>
              <option value="rectification">{getRequestTypeLabel('rectification')}</option>
              <option value="erasure">{getRequestTypeLabel('erasure')}</option>
              <option value="portability">{getRequestTypeLabel('portability')}</option>
              <option value="restriction">{getRequestTypeLabel('restriction')}</option>
              <option value="objection">{getRequestTypeLabel('objection')}</option>
            </select>
          </div>

          {/* Privacy Requests */}
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد طلبات خصوصية' : 'No privacy requests found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRequests.map(request => (
                <PrivacyRequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          {processingActivities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد أنشطة معالجة' : 'No processing activities found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {processingActivities.map(activity => (
                <ProcessingActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Privacy Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {privacyRequests.filter(r => r.type === 'access').length}
                </div>
                <div className="text-sm text-gray-600">
                  {isArabic ? 'طلبات الوصول' : 'Access Requests'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <PieChart className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {privacyRequests.filter(r => r.type === 'erasure').length}
                </div>
                <div className="text-sm text-gray-600">
                  {isArabic ? 'طلبات الحذف' : 'Erasure Requests'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {processingActivities.filter(a => a.riskLevel === 'high' || a.riskLevel === 'very_high').length}
                </div>
                <div className="text-sm text-gray-600">
                  {isArabic ? 'أنشطة عالية المخاطر' : 'High Risk Activities'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(privacyRequests.reduce((sum, r) => {
                    if (r.completedDate) {
                      return sum + (r.completedDate - r.requestDate) / (24 * 60 * 60 * 1000);
                    }
                    return sum;
                  }, 0) / privacyRequests.filter(r => r.completedDate).length || 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {isArabic ? 'متوسط أيام الإنجاز' : 'Avg. Days to Complete'}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrivacyCenter; 