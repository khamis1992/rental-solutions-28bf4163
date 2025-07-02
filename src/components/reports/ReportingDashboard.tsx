// @ts-nocheck
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Settings, 
  Play,
  Pause,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Share,
  Filter,
  Search,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Activity,
  Brain,
  CheckCircle,
  AlertTriangle,
  Loader
} from 'lucide-react';
import { advancedReporting, ReportTemplate, GeneratedReport, ExportOptions } from '@/services/advanced-reporting';

interface ReportingDashboardProps {
  className?: string;
}

const ReportingDashboard: React.FC<ReportingDashboardProps> = ({ className }) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const isArabic = document.dir === 'rtl' || document.documentElement.lang === 'ar';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    loadReportingData();
  }, []);

  const loadReportingData = async () => {
    try {
      setIsLoading(true);
      
      const templatesData = advancedReporting.getTemplates();
      const reportsData = advancedReporting.getGeneratedReports();

      setTemplates(templatesData);
      setGeneratedReports(reportsData);
    } catch (error) {
      console.error('Failed to load reporting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    setIsGenerating(prev => new Set(prev).add(templateId));
    
    try {
      const options: ExportOptions = {
        format: 'pdf',
        dateRange: {
          start: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
          end: Date.now()
        },
        includeCharts: true,
        includeRawData: false,
        compression: true
      };

      const report = await advancedReporting.generateReport(templateId, options);
      
      // Refresh reports list
      const updatedReports = advancedReporting.getGeneratedReports();
      setGeneratedReports(updatedReports);
      
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(prev => {
        const newSet = new Set(prev);
        newSet.delete(templateId);
        return newSet;
      });
    }
  };

  const handleQuickExport = async (dataType: string, format: 'pdf' | 'excel' | 'csv' | 'json') => {
    try {
      const options: ExportOptions = {
        format,
        dateRange: {
          start: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
          end: Date.now()
        },
        includeCharts: format === 'pdf',
        includeRawData: true,
        compression: true
      };

      const report = await advancedReporting.exportData(dataType, options);
      
      // Refresh reports list
      const updatedReports = advancedReporting.getGeneratedReports();
      setGeneratedReports(updatedReports);
      
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const toggleTemplateSchedule = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && template.schedule) {
      const updated = advancedReporting.updateTemplate(templateId, {
        schedule: {
          ...template.schedule,
          isActive: !template.schedule.isActive
        }
      });
      
      if (updated) {
        setTemplates(prev => prev.map(t => t.id === templateId ? updated : t));
      }
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Activity className="w-4 h-4" />;
      case 'user_behavior': return <Users className="w-4 h-4" />;
      case 'business': return <TrendingUp className="w-4 h-4" />;
      case 'ai_insights': return <Brain className="w-4 h-4" />;
      case 'comprehensive': return <BarChart3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'generating': return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatSchedule = (schedule: any): string => {
    if (!schedule) return isArabic ? 'غير مجدول' : 'Not scheduled';
    
    const { frequency, time, dayOfWeek, dayOfMonth } = schedule;
    
    if (isArabic) {
      switch (frequency) {
        case 'daily': return `يومياً في ${time}`;
        case 'weekly': return `أسبوعياً في ${time}`;
        case 'monthly': return `شهرياً في ${time}`;
        case 'quarterly': return `ربع سنوي في ${time}`;
        default: return 'غير محدد';
      }
    } else {
      switch (frequency) {
        case 'daily': return `Daily at ${time}`;
        case 'weekly': return `Weekly at ${time}`;
        case 'monthly': return `Monthly at ${time}`;
        case 'quarterly': return `Quarterly at ${time}`;
        default: return 'Not specified';
      }
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const TemplateCard: React.FC<{ template: ReportTemplate }> = ({ template }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {getReportTypeIcon(template.type)}
            <CardTitle className="text-lg">{template.name}</CardTitle>
          </div>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Badge variant={template.isActive ? 'default' : 'secondary'}>
              {template.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Inactive')}
            </Badge>
            {template.schedule && (
              <Badge variant={template.schedule.isActive ? 'default' : 'outline'}>
                {template.schedule.isActive ? (isArabic ? 'مجدول' : 'Scheduled') : (isArabic ? 'غير مجدول' : 'Unscheduled')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">{template.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'النوع:' : 'Type:'}</span>
            <span className="capitalize">{template.type.replace('_', ' ')}</span>
          </div>
          
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'التنسيق:' : 'Format:'}</span>
            <span className="uppercase">{template.format}</span>
          </div>
          
          <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'الأقسام:' : 'Sections:'}</span>
            <span>{template.sections.length}</span>
          </div>
          
          {template.schedule && (
            <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'الجدولة:' : 'Schedule:'}</span>
              <span>{formatSchedule(template.schedule)}</span>
            </div>
          )}
          
          {template.lastGenerated && (
            <div className={`flex items-center justify-between text-sm ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'آخر إنشاء:' : 'Last Generated:'}</span>
              <span>{new Date(template.lastGenerated).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Button
            size="sm"
            onClick={() => handleGenerateReport(template.id)}
            disabled={isGenerating.has(template.id)}
            className="touch-friendly"
          >
            {isGenerating.has(template.id) ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isArabic ? 'إنشاء' : 'Generate'}
          </Button>
          
          {template.schedule && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleTemplateSchedule(template.id)}
              className="touch-friendly"
            >
              {template.schedule.isActive ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {template.schedule.isActive ? 
                (isArabic ? 'إيقاف' : 'Pause') : 
                (isArabic ? 'تشغيل' : 'Resume')
              }
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedTemplate(template.id)}
            className="touch-friendly"
          >
            <Eye className="w-4 h-4" />
            {isArabic ? 'عرض' : 'View'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const ReportCard: React.FC<{ report: GeneratedReport }> = ({ report }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className={`flex items-center justify-between mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {getStatusIcon(report.status)}
            <span className="font-medium text-sm">{report.title}</span>
          </div>
          <Badge variant="outline" className="text-xs uppercase">
            {report.format}
          </Badge>
        </div>
        
        <div className="space-y-1 mb-3">
          <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'تاريخ الإنشاء:' : 'Generated:'}</span>
            <span>{new Date(report.generatedAt).toLocaleString()}</span>
          </div>
          
          {report.size > 0 && (
            <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-600">{isArabic ? 'الحجم:' : 'Size:'}</span>
              <span>{formatFileSize(report.size)}</span>
            </div>
          )}
          
          <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'نقاط البيانات:' : 'Data Points:'}</span>
            <span>{report.metadata.dataPoints.toLocaleString()}</span>
          </div>
          
          <div className={`flex items-center justify-between text-xs ${isArabic ? 'flex-row-reverse' : ''}`}>
            <span className="text-gray-600">{isArabic ? 'الأقسام:' : 'Sections:'}</span>
            <span>{report.metadata.sections}</span>
          </div>
        </div>
        
        {report.status === 'generating' && (
          <div className="mb-3">
            <Progress value={Math.random() * 100} className="h-2" />
            <p className="text-xs text-gray-600 mt-1">
              {isArabic ? 'جاري الإنشاء...' : 'Generating...'}
            </p>
          </div>
        )}
        
        {report.error && (
          <Alert className="mb-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {report.error}
            </AlertDescription>
          </Alert>
        )}
        
        {report.status === 'completed' && report.downloadUrl && (
          <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Button size="sm" className="touch-friendly">
              <Download className="w-4 h-4" />
              {isArabic ? 'تحميل' : 'Download'}
            </Button>
            
            <Button size="sm" variant="outline" className="touch-friendly">
              <Share className="w-4 h-4" />
              {isArabic ? 'مشاركة' : 'Share'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 animate-pulse" />
          <span>{isArabic ? 'جاري تحميل التقارير...' : 'Loading reports...'}</span>
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
            {isArabic ? 'لوحة التقارير المتقدمة' : 'Advanced Reporting Dashboard'}
          </h2>
          <p className="text-gray-600">
            {isArabic ? 'إنشاء وإدارة التقارير التلقائية والمخصصة' : 'Generate and manage automated and custom reports'}
          </p>
        </div>
        
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="outline"
            size="sm"
            onClick={loadReportingData}
            className="touch-friendly"
          >
            <RefreshCw className="w-4 h-4" />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
          
          <Button size="sm" className="touch-friendly">
            <Plus className="w-4 h-4" />
            {isArabic ? 'قالب جديد' : 'New Template'}
          </Button>
        </div>
      </div>

      {/* Quick Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <Download className="w-5 h-5" />
            {isArabic ? 'تصدير سريع' : 'Quick Export'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              onClick={() => handleQuickExport('performance', 'pdf')}
              className="touch-friendly"
            >
              <Activity className="w-4 h-4 mr-2" />
              {isArabic ? 'تقرير الأداء' : 'Performance Report'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickExport('user_behavior', 'excel')}
              className="touch-friendly"
            >
              <Users className="w-4 h-4 mr-2" />
              {isArabic ? 'سلوك المستخدمين' : 'User Behavior'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickExport('ai_insights', 'pdf')}
              className="touch-friendly"
            >
              <Brain className="w-4 h-4 mr-2" />
              {isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handleQuickExport('performance', 'csv')}
              className="touch-friendly"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {isArabic ? 'بيانات خام' : 'Raw Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'text-xs' : ''}`}>
          <TabsTrigger value="templates">
            {isArabic ? 'القوالب' : 'Templates'}
          </TabsTrigger>
          <TabsTrigger value="reports">
            {isArabic ? 'التقارير' : 'Reports'}
          </TabsTrigger>
          <TabsTrigger value="schedule">
            {isArabic ? 'الجدولة' : 'Schedule'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Search and Filter */}
          <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isArabic ? 'البحث في القوالب...' : 'Search templates...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isArabic ? 'جميع الأنواع' : 'All Types'}</option>
              <option value="performance">{isArabic ? 'الأداء' : 'Performance'}</option>
              <option value="user_behavior">{isArabic ? 'سلوك المستخدمين' : 'User Behavior'}</option>
              <option value="business">{isArabic ? 'الأعمال' : 'Business'}</option>
              <option value="ai_insights">{isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}</option>
              <option value="comprehensive">{isArabic ? 'شامل' : 'Comprehensive'}</option>
            </select>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد قوالب تطابق البحث' : 'No templates match your search'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {generatedReports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {isArabic ? 'لا توجد تقارير منشأة بعد' : 'No reports generated yet'}
                </p>
                <Button className="mt-4" onClick={() => handleGenerateReport(templates[0]?.id)}>
                  {isArabic ? 'إنشاء أول تقرير' : 'Generate First Report'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generatedReports.slice(0, 12).map(report => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <Calendar className="w-5 h-5" />
                {isArabic ? 'التقارير المجدولة' : 'Scheduled Reports'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.filter(t => t.schedule).map(template => (
                  <div key={template.id} className={`flex items-center justify-between p-4 border rounded-lg ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      {getReportTypeIcon(template.type)}
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-gray-600">{formatSchedule(template.schedule)}</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                      <Badge variant={template.schedule?.isActive ? 'default' : 'secondary'}>
                        {template.schedule?.isActive ? 
                          (isArabic ? 'نشط' : 'Active') : 
                          (isArabic ? 'معطل' : 'Inactive')
                        }
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTemplateSchedule(template.id)}
                        className="touch-friendly"
                      >
                        {template.schedule?.isActive ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="touch-friendly"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {templates.filter(t => t.schedule).length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {isArabic ? 'لا توجد تقارير مجدولة' : 'No scheduled reports'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportingDashboard; 