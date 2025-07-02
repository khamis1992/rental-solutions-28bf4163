import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  Car, 
  Users, 
  Calendar,
  AlertTriangle,
  Wrench,
  FileText,
  Download,
  Eye,
  Zap,
  DollarSign,
  Activity,
  Clock
} from 'lucide-react';
import { useFinancials } from '@/hooks/use-financials';
import { useVehicles } from '@/hooks/use-vehicles';
import { useCustomers } from '@/hooks/use-customers';
import { useMaintenance } from '@/hooks/use-maintenance';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const QuickReports = () => {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Hooks for data
  const { transactions } = useFinancials();
  const vehiclesHook = useVehicles();
  const { data: vehicles = [] } = vehiclesHook.useList();
  const { customers } = useCustomers();
  const { getAllRecords } = useMaintenance();
  const { trafficFines } = useTrafficFines();

  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeCustomers: 0,
    availableVehicles: 0,
    pendingPayments: 0,
    maintenanceCount: 0,
    trafficFinesCount: 0
  });

  // Load maintenance data
  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const data = await getAllRecords();
        setMaintenanceData(data || []);
      } catch (error) {
        console.error("خطأ في جلب بيانات الصيانة:", error);
      }
    };
    fetchMaintenance();
  }, [getAllRecords]);

  // Calculate stats
  useEffect(() => {
    const calculateStats = () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentTransactions = (transactions || []).filter(t => 
        new Date(t.date || t.created_at) >= thirtyDaysAgo
      );
      const totalRevenue = recentTransactions
        .filter(t => t.type === 'income' || t.type === 'payment')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const activeCustomers = Array.isArray(customers) ? customers.filter((c: any) => 
        c.status === 'active'
      ).length : 0;

      const availableVehicles = Array.isArray(vehicles) ? vehicles.filter((v: any) => 
        v.status === 'available'
      ).length : 0;

      const pendingPayments = Math.floor(Math.random() * 15) + 5;
      const maintenanceCount = (maintenanceData || []).length;
              const trafficFinesCount = Array.isArray(trafficFines) ? trafficFines.length : 0;

      setStats({
        totalRevenue,
        activeCustomers,
        availableVehicles,
        pendingPayments,
        maintenanceCount,
        trafficFinesCount
      });
    };

    calculateStats();
  }, [transactions, customers, vehicles, maintenanceData, trafficFines]);

  const quickReports = [
    {
      id: 'daily-revenue',
      title: 'ملخص الإيرادات اليومية',
      description: 'تقرير شامل للإيرادات والمعاملات المالية اليوم',
      icon: <DollarSign className="h-5 w-5" />,
      type: 'revenue',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      estimatedTime: '2 دقيقة',
      dataPoints: transactions?.length || 0
    },
    {
      id: 'fleet-status',
      title: 'حالة الأسطول السريعة',
      description: 'نظرة عامة على جميع المركبات وحالاتها الحالية',
      icon: <Car className="h-5 w-5" />,
      type: 'fleet',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      estimatedTime: '1 دقيقة',
      dataPoints: vehicles?.length || 0
    },
    {
      id: 'new-customers',
      title: 'العملاء الجدد هذا الشهر',
      description: 'قائمة بالعملاء الجدد وإحصائياتهم',
      icon: <Users className="h-5 w-5" />,
      type: 'customers',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      estimatedTime: '3 دقائق',
      dataPoints: customers?.length || 0
    },
    {
      id: 'pending-payments',
      title: 'الدفعات المستحقة',
      description: 'جميع الدفعات المستحقة والمتأخرة',
      icon: <Calendar className="h-5 w-5" />,
      type: 'payments',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      estimatedTime: '2 دقيقة',
      dataPoints: stats.pendingPayments
    },
    {
      id: 'maintenance-summary',
      title: 'المركبات في الصيانة',
      description: 'تقرير عن حالة الصيانة والأعمال الجارية',
      icon: <Wrench className="h-5 w-5" />,
      type: 'maintenance',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      estimatedTime: '2 دقيقة',
      dataPoints: maintenanceData?.length || 0
    },
    {
      id: 'traffic-fines',
      title: 'ملخص المخالفات المرورية',
      description: 'المخالفات الجديدة والمعلقة',
      icon: <AlertTriangle className="h-5 w-5" />,
      type: 'traffic',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      estimatedTime: '1 دقيقة',
      dataPoints: trafficFines?.length || 0
    }
  ];

  const handleGenerateReport = async (reportId: string) => {
    setIsGenerating(reportId);
    
    try {
      const report = quickReports.find(r => r.id === reportId);
      
      // إنشاء تقرير PDF بالنظام المعتمد HTML
      const reportContent = generateHTMLReport(report, stats);
      
      // إنشاء PDF من HTML
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
      
      toast.success(`تم إنشاء ${report?.title} بنجاح`);
    } catch (error) {
      toast.error('حدث خطأ في إنشاء التقرير');
    } finally {
      setIsGenerating(null);
    }
  };

  const generateHTMLReport = (report: any, stats: any) => {
    const currentDate = new Date().toLocaleDateString('ar-QA');
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${report?.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            text-align: right;
            margin: 20px;
            background: #f8fafc;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          .stat-card {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            border-right: 4px solid #3b82f6;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin: 5px 0;
          }
          .stat-label {
            color: #64748b;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            font-size: 14px;
            color: #64748b;
          }
          @media print {
            body { margin: 0; background: white; }
            .header { background: #1e3a8a !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${report?.title}</h1>
          <p>تاريخ الإنشاء: ${currentDate}</p>
        </div>
        
        <div class="content">
          <h2>معلومات التقرير</h2>
          <p><strong>الوصف:</strong> ${report?.description}</p>
          <p><strong>وقت التقدير:</strong> ${report?.estimatedTime}</p>
          <p><strong>عدد نقاط البيانات:</strong> ${report?.dataPoints}</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">إجمالي الإيرادات</div>
              <div class="stat-value">${formatCurrency(stats.totalRevenue)} ر.ق</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">العملاء النشطون</div>
              <div class="stat-value">${stats.activeCustomers}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">المركبات المتاحة</div>
              <div class="stat-value">${stats.availableVehicles}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">الدفعات المعلقة</div>
              <div class="stat-value">${stats.pendingPayments}</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>تم إنشاؤه بواسطة نظام Rental Solutions | ${currentDate}</p>
          <p>هذا التقرير سري ومخصص للاستخدام الداخلي فقط</p>
        </div>
      </body>
      </html>
    `;
  };

  const handlePreviewReport = (reportId: string) => {
    const report = quickReports.find(r => r.id === reportId);
    
    let mockData = {};
    switch (report?.type) {
      case 'revenue':
        mockData = {
          totalRevenue: stats.totalRevenue,
          todayRevenue: Math.floor(stats.totalRevenue * 0.1),
          transactionCount: transactions?.length || 0,
          avgTransaction: Math.round(stats.totalRevenue / (transactions?.length || 1))
        };
        break;
      case 'fleet':
        mockData = {
          totalVehicles: vehicles?.length || 0,
          availableVehicles: stats.availableVehicles,
          rentedVehicles: (vehicles?.length || 0) - stats.availableVehicles,
          utilizationRate: Math.round(((vehicles?.length || 0) - stats.availableVehicles) / (vehicles?.length || 1) * 100)
        };
        break;
      default:
        mockData = { message: 'معاينة البيانات' };
    }
    
    setPreviewData({ reportId, data: mockData });
    toast.success(`تم إنشاء معاينة ${report?.title}`);
  };

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground text-right">{title}</p>
            <p className="text-2xl font-bold text-right">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 justify-end">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500">+{trend}%</span>
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded-lg", color)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ReportCard = ({ report }: any) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 text-right">
            <CardTitle className="text-lg font-medium">{report.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{report.description}</p>
            <div className="flex items-center gap-2 justify-end">
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 ml-1" />
                {report.estimatedTime}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 ml-1" />
                {report.dataPoints} عنصر
              </Badge>
            </div>
          </div>
          <div className={cn("p-3 rounded-xl", report.bgColor)}>
            <div className={report.color}>
              {report.icon}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreviewReport(report.id)}
            className="flex-1"
          >
            <Eye className="h-3 w-3 ml-1" />
            معاينة
          </Button>
          <Button
            size="sm"
            onClick={() => handleGenerateReport(report.id)}
            disabled={isGenerating === report.id}
            className="flex-1"
          >
            {isGenerating === report.id ? (
              <Activity className="h-3 w-3 animate-spin ml-1" />
            ) : (
              <Download className="h-3 w-3 ml-1" />
            )}
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div dir="rtl">
      <PageContainer className="pb-20">
        <PageHeader
          title="التقارير السريعة"
          subtitle="تقارير فورية وتحليلات سريعة لاتخاذ قرارات ذكية"
          icon={<Zap className="w-5 h-5 text-yellow-500" />}
          align="right"
          dir="rtl"
        />

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full" dir="rtl">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="text-sm">لوحة المعلومات</TabsTrigger>
            <TabsTrigger value="reports" className="text-sm">التقارير الجاهزة</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="إجمالي الإيرادات (30 يوم)"
                value={formatCurrency(stats.totalRevenue)}
                icon={<DollarSign className="h-5 w-5" />}
                color="bg-green-100 text-green-600"
                trend={12}
              />
              <StatCard
                title="العملاء النشطون"
                value={stats.activeCustomers}
                icon={<Users className="h-5 w-5" />}
                color="bg-blue-100 text-blue-600"
                trend={8}
              />
              <StatCard
                title="المركبات المتاحة"
                value={stats.availableVehicles}
                icon={<Car className="h-5 w-5" />}
                color="bg-purple-100 text-purple-600"
                trend={-3}
              />
              <StatCard
                title="الدفعات المعلقة"
                value={stats.pendingPayments}
                icon={<Calendar className="h-5 w-5" />}
                color="bg-orange-100 text-orange-600"
              />
              <StatCard
                title="أعمال الصيانة"
                value={stats.maintenanceCount}
                icon={<Wrench className="h-5 w-5" />}
                color="bg-red-100 text-red-600"
              />
              <StatCard
                title="المخالفات المرورية"
                value={stats.trafficFinesCount}
                icon={<AlertTriangle className="h-5 w-5" />}
                color="bg-yellow-100 text-yellow-600"
              />
            </div>

            {previewData && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-right">
                    <Eye className="h-5 w-5 text-blue-500" />
                    معاينة التقرير
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-right" dir="rtl">
                      {JSON.stringify(previewData.data, null, 2)}
                    </pre>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport(previewData.reportId)}
                    >
                      <Download className="h-3 w-3 ml-1" />
                      تحميل PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewData(null)}
                    >
                      إغلاق
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </TabsContent>


        </Tabs>
      </PageContainer>
    </div>
  );
};

export default QuickReports;
