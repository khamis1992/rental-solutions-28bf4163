import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, TrendingUp, TrendingDown, AlertTriangle, Users, Car, DollarSign, FileText, Calendar, Target, Shield, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { financialManager } from '@/lib/financial/financial-manager';
import { salesManager } from '@/lib/sales/sales-manager';
import { securityManager } from '@/lib/security/security-manager';
import { supabase } from '@/lib/supabase';
import { errorLogger } from '@/lib/errors/error-logger';

interface ExecutiveSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalCustomers: number;
  activeAgreements: number;
  totalVehicles: number;
  availableVehicles: number;
  overduePayments: number;
  maintenanceAlerts: number;
  legalCases: number;
  securityAlerts: number;
  salesLeads: number;
  conversionRate: number;
  customerSatisfaction: number;
}

interface KPIMetrics {
  revenueGrowth: number;
  customerGrowth: number;
  vehicleUtilization: number;
  paymentEfficiency: number;
  operationalEfficiency: number;
  profitMargin: number;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'financial' | 'operations' | 'security' | 'legal' | 'maintenance';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface BoardReport {
  period: string;
  executiveSummary: ExecutiveSummary;
  kpiMetrics: KPIMetrics;
  financialAnalysis: any;
  operationalHighlights: string[];
  riskAssessment: string[];
  recommendations: string[];
  futureOutlook: string[];
}

export const ExecutiveDashboard: React.FC = () => {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [chartData, setChartData] = useState<any[]>([]);
  const [boardReport, setBoardReport] = useState<BoardReport | null>(null);

  useEffect(() => {
    loadExecutiveData();
    const interval = setInterval(loadExecutiveData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadExecutiveData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [summaryData, kpiData, alertsData, chartData, reportData] = await Promise.all([
        loadExecutiveSummary(),
        loadKPIMetrics(),
        loadAlerts(),
        loadChartData(),
        generateBoardReport()
      ]);

      setSummary(summaryData);
      setKpiMetrics(kpiData);
      setAlerts(alertsData);
      setChartData(chartData);
      setBoardReport(reportData);
    } catch (error) {
      errorLogger.logError(error as Error, {
        context: 'ExecutiveDashboard.loadExecutiveData',
        selectedPeriod,
        timestamp: new Date().toISOString()
      });
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadExecutiveSummary = async (): Promise<ExecutiveSummary> => {
    const startDate = getStartDate(selectedPeriod);
    const endDate = new Date();

    // Financial data
    const financialReport = await financialManager.generateReport('monthly', startDate, endDate);

    // Customer data
    const { data: customers, error: customersError } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (customersError) throw customersError;

    // Agreements data
    const { data: agreements, error: agreementsError } = await supabase
      .from('leases')
      .select('*, vehicles(*)')
      .eq('status', 'active');

    if (agreementsError) throw agreementsError;

    // Vehicles data
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*');

    if (vehiclesError) throw vehiclesError;

    // Overdue payments
    const { data: overduePayments, error: overdueError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());

    if (overdueError) throw overdueError;

    // Maintenance alerts
    const { data: maintenanceAlerts, error: maintenanceError } = await supabase
      .from('maintenance')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());

    if (maintenanceError) throw maintenanceError;

    // Legal cases
    const { data: legalCases, error: legalError } = await supabase
      .from('legal_cases')
      .select('*')
      .eq('status', 'active');

    if (legalError) throw legalError;

    // Sales data
    const salesMetrics = await salesManager.getSalesMetrics(startDate, endDate);

    return {
      totalRevenue: financialReport.total_income,
      totalExpenses: financialReport.total_expenses,
      netProfit: financialReport.net_profit,
      totalCustomers: customers?.length || 0,
      activeAgreements: agreements?.length || 0,
      totalVehicles: vehicles?.length || 0,
      availableVehicles: vehicles?.filter(v => v.status === 'available').length || 0,
      overduePayments: overduePayments?.length || 0,
      maintenanceAlerts: maintenanceAlerts?.length || 0,
      legalCases: legalCases?.length || 0,
      securityAlerts: 0, // Will be updated from security events
      salesLeads: salesMetrics.total_leads,
      conversionRate: salesMetrics.conversion_rate,
      customerSatisfaction: 4.2 // This would come from customer surveys
    };
  };

  const loadKPIMetrics = async (): Promise<KPIMetrics> => {
    const currentPeriod = getStartDate(selectedPeriod);
    const previousPeriod = getPreviousPeriod(selectedPeriod);

    const [currentReport, previousReport] = await Promise.all([
      financialManager.generateReport('monthly', currentPeriod, new Date()),
      financialManager.generateReport('monthly', previousPeriod, currentPeriod)
    ]);

    const revenueGrowth = calculateGrowthRate(previousReport.total_income, currentReport.total_income);
    const profitMargin = currentReport.total_income > 0 ? (currentReport.net_profit / currentReport.total_income) * 100 : 0;

    // Vehicle utilization
    const { data: vehicles } = await supabase.from('vehicles').select('*');
    const { data: activeAgreements } = await supabase.from('leases').select('*').eq('status', 'active');
    const vehicleUtilization = vehicles?.length ? (activeAgreements?.length || 0) / vehicles.length * 100 : 0;

    // Payment efficiency
    const { data: totalPayments } = await supabase.from('unified_payments').select('*');
    const { data: overduePayments } = await supabase.from('unified_payments').select('*').eq('status', 'pending').lt('due_date', new Date().toISOString());
    const paymentEfficiency = totalPayments?.length ? (100 - (overduePayments?.length || 0) / totalPayments.length * 100) : 100;

    return {
      revenueGrowth,
      customerGrowth: 15.2, // This would be calculated from customer data
      vehicleUtilization,
      paymentEfficiency,
      operationalEfficiency: 87.5, // This would be calculated from various operational metrics
      profitMargin
    };
  };

  const loadAlerts = async (): Promise<Alert[]> => {
    const alerts: Alert[] = [];

    // Financial alerts
    const { data: overduePayments } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (overduePayments && overduePayments.length > 0) {
      alerts.push({
        id: 'overdue-payments',
        type: 'critical',
        category: 'financial',
        message: `${overduePayments.length} payments are overdue by more than 7 days`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Maintenance alerts
    const { data: maintenanceAlerts } = await supabase
      .from('maintenance')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString());

    if (maintenanceAlerts && maintenanceAlerts.length > 0) {
      alerts.push({
        id: 'maintenance-overdue',
        type: 'warning',
        category: 'maintenance',
        message: `${maintenanceAlerts.length} maintenance tasks are overdue`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Legal alerts
    const { data: legalCases } = await supabase
      .from('legal_cases')
      .select('*')
      .eq('status', 'active')
      .lt('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    if (legalCases && legalCases.length > 0) {
      alerts.push({
        id: 'legal-cases',
        type: 'warning',
        category: 'legal',
        message: `${legalCases.length} legal cases require attention within 7 days`,
        timestamp: new Date(),
        resolved: false
      });
    }

    // Security alerts
    const { data: securityEvents } = await supabase
      .from('security_events')
      .select('*')
      .in('risk_level', ['high', 'critical'])
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (securityEvents && securityEvents.length > 0) {
      alerts.push({
        id: 'security-events',
        type: 'critical',
        category: 'security',
        message: `${securityEvents.length} high-risk security events detected in the last 24 hours`,
        timestamp: new Date(),
        resolved: false
      });
    }

    return alerts;
  };

  const loadChartData = async (): Promise<any[]> => {
    const days = getDaysInPeriod(selectedPeriod);
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const { data: revenue } = await supabase
        .from('unified_payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('payment_date', dayStart.toISOString())
        .lt('payment_date', dayEnd.toISOString());

      const { data: expenses } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', dayStart.toISOString())
        .lt('date', dayEnd.toISOString());

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: revenue?.reduce((sum, p) => sum + p.amount, 0) || 0,
        expenses: expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      });
    }

    return data;
  };

  const generateBoardReport = async (): Promise<BoardReport> => {
    const startDate = getStartDate(selectedPeriod);
    const endDate = new Date();

    const summary = await loadExecutiveSummary();
    const kpiMetrics = await loadKPIMetrics();
    const financialAnalysis = await financialManager.getFinancialAnalytics(startDate, endDate);

    return {
      period: selectedPeriod,
      executiveSummary: summary,
      kpiMetrics,
      financialAnalysis,
      operationalHighlights: [
        `${summary.activeAgreements} active rental agreements generating ${summary.totalRevenue.toLocaleString()} QAR`,
        `${summary.availableVehicles} vehicles available out of ${summary.totalVehicles} total fleet`,
        `${summary.salesLeads} new leads with ${summary.conversionRate.toFixed(1)}% conversion rate`,
        `Customer satisfaction maintained at ${summary.customerSatisfaction}/5.0`
      ],
      riskAssessment: [
        summary.overduePayments > 10 ? `High: ${summary.overduePayments} overdue payments require immediate attention` : 'Low: Payment collection is within acceptable limits',
        summary.maintenanceAlerts > 5 ? `Medium: ${summary.maintenanceAlerts} maintenance tasks are overdue` : 'Low: Maintenance schedule is on track',
        summary.legalCases > 0 ? `Medium: ${summary.legalCases} active legal cases require monitoring` : 'Low: No active legal cases',
        kpiMetrics.profitMargin < 10 ? 'High: Profit margin is below target threshold' : 'Low: Profit margin is healthy'
      ],
      recommendations: [
        kpiMetrics.revenueGrowth < 5 ? 'Focus on revenue growth strategies and market expansion' : 'Continue current revenue growth initiatives',
        kpiMetrics.vehicleUtilization < 80 ? 'Optimize vehicle utilization through better fleet management' : 'Maintain current vehicle utilization levels',
        summary.overduePayments > 5 ? 'Implement stricter payment collection procedures' : 'Maintain current payment collection standards',
        'Invest in digital transformation to improve operational efficiency'
      ],
      futureOutlook: [
        `Projected revenue growth of ${kpiMetrics.revenueGrowth > 0 ? '+' : ''}${kpiMetrics.revenueGrowth.toFixed(1)}% based on current trends`,
        'Market expansion opportunities in Qatar rental market',
        'Technology investments expected to improve operational efficiency by 15%',
        'Customer satisfaction initiatives targeting 4.5/5.0 rating'
      ]
    };
  };

  const getStartDate = (period: 'week' | 'month' | 'quarter' | 'year'): Date => {
    const date = new Date();
    switch (period) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  };

  const getPreviousPeriod = (period: 'week' | 'month' | 'quarter' | 'year'): Date => {
    const date = getStartDate(period);
    switch (period) {
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  };

  const getDaysInPeriod = (period: 'week' | 'month' | 'quarter' | 'year'): number => {
    switch (period) {
      case 'week':
        return 7;
      case 'month':
        return 30;
      case 'quarter':
        return 90;
      case 'year':
        return 365;
    }
  };

  const calculateGrowthRate = (previous: number, current: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const downloadBoardReport = async () => {
    if (!boardReport) return;

    const reportContent = `
# تقرير مجلس الإدارة - ${boardReport.period}

## الملخص التنفيذي
- إجمالي الإيرادات: ${boardReport.executiveSummary.totalRevenue.toLocaleString()} ريال قطري
- إجمالي المصروفات: ${boardReport.executiveSummary.totalExpenses.toLocaleString()} ريال قطري
- صافي الربح: ${boardReport.executiveSummary.netProfit.toLocaleString()} ريال قطري
- العملاء النشطون: ${boardReport.executiveSummary.totalCustomers}
- العقود النشطة: ${boardReport.executiveSummary.activeAgreements}

## المؤشرات الرئيسية
- نمو الإيرادات: ${boardReport.kpiMetrics.revenueGrowth.toFixed(1)}%
- استغلال المركبات: ${boardReport.kpiMetrics.vehicleUtilization.toFixed(1)}%
- كفاءة الدفع: ${boardReport.kpiMetrics.paymentEfficiency.toFixed(1)}%
- هامش الربح: ${boardReport.kpiMetrics.profitMargin.toFixed(1)}%

## النقاط البارزة التشغيلية
${boardReport.operationalHighlights.map(h => `- ${h}`).join('\n')}

## تقييم المخاطر
${boardReport.riskAssessment.map(r => `- ${r}`).join('\n')}

## التوصيات
${boardReport.recommendations.map(r => `- ${r}`).join('\n')}

## النظرة المستقبلية
${boardReport.futureOutlook.map(o => `- ${o}`).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `board-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('تم تنزيل التقرير بنجاح');
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم التنفيذية</h1>
          <p className="text-gray-600">نظرة شاملة على أداء الشركة</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">الأسبوع</option>
            <option value="month">الشهر</option>
            <option value="quarter">الربع</option>
            <option value="year">السنة</option>
          </select>
          <Button onClick={downloadBoardReport} disabled={!boardReport}>
            <FileText className="h-4 w-4 mr-2" />
            تقرير مجلس الإدارة
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {alerts.filter(a => a.type === 'critical').length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              تنبيهات عاجلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(a => a.type === 'critical').map((alert) => (
                <div key={alert.id} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  {getAlertIcon(alert.type)}
                  <span className="flex-1">{alert.message}</span>
                  <Badge variant={getAlertColor(alert.type)}>{alert.category}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalRevenue.toLocaleString()} ريال</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {kpiMetrics?.revenueGrowth && kpiMetrics.revenueGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              {kpiMetrics?.revenueGrowth.toFixed(1)}% من الفترة السابقة
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.netProfit.toLocaleString()} ريال</div>
            <div className="text-xs text-muted-foreground">
              هامش الربح: {kpiMetrics?.profitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العملاء النشطون</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalCustomers}</div>
            <div className="text-xs text-muted-foreground">
              نمو: {kpiMetrics?.customerGrowth.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">استغلال المركبات</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiMetrics?.vehicleUtilization.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              {summary?.availableVehicles} متاح من {summary?.totalVehicles}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="financial">مالي</TabsTrigger>
          <TabsTrigger value="operations">تشغيلي</TabsTrigger>
          <TabsTrigger value="sales">مبيعات</TabsTrigger>
          <TabsTrigger value="security">أمان</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>تطور الإيرادات والمصروفات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="إيرادات" />
                    <Line type="monotone" dataKey="expenses" stroke="#82ca9d" name="مصروفات" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المؤشرات الرئيسية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>كفاءة الدفع</span>
                    <span>{kpiMetrics?.paymentEfficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={kpiMetrics?.paymentEfficiency} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>الكفاءة التشغيلية</span>
                    <span>{kpiMetrics?.operationalEfficiency.toFixed(1)}%</span>
                  </div>
                  <Progress value={kpiMetrics?.operationalEfficiency} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>استغلال المركبات</span>
                    <span>{kpiMetrics?.vehicleUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={kpiMetrics?.vehicleUtilization} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>التدفق النقدي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  +{(summary?.totalRevenue - summary?.totalExpenses).toLocaleString()} ريال
                </div>
                <p className="text-sm text-muted-foreground">صافي التدفق النقدي</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المدفوعات المتأخرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {summary?.overduePayments}
                </div>
                <p className="text-sm text-muted-foreground">دفعة متأخرة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>هامش الربح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpiMetrics?.profitMargin.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">من إجمالي الإيرادات</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>العقود النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.activeAgreements}</div>
                <p className="text-sm text-muted-foreground">عقد نشط</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>تنبيهات الصيانة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {summary?.maintenanceAlerts}
                </div>
                <p className="text-sm text-muted-foreground">مهمة صيانة متأخرة</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>العملاء المحتملون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.salesLeads}</div>
                <p className="text-sm text-muted-foreground">عميل محتمل جديد</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معدل التحويل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.conversionRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">من العملاء المحتملين</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>رضا العملاء</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.customerSatisfaction}/5.0</div>
                <p className="text-sm text-muted-foreground">متوسط التقييم</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>التنبيهات الأمنية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.timestamp.toLocaleString('ar-QA')}
                          </p>
                        </div>
                        <Badge variant={getAlertColor(alert.type)}>{alert.category}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">لا توجد تنبيهات أمنية</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>القضايا القانونية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {summary?.legalCases}
                </div>
                <p className="text-sm text-muted-foreground">قضية قانونية نشطة</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
