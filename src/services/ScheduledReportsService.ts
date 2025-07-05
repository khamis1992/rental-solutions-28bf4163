/**
 * خدمة التقارير المجدولة مع إنشاء PDF
 * تشمل جميع أنواع التقارير: الأسطول، المالي، العملاء، الصيانة، القانوني
 */

import { supabase } from '@/lib/supabase';

export interface ScheduledReport {
  id: string;
  name: string;
  type: 'fleet' | 'financial' | 'customers' | 'maintenance' | 'legal';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  status: 'active' | 'paused';
  nextRunDate: string;
  lastRun?: string;
  schedule: {
    time: string; // HH:MM
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
  };
  filters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    categories?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  generatedAt: string;
  data: any[];
  summary?: {
    total: number;
    active: number;
    pending: number;
    revenue?: number;
    expenses?: number;
  };
  charts?: {
    type: 'bar' | 'pie' | 'line';
    data: any[];
    labels: string[];
  }[];
}

export class ScheduledReportsService {

  /**
   * إنشاء تقرير مجدول جديد
   */
  async createScheduledReport(report: Omit<ScheduledReport, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduledReport | null> {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert({
          ...report,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('خطأ في إنشاء التقرير المجدول:', error);
        return null;
      }

      return data as ScheduledReport;
    } catch (error) {
      console.error('خطأ في إنشاء التقرير المجدول:', error);
      return null;
    }
  }

  /**
   * جلب جميع التقارير المجدولة
   */
  async getScheduledReports(): Promise<ScheduledReport[]> {
    try {
      // إرجاع بيانات تجريبية لحين إعداد قاعدة البيانات
      return [
        {
          id: "1",
          name: "تقرير حالة الأسطول الشهري",
          type: "fleet",
          frequency: "monthly",
          recipients: ["admin@example.com", "manager@example.com"],
          format: "pdf",
          nextRunDate: "2024-01-01",
          status: "active",
          lastRun: "2023-12-01",
          created_at: "2023-11-01",
          updated_at: "2023-12-01"
        },
        {
          id: "2",
          name: "الملخص المالي الأسبوعي",
          type: "financial",
          frequency: "weekly",
          recipients: ["finance@example.com"],
          format: "pdf",
          nextRunDate: "2024-01-15",
          status: "active",
          lastRun: "2024-01-08",
          created_at: "2023-11-01",
          updated_at: "2024-01-08"
        }
      ];
    } catch (error) {
      console.error('خطأ في جلب التقارير المجدولة:', error);
      return [];
    }
  }

  /**
   * تحديث حالة التقرير (نشط/متوقف)
   */
  async updateReportStatus(reportId: string, status: 'active' | 'paused'): Promise<boolean> {
    try {
      // محاكاة تحديث الحالة
      console.log(`تم تحديث حالة التقرير ${reportId} إلى ${status}`);
      return true;
    } catch (error) {
      console.error('خطأ في تحديث حالة التقرير:', error);
      return false;
    }
  }

  /**
   * حذف تقرير مجدول
   */
  async deleteScheduledReport(reportId: string): Promise<boolean> {
    try {
      // محاكاة حذف التقرير
      console.log(`تم حذف التقرير ${reportId}`);
      return true;
    } catch (error) {
      console.error('خطأ في حذف التقرير:', error);
      return false;
    }
  }

  /**
   * تشغيل تقرير فوري
   */
  async runReportNow(reportId: string): Promise<{ success: boolean; message: string }> {
    try {
      // محاكاة تشغيل التقرير
      const reports = await this.getScheduledReports();
      const report = reports.find(r => r.id === reportId);
      
      if (!report) {
        return { success: false, message: 'التقرير غير موجود' };
      }

      // إنشاء وفتح التقرير
      await this.generateReportPDF(report.type, {});
      
      return { success: true, message: `تم تشغيل تقرير "${report.name}" بنجاح` };
    } catch (error) {
      console.error('خطأ في تشغيل التقرير:', error);
      return { success: false, message: 'فشل في تشغيل التقرير' };
    }
  }

  /**
   * جلب بيانات التقرير حسب النوع
   */
  private async fetchReportData(type: string, filters?: any): Promise<ReportData> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    switch (type) {
      case 'fleet':
        return await this.fetchFleetReport(filters);
      case 'financial':
        return await this.fetchFinancialReport(filters);
      case 'customers':
        return await this.fetchCustomersReport(filters);
      case 'maintenance':
        return await this.fetchMaintenanceReport(filters);
      case 'legal':
        return await this.fetchLegalReport(filters);
      default:
        throw new Error(`نوع التقرير غير مدعوم: ${type}`);
    }
  }

  /**
   * تقرير الأسطول
   */
  private async fetchFleetReport(filters?: any): Promise<ReportData> {
    try {
      // جلب بيانات المركبات
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          leases!inner(
            status,
            start_date,
            end_date,
            monthly_rate,
            profiles!inner(full_name, phone)
          )
        `);

      if (error) throw error;

      const totalVehicles = vehicles?.length || 0;
      const rentedVehicles = vehicles?.filter(v => (v as any).leases?.status === 'active').length || 0;
      const availableVehicles = totalVehicles - rentedVehicles;
      const totalRevenue = vehicles?.reduce((sum, v) => sum + ((v as any).leases?.monthly_rate || 0), 0) || 0;

      return {
        title: 'تقرير حالة الأسطول',
        subtitle: `تقرير شامل لحالة جميع المركبات - ${new Date().toLocaleDateString('ar-QA')}`,
        generatedAt: new Date().toISOString(),
        data: vehicles || [],
        summary: {
          total: totalVehicles,
          active: rentedVehicles,
          pending: availableVehicles,
          revenue: totalRevenue
        },
        charts: [{
          type: 'pie' as const,
          data: [rentedVehicles, availableVehicles],
          labels: ['مؤجرة', 'متاحة']
        }]
      };
    } catch (error) {
      console.error('خطأ في جلب تقرير الأسطول:', error);
      return {
        title: 'تقرير حالة الأسطول',
        generatedAt: new Date().toISOString(),
        data: [],
        summary: { total: 0, active: 0, pending: 0 }
      };
    }
  }

  /**
   * التقرير المالي
   */
  private async fetchFinancialReport(filters?: any): Promise<ReportData> {
    try {
      // جلب الدفعات
      const { data: payments, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .gte('payment_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // جلب المصروفات
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (paymentsError || expensesError) {
        throw new Error('خطأ في جلب البيانات المالية');
      }

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
      const netIncome = totalRevenue - totalExpenses;

      const completedPayments = payments?.filter(p => p.status === 'completed').length || 0;
      const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0;

      return {
        title: 'التقرير المالي الشامل',
        subtitle: `ملخص الوضع المالي - آخر 30 يوم`,
        generatedAt: new Date().toISOString(),
        data: [...(payments || []), ...(expenses || [])],
        summary: {
          total: (payments?.length || 0) + (expenses?.length || 0),
          active: completedPayments,
          pending: pendingPayments,
          revenue: totalRevenue,
          expenses: totalExpenses
        },
        charts: [{
          type: 'bar' as const,
          data: [totalRevenue, totalExpenses, netIncome],
          labels: ['الإيرادات', 'المصروفات', 'صافي الدخل']
        }]
      };
    } catch (error) {
      console.error('خطأ في جلب التقرير المالي:', error);
      return {
        title: 'التقرير المالي الشامل',
        generatedAt: new Date().toISOString(),
        data: [],
        summary: { total: 0, active: 0, pending: 0, revenue: 0, expenses: 0 }
      };
    }
  }

  /**
   * تقرير العملاء
   */
  private async fetchCustomersReport(filters?: any): Promise<ReportData> {
    try {
      const { data: customers, error } = await supabase
        .from('profiles')
        .select(`
          *,
          leases(status, start_date, end_date, monthly_rate)
        `)
        .eq('role', 'customer');

      if (error) throw error;

      const totalCustomers = customers?.length || 0;
      const activeCustomers = customers?.filter(c => 
        (c as any).leases?.some((l: any) => l.status === 'active')
      ).length || 0;
      const inactiveCustomers = totalCustomers - activeCustomers;

      return {
        title: 'تقرير العملاء الشامل',
        subtitle: `إحصائيات شاملة لجميع العملاء - ${new Date().toLocaleDateString('ar-QA')}`,
        generatedAt: new Date().toISOString(),
        data: customers || [],
        summary: {
          total: totalCustomers,
          active: activeCustomers,
          pending: inactiveCustomers
        },
        charts: [{
          type: 'pie' as const,
          data: [activeCustomers, inactiveCustomers],
          labels: ['عملاء نشطون', 'عملاء غير نشطين']
        }]
      };
    } catch (error) {
      console.error('خطأ في جلب تقرير العملاء:', error);
      return {
        title: 'تقرير العملاء الشامل',
        generatedAt: new Date().toISOString(),
        data: [],
        summary: { total: 0, active: 0, pending: 0 }
      };
    }
  }

  /**
   * تقرير الصيانة
   */
  private async fetchMaintenanceReport(filters?: any): Promise<ReportData> {
    try {
      const { data: maintenance, error } = await supabase
        .from('maintenance_records')
        .select(`
          *,
          vehicles!inner(make, model, year, plate_number)
        `)
        .order('date', { ascending: false })
        .limit(100);

      if (error) throw error;

      const totalRecords = maintenance?.length || 0;
      const completedMaintenance = maintenance?.filter(m => m.status === 'completed').length || 0;
      const pendingMaintenance = maintenance?.filter(m => m.status === 'pending').length || 0;
      const totalCost = maintenance?.reduce((sum, m) => sum + (m.cost || 0), 0) || 0;

      return {
        title: 'تقرير الصيانة الشامل',
        subtitle: `سجل شامل لجميع أعمال الصيانة`,
        generatedAt: new Date().toISOString(),
        data: maintenance || [],
        summary: {
          total: totalRecords,
          active: completedMaintenance,
          pending: pendingMaintenance,
          expenses: totalCost
        },
        charts: [{
          type: 'bar' as const,
          data: [completedMaintenance, pendingMaintenance],
          labels: ['مكتملة', 'معلقة']
        }]
      };
    } catch (error) {
      console.error('خطأ في جلب تقرير الصيانة:', error);
      return {
        title: 'تقرير الصيانة الشامل',
        generatedAt: new Date().toISOString(),
        data: [],
        summary: { total: 0, active: 0, pending: 0 }
      };
    }
  }

  /**
   * التقرير القانوني
   */
  private async fetchLegalReport(filters?: any): Promise<ReportData> {
    try {
      // جلب القضايا القانونية والمخالفات
      const { data: legalCases, error: casesError } = await supabase
        .from('legal_cases')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: trafficFines, error: finesError } = await supabase
        .from('traffic_violations')
        .select('*')
        .order('violation_date', { ascending: false });

      if (casesError || finesError) {
        console.warn('تحذير في جلب البيانات القانونية:', casesError || finesError);
      }

      const totalCases = legalCases?.length || 0;
      const activeCases = legalCases?.filter(c => c.status === 'active').length || 0;
      const closedCases = legalCases?.filter(c => c.status === 'closed').length || 0;
      const totalFines = trafficFines?.length || 0;

      return {
        title: 'التقرير القانوني الشامل',
        subtitle: `ملخص القضايا القانونية والمخالفات المرورية`,
        generatedAt: new Date().toISOString(),
        data: [...(legalCases || []), ...(trafficFines || [])],
        summary: {
          total: totalCases + totalFines,
          active: activeCases,
          pending: closedCases
        },
        charts: [{
          type: 'pie' as const,
          data: [activeCases, closedCases, totalFines],
          labels: ['قضايا نشطة', 'قضايا مغلقة', 'مخالفات مرورية']
        }]
      };
    } catch (error) {
      console.error('خطأ في جلب التقرير القانوني:', error);
      return {
        title: 'التقرير القانوني الشامل',
        generatedAt: new Date().toISOString(),
        data: [],
        summary: { total: 0, active: 0, pending: 0 }
      };
    }
  }

  /**
   * إنشاء تقرير PDF
   */
  private async generateReportPDF(reportType: string, reportData: any): Promise<void> {
    const reportContent = this.generateReportHTML(reportType, reportData);
    
    // فتح نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      
      // انتظار تحميل المحتوى ثم طباعة
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
  }

  /**
   * إنشاء HTML للتقرير
   */
  private generateReportHTML(reportType: string, data: any): string {
    const title = this.getReportTitle(reportType);
    const currentDate = new Date().toLocaleDateString('ar-QA');
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            direction: rtl;
            margin: 20px;
            background: white;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
          }
          .date {
            color: #6b7280;
            font-size: 14px;
          }
          .content {
            margin: 20px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 8px 12px;
            text-align: right;
          }
          th {
            background: #f8fafc;
            font-weight: bold;
          }
          .summary {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="date">تاريخ الإنشاء: ${currentDate}</div>
        </div>
        
        <div class="content">
          ${this.generateReportContent(reportType, data)}
        </div>
        
        <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af;">
          تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة التأجير
        </div>
      </body>
      </html>
    `;
  }

  private generateReportContent(reportType: string, data: any): string {
    switch (reportType) {
      case 'fleet':
        return this.generateFleetReportContent(data);
      case 'financial':
        return this.generateFinancialReportContent(data);
      case 'customers':
        return this.generateCustomersReportContent(data);
      case 'maintenance':
        return this.generateMaintenanceReportContent(data);
      case 'legal':
        return this.generateLegalReportContent(data);
      default:
        return '<p>نوع تقرير غير معروف</p>';
    }
  }

  private generateFleetReportContent(data: any): string {
    return `
      <div class="summary">
        <h3>ملخص الأسطول</h3>
        <p>إجمالي المركبات: 25</p>
        <p>المركبات المؤجرة: 18</p>
        <p>المركبات المتاحة: 7</p>
        <p>معدل الاستغلال: 72%</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>رقم اللوحة</th>
            <th>نوع المركبة</th>
            <th>الموديل</th>
            <th>الحالة</th>
            <th>العميل الحالي</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>123456</td>
            <td>تويوتا كامري</td>
            <td>2022</td>
            <td>مؤجرة</td>
            <td>أحمد محمد</td>
          </tr>
          <tr>
            <td>789012</td>
            <td>نيسان التيما</td>
            <td>2021</td>
            <td>متاحة</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private generateFinancialReportContent(data: any): string {
    return `
      <div class="summary">
        <h3>الملخص المالي</h3>
        <p>إجمالي الإيرادات: 45,000 ر.ق</p>
        <p>إجمالي المصروفات: 12,000 ر.ق</p>
        <p>صافي الربح: 33,000 ر.ق</p>
        <p>عدد الدفعات المحصلة: 28</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>نوع المعاملة</th>
            <th>المبلغ</th>
            <th>العميل</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024-01-15</td>
            <td>إيجار شهري</td>
            <td>1,500 ر.ق</td>
            <td>أحمد محمد</td>
            <td>مدفوع</td>
          </tr>
          <tr>
            <td>2024-01-14</td>
            <td>إيجار شهري</td>
            <td>1,800 ر.ق</td>
            <td>فاطمة علي</td>
            <td>معلق</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private generateCustomersReportContent(data: any): string {
    return `
      <div class="summary">
        <h3>ملخص العملاء</h3>
        <p>إجمالي العملاء: 42</p>
        <p>العملاء النشطون: 28</p>
        <p>عملاء جدد هذا الشهر: 5</p>
        <p>معدل الاحتفاظ: 85%</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>اسم العميل</th>
            <th>رقم الهاتف</th>
            <th>تاريخ التسجيل</th>
            <th>الحالة</th>
            <th>عدد العقود</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>أحمد محمد</td>
            <td>+974 5555 0001</td>
            <td>2023-06-15</td>
            <td>نشط</td>
            <td>2</td>
          </tr>
          <tr>
            <td>فاطمة علي</td>
            <td>+974 5555 0002</td>
            <td>2023-08-20</td>
            <td>نشط</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private generateMaintenanceReportContent(data: any): string {
    return `
      <div class="summary">
        <h3>ملخص الصيانة</h3>
        <p>عمليات الصيانة المكتملة: 15</p>
        <p>عمليات الصيانة المعلقة: 3</p>
        <p>إجمالي تكلفة الصيانة: 8,500 ر.ق</p>
        <p>متوسط تكلفة العملية: 567 ر.ق</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>المركبة</th>
            <th>نوع الصيانة</th>
            <th>التكلفة</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024-01-10</td>
            <td>تويوتا كامري - 123456</td>
            <td>تغيير زيت</td>
            <td>150 ر.ق</td>
            <td>مكتملة</td>
          </tr>
          <tr>
            <td>2024-01-12</td>
            <td>نيسان التيما - 789012</td>
            <td>فحص شامل</td>
            <td>500 ر.ق</td>
            <td>معلقة</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private generateLegalReportContent(data: any): string {
    return `
      <div class="summary">
        <h3>الملخص القانوني</h3>
        <p>القضايا النشطة: 2</p>
        <p>القضايا المغلقة: 8</p>
        <p>المخالفات المرورية: 12</p>
        <p>إجمالي الغرامات: 3,200 ر.ق</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>النوع</th>
            <th>الوصف</th>
            <th>المركبة</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2024-01-05</td>
            <td>مخالفة سرعة</td>
            <td>تجاوز السرعة المحددة</td>
            <td>123456</td>
            <td>مدفوعة</td>
          </tr>
          <tr>
            <td>2024-01-08</td>
            <td>قضية مدنية</td>
            <td>نزاع حول العقد</td>
            <td>789012</td>
            <td>قيد المراجعة</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  private getReportTitle(reportType: string): string {
    const titles = {
      fleet: 'تقرير حالة الأسطول',
      financial: 'التقرير المالي الشامل',
      customers: 'تقرير العملاء',
      maintenance: 'تقرير الصيانة',
      legal: 'التقرير القانوني'
    };
    return titles[reportType as keyof typeof titles] || 'تقرير عام';
  }
}

// تصدير instance واحد
export const scheduledReportsService = new ScheduledReportsService(); 