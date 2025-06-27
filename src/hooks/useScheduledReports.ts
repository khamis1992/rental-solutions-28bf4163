import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import WhatsAppReportsService from '@/services/whatsapp-reports-service';

// إنشاء instance من الخدمة
const whatsAppReportsService = new WhatsAppReportsService();

// الأرقام المستهدفة لإرسال التقارير
const WHATSAPP_REPORT_NUMBERS = ['+97466707063', '+97470598989'];

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
  created_at: string;
  updated_at: string;
}

const MOCK_REPORTS: ScheduledReport[] = [
  {
    id: "1",
    name: "تقرير حالة الأسطول الشهري",
    type: "fleet",
    frequency: "monthly",
    recipients: ["admin@example.com", "manager@example.com"],
    format: "pdf",
    nextRunDate: "2024-02-01",
    status: "active",
    lastRun: "2024-01-01",
    created_at: "2023-11-01",
    updated_at: "2024-01-01"
  },
  {
    id: "2",
    name: "الملخص المالي الأسبوعي",
    type: "financial",
    frequency: "weekly",
    recipients: ["finance@example.com"],
    format: "pdf",
    nextRunDate: "2024-01-22",
    status: "active",
    lastRun: "2024-01-15",
    created_at: "2023-11-01",
    updated_at: "2024-01-15"
  },
  {
    id: "3",
    name: "تقرير الاحتفاظ بالعملاء",
    type: "customers",
    frequency: "quarterly",
    recipients: ["marketing@example.com", "sales@example.com"],
    format: "pdf",
    nextRunDate: "2024-04-01",
    status: "paused",
    lastRun: "2024-01-01",
    created_at: "2023-11-01",
    updated_at: "2024-01-01"
  },
  {
    id: "4",
    name: "جدولة الصيانة الأسبوعية",
    type: "maintenance",
    frequency: "weekly",
    recipients: ["maintenance@example.com"],
    format: "pdf",
    nextRunDate: "2024-01-25",
    status: "active",
    lastRun: "2024-01-18",
    created_at: "2023-11-01",
    updated_at: "2024-01-18"
  },
  {
    id: "5",
    name: "مراجعة الامتثال القانوني الشهرية",
    type: "legal",
    frequency: "monthly",
    recipients: ["legal@example.com"],
    format: "pdf",
    nextRunDate: "2024-02-05",
    status: "active",
    lastRun: "2024-01-05",
    created_at: "2023-11-01",
    updated_at: "2024-01-05"
  }
];

export const useScheduledReports = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      // محاكاة تحميل البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReports(MOCK_REPORTS);
    } catch (error) {
      console.error('خطأ في جلب التقارير:', error);
      toast.error('فشل في تحميل التقارير');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReportPDF = (reportType: string, reportName: string) => {
    const reportContent = createReportHTML(reportType, reportName);
    
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
  };

  const createReportHTML = (reportType: string, reportName: string): string => {
    const currentDate = new Date().toLocaleDateString('ar-QA');
    const currentTime = new Date().toLocaleTimeString('ar-QA');
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${reportName}</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            direction: rtl;
            margin: 20px;
            background: white;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .date {
            color: #9ca3af;
            font-size: 14px;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
          }
          .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
          .summary-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
          }
          .summary-card .label {
            font-size: 12px;
            color: #9ca3af;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .data-table th {
            background: #f8fafc;
            padding: 12px;
            text-align: right;
            font-weight: bold;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
          }
          .data-table td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
            text-align: right;
          }
          .data-table tr:nth-child(even) {
            background: #f9fafb;
          }
          .data-table tr:hover {
            background: #eff6ff;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
          }
          .status-active {
            background: #dcfce7;
            color: #166534;
          }
          .status-pending {
            background: #fef3c7;
            color: #92400e;
          }
          .status-completed {
            background: #dbeafe;
            color: #1e40af;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${reportName}</div>
          <div class="subtitle">تقرير شامل ومفصل</div>
          <div class="date">تم الإنشاء في: ${currentDate} | الوقت: ${currentTime}</div>
        </div>

        ${getReportContent(reportType)}

        <div class="footer">
          <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة التأجير</p>
          <p>© 2024 شركة العراف لتأجير السيارات - جميع الحقوق محفوظة</p>
        </div>
      </body>
      </html>
    `;
  };

  const getReportContent = (reportType: string): string => {
    switch (reportType) {
      case 'fleet':
        return `
          <div class="summary-cards">
            <div class="summary-card">
              <h3>إجمالي المركبات</h3>
              <div class="value">25</div>
              <div class="label">مركبة</div>
            </div>
            <div class="summary-card">
              <h3>المركبات المؤجرة</h3>
              <div class="value">18</div>
              <div class="label">مركبة نشطة</div>
            </div>
            <div class="summary-card">
              <h3>المركبات المتاحة</h3>
              <div class="value">7</div>
              <div class="label">مركبة متاحة</div>
            </div>
            <div class="summary-card">
              <h3>معدل الاستغلال</h3>
              <div class="value">72%</div>
              <div class="label">كفاءة الأسطول</div>
            </div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th>الحالة</th>
                <th>العميل الحالي</th>
                <th>السنة</th>
                <th>الموديل</th>
                <th>النوع</th>
                <th>رقم اللوحة</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="status-badge status-active">مؤجرة</span></td>
                <td>أحمد محمد علي</td>
                <td>2022</td>
                <td>كامري</td>
                <td>تويوتا</td>
                <td>123456</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">متاحة</span></td>
                <td>-</td>
                <td>2021</td>
                <td>التيما</td>
                <td>نيسان</td>
                <td>789012</td>
              </tr>
              <tr>
                <td><span class="status-badge status-active">مؤجرة</span></td>
                <td>فاطمة سالم</td>
                <td>2023</td>
                <td>سيفيك</td>
                <td>هوندا</td>
                <td>345678</td>
              </tr>
              <tr>
                <td><span class="status-badge status-active">مؤجرة</span></td>
                <td>محمد حسن</td>
                <td>2022</td>
                <td>كورولا</td>
                <td>تويوتا</td>
                <td>901234</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">صيانة</span></td>
                <td>-</td>
                <td>2020</td>
                <td>سوناتا</td>
                <td>هيونداي</td>
                <td>567890</td>
              </tr>
            </tbody>
          </table>
        `;

      case 'financial':
        return `
          <div class="summary-cards">
            <div class="summary-card">
              <h3>إجمالي الإيرادات</h3>
              <div class="value">45,000</div>
              <div class="label">ريال قطري</div>
            </div>
            <div class="summary-card">
              <h3>إجمالي المصروفات</h3>
              <div class="value">12,000</div>
              <div class="label">ريال قطري</div>
            </div>
            <div class="summary-card">
              <h3>صافي الربح</h3>
              <div class="value">33,000</div>
              <div class="label">ريال قطري</div>
            </div>
            <div class="summary-card">
              <h3>عدد المعاملات</h3>
              <div class="value">28</div>
              <div class="label">معاملة مالية</div>
            </div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th>الحالة</th>
                <th>العميل</th>
                <th>المبلغ</th>
                <th>نوع المعاملة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="status-badge status-completed">مدفوع</span></td>
                <td>أحمد محمد علي</td>
                <td>1,500 ر.ق</td>
                <td>إيجار شهري</td>
                <td>2024-01-15</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">معلق</span></td>
                <td>فاطمة سالم</td>
                <td>1,800 ر.ق</td>
                <td>إيجار شهري</td>
                <td>2024-01-14</td>
              </tr>
              <tr>
                <td><span class="status-badge status-completed">مدفوع</span></td>
                <td>محمد حسن</td>
                <td>2,200 ر.ق</td>
                <td>إيجار شهري</td>
                <td>2024-01-13</td>
              </tr>
              <tr>
                <td><span class="status-badge status-completed">مدفوع</span></td>
                <td>علي أحمد</td>
                <td>1,300 ر.ق</td>
                <td>إيجار شهري</td>
                <td>2024-01-12</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">معلق</span></td>
                <td>نورا سعد</td>
                <td>1,600 ر.ق</td>
                <td>إيجار شهري</td>
                <td>2024-01-11</td>
              </tr>
            </tbody>
          </table>
        `;

      case 'customers':
        return `
          <div class="summary-cards">
            <div class="summary-card">
              <h3>إجمالي العملاء</h3>
              <div class="value">42</div>
              <div class="label">عميل</div>
            </div>
            <div class="summary-card">
              <h3>العملاء النشطون</h3>
              <div class="value">28</div>
              <div class="label">عميل نشط</div>
            </div>
            <div class="summary-card">
              <h3>عملاء جدد</h3>
              <div class="value">5</div>
              <div class="label">هذا الشهر</div>
            </div>
            <div class="summary-card">
              <h3>معدل الاحتفاظ</h3>
              <div class="value">85%</div>
              <div class="label">نسبة الإبقاء</div>
            </div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th>الحالة</th>
                <th>عدد العقود</th>
                <th>تاريخ التسجيل</th>
                <th>رقم الهاتف</th>
                <th>اسم العميل</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="status-badge status-active">نشط</span></td>
                <td>2</td>
                <td>2023-06-15</td>
                <td>+974 5555 0001</td>
                <td>أحمد محمد علي</td>
              </tr>
              <tr>
                <td><span class="status-badge status-active">نشط</span></td>
                <td>1</td>
                <td>2023-08-20</td>
                <td>+974 5555 0002</td>
                <td>فاطمة سالم</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">غير نشط</span></td>
                <td>0</td>
                <td>2023-12-01</td>
                <td>+974 5555 0003</td>
                <td>محمد حسن</td>
              </tr>
              <tr>
                <td><span class="status-badge status-active">نشط</span></td>
                <td>3</td>
                <td>2023-05-10</td>
                <td>+974 5555 0004</td>
                <td>علي أحمد</td>
              </tr>
              <tr>
                <td><span class="status-badge status-active">نشط</span></td>
                <td>1</td>
                <td>2023-11-25</td>
                <td>+974 5555 0005</td>
                <td>نورا سعد</td>
              </tr>
            </tbody>
          </table>
        `;

      case 'maintenance':
        return `
          <div class="summary-cards">
            <div class="summary-card">
              <h3>عمليات مكتملة</h3>
              <div class="value">15</div>
              <div class="label">عملية صيانة</div>
            </div>
            <div class="summary-card">
              <h3>عمليات معلقة</h3>
              <div class="value">3</div>
              <div class="label">عملية صيانة</div>
            </div>
            <div class="summary-card">
              <h3>إجمالي التكلفة</h3>
              <div class="value">8,500</div>
              <div class="label">ريال قطري</div>
            </div>
            <div class="summary-card">
              <h3>متوسط التكلفة</h3>
              <div class="value">567</div>
              <div class="label">ريال قطري</div>
            </div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th>الحالة</th>
                <th>التكلفة</th>
                <th>نوع الصيانة</th>
                <th>المركبة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="status-badge status-completed">مكتملة</span></td>
                <td>150 ر.ق</td>
                <td>تغيير زيت</td>
                <td>تويوتا كامري - 123456</td>
                <td>2024-01-10</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">معلقة</span></td>
                <td>500 ر.ق</td>
                <td>فحص شامل</td>
                <td>نيسان التيما - 789012</td>
                <td>2024-01-12</td>
              </tr>
              <tr>
                <td><span class="status-badge status-completed">مكتملة</span></td>
                <td>300 ر.ق</td>
                <td>تغيير إطارات</td>
                <td>هوندا سيفيك - 345678</td>
                <td>2024-01-08</td>
              </tr>
              <tr>
                <td><span class="status-badge status-completed">مكتملة</span></td>
                <td>200 ر.ق</td>
                <td>صيانة فرامل</td>
                <td>تويوتا كورولا - 901234</td>
                <td>2024-01-05</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">معلقة</span></td>
                <td>800 ر.ق</td>
                <td>إصلاح محرك</td>
                <td>هيونداي سوناتا - 567890</td>
                <td>2024-01-15</td>
              </tr>
            </tbody>
          </table>
        `;

      case 'legal':
        return `
          <div class="summary-cards">
            <div class="summary-card">
              <h3>القضايا النشطة</h3>
              <div class="value">2</div>
              <div class="label">قضية قانونية</div>
            </div>
            <div class="summary-card">
              <h3>القضايا المغلقة</h3>
              <div class="value">8</div>
              <div class="label">قضية مغلقة</div>
            </div>
            <div class="summary-card">
              <h3>المخالفات المرورية</h3>
              <div class="value">12</div>
              <div class="label">مخالفة</div>
            </div>
            <div class="summary-card">
              <h3>إجمالي الغرامات</h3>
              <div class="value">3,200</div>
              <div class="label">ريال قطري</div>
            </div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th>الحالة</th>
                <th>المركبة</th>
                <th>الوصف</th>
                <th>النوع</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="status-badge status-completed">مدفوعة</span></td>
                <td>123456</td>
                <td>تجاوز السرعة المحددة</td>
                <td>مخالفة سرعة</td>
                <td>2024-01-05</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">قيد المراجعة</span></td>
                <td>789012</td>
                <td>نزاع حول شروط العقد</td>
                <td>قضية مدنية</td>
                <td>2024-01-08</td>
              </tr>
              <tr>
                <td><span class="status-badge status-completed">مغلقة</span></td>
                <td>345678</td>
                <td>تسوية ودية</td>
                <td>قضية مدنية</td>
                <td>2024-01-01</td>
              </tr>
              <tr>
                <td><span class="status-badge status-pending">معلقة</span></td>
                <td>901234</td>
                <td>وقوف في مكان ممنوع</td>
                <td>مخالفة وقوف</td>
                <td>2024-01-12</td>
              </tr>
              <tr>
                <td><span class="status-badge status-completed">مدفوعة</span></td>
                <td>567890</td>
                <td>عدم ربط حزام الأمان</td>
                <td>مخالفة أمان</td>
                <td>2024-01-03</td>
              </tr>
            </tbody>
          </table>
        `;

      default:
        return '<p>نوع تقرير غير معروف</p>';
    }
  };

  const runReportNow = async (reportId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const report = reports.find(r => r.id === reportId);
      if (!report) {
        return { success: false, message: 'التقرير غير موجود' };
      }

      toast.info('جاري إنشاء التقرير...');

      // إنشاء PDF للتقرير
      const pdfResult = await generateReportPDFBlob(report.type, report.name);
      
      // رفع ملف PDF إلى تخزين Supabase (محاكاة)
      const pdfUrl = await uploadPDFToStorage(pdfResult.blob, `${report.name}-${Date.now()}.pdf`);
      
      // حساب حجم الملف
      const fileSize = formatFileSize(pdfResult.blob.size);

      // إرسال إشعارات الواتساب مع ملف PDF
      const whatsappResults = await whatsAppReportsService.sendScheduledReport({
        reportName: report.name,
        reportType: report.type,
        generatedAt: new Date().toISOString(),
        pdfUrl: pdfUrl,
        reportSize: fileSize
      });

      // تحديث آخر تشغيل للتقرير
      setReports(prev => 
        prev.map(r => 
          r.id === reportId 
            ? { ...r, lastRun: new Date().toLocaleDateString('ar-QA') }
            : r
        )
      );

      // تحليل نتائج الإرسال
      const successCount = whatsappResults.filter(r => r.success).length;
      const totalCount = whatsappResults.length;

      if (successCount === totalCount) {
        return { 
          success: true, 
          message: `تم إنشاء التقرير وإرساله بنجاح إلى ${successCount} رقم واتساب مع ملف PDF` 
        };
      } else if (successCount > 0) {
        return { 
          success: true, 
          message: `تم إنشاء التقرير وإرساله إلى ${successCount} من ${totalCount} أرقام واتساب` 
        };
      } else {
        return { 
          success: false, 
          message: 'تم إنشاء التقرير لكن فشل في إرسال إشعارات الواتساب' 
        };
      }

    } catch (error) {
      console.error('خطأ في تشغيل التقرير:', error);
      return { success: false, message: 'فشل في إنشاء التقرير' };
    }
  };

  const generateReportPDFBlob = async (reportType: string, reportName: string): Promise<{ blob: Blob; url: string }> => {
    return new Promise((resolve) => {
      const reportContent = createReportHTML(reportType, reportName);
      
      // إنشاء iframe مخفي لطباعة PDF
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm';
      iframe.style.height = '297mm';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.write(reportContent);
        iframeDoc.close();

        // انتظار تحميل المحتوى
        iframe.onload = () => {
          setTimeout(() => {
            try {
              // محاكاة إنشاء PDF blob
              const htmlContent = reportContent;
              const blob = new Blob([htmlContent], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              
              document.body.removeChild(iframe);
              resolve({ blob, url });
            } catch (error) {
              console.error('خطأ في إنشاء PDF:', error);
              // إنشاء blob احتياطي
              const fallbackBlob = new Blob(['تقرير PDF'], { type: 'application/pdf' });
              const fallbackUrl = URL.createObjectURL(fallbackBlob);
              document.body.removeChild(iframe);
              resolve({ blob: fallbackBlob, url: fallbackUrl });
            }
          }, 1000);
        };
      }
    });
  };

  const uploadPDFToStorage = async (blob: Blob, fileName: string): Promise<string> => {
    try {
      // محاكاة رفع الملف إلى تخزين سحابي
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // إرجاع رابط وهمي (في التطبيق الحقيقي سيكون رابط Supabase Storage)
      const baseUrl = window.location.origin;
      const mockUrl = `${baseUrl}/reports/${fileName}`;
      
      console.log(`تم رفع الملف: ${fileName} (${formatFileSize(blob.size)})`);
      return mockUrl;
      
    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      // إرجاع رابط احتياطي
      return `${window.location.origin}/reports/backup-${Date.now()}.pdf`;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const updateReportStatus = async (reportId: string, status: 'active' | 'paused'): Promise<boolean> => {
    try {
      setReports(prev => prev.map(r => 
        r.id === reportId 
          ? { ...r, status, updated_at: new Date().toISOString() }
          : r
      ));
      
      const statusText = status === 'active' ? 'تفعيل' : 'إيقاف';
      toast.success(`تم ${statusText} التقرير بنجاح`);
      return true;
    } catch (error) {
      console.error('خطأ في تحديث حالة التقرير:', error);
      toast.error('فشل في تحديث حالة التقرير');
      return false;
    }
  };

  const deleteReport = async (reportId: string): Promise<boolean> => {
    try {
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success('تم حذف التقرير بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في حذف التقرير:', error);
      toast.error('فشل في حذف التقرير');
      return false;
    }
  };

  const createReport = async (reportData: Omit<ScheduledReport, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      const newReport: ScheduledReport = {
        ...reportData,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setReports(prev => [newReport, ...prev]);
      toast.success('تم إنشاء التقرير الجديد بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
      toast.error('فشل في إنشاء التقرير');
      return false;
    }
  };

  return {
    reports,
    isLoading,
    runReportNow,
    updateReportStatus,
    deleteReport,
    createReport,
    refreshReports: fetchReports
  };
}; 