import React, { useState } from 'react';
import { Scan, FileText, History, Settings, Plus, Download, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { InvoiceScanner } from '@/components/invoices/InvoiceScanner';
import PageHeader from '@/components/ui/PageHeader';

export default function InvoiceManagement() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [scanStats, setScanStats] = useState({
    totalScanned: 47,
    successfulMatches: 42,
    pendingReview: 3,
    todayScans: 8
  });

  /**
   * معالجة اكتمال المسح
   */
  const handleScanComplete = (result: any) => {
    console.log('تم إكمال المسح:', result);
    // تحديث الإحصائيات
    setScanStats(prev => ({
      ...prev,
      todayScans: prev.todayScans + 1,
      totalScanned: prev.totalScanned + 1
    }));
  };

  /**
   * معالجة إنجاز معالجة الدفعة
   */
  const handlePaymentProcessed = (paymentId: string) => {
    console.log('تم معالجة الدفعة:', paymentId);
    setScanStats(prev => ({
      ...prev,
      successfulMatches: prev.successfulMatches + 1
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <PageHeader
        title="إدارة الفواتير التلقائية"
        description="مسح الفواتير تلقائياً وربطها بالعقود المناسبة"
        icon={<Scan className="h-6 w-6" />}
        align="center"
      />

      {/* بطاقات الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-blue-600">{scanStats.totalScanned}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مطابقة ناجحة</p>
                <p className="text-2xl font-bold text-green-600">{scanStats.successfulMatches}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Scan className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">تحتاج مراجعة</p>
                <p className="text-2xl font-bold text-yellow-600">{scanStats.pendingReview}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <History className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">اليوم</p>
                <p className="text-2xl font-bold text-purple-600">{scanStats.todayScans}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Scan className="h-4 w-4" />
            مسح فاتورة
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            السجل
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
          </TabsTrigger>
        </TabsList>

        {/* تبويبة المسح */}
        <TabsContent value="scanner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* منطقة المسح الرئيسية */}
            <div className="lg:col-span-2">
              <InvoiceScanner
                onScanComplete={handleScanComplete}
                onPaymentProcessed={handlePaymentProcessed}
                autoProcess={true}
              />
            </div>

            {/* نصائح وإرشادات */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 نصائح للحصول على أفضل النتائج</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">1</Badge>
                    <p>تأكد من وضوح الفاتورة وعدم وجود ظلال</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">2</Badge>
                    <p>تأكد من ظهور المبلغ واسم العميل أو رقم السيارة</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">3</Badge>
                    <p>أفضل دقة مع صور بدقة عالية (أكثر من 1080p)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">4</Badge>
                    <p>يمكن رفع صور JPG، PNG أو ملفات PDF</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 إحصائيات اليوم</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">فواتير ممسوحة:</span>
                    <Badge variant="secondary">{scanStats.todayScans}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">معدل النجاح:</span>
                    <Badge variant="default">
                      {Math.round((scanStats.successfulMatches / scanStats.totalScanned) * 100)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">متوسط وقت المعالجة:</span>
                    <Badge variant="outline">3.2 ثانية</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🚀 إجراءات سريعة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <History className="mr-2 h-4 w-4" />
                    عرض آخر 10 فواتير
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    تصدير تقرير اليوم
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    إعدادات المسح
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* تبويبة السجل */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>سجل الفواتير الممسوحة</CardTitle>
              <CardDescription>
                جميع الفواتير التي تم مسحها ومعالجتها في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">قريباً</h3>
                <p className="text-gray-600">
                  سيتم إضافة سجل تفصيلي للفواتير الممسوحة
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويبة التحليلات */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>أداء المسح</CardTitle>
                <CardDescription>إحصائيات دقة وسرعة المسح</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>دقة استخراج المبالغ:</span>
                    <Badge variant="default">95%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>دقة مطابقة العقود:</span>
                    <Badge variant="default">87%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>متوسط وقت المعالجة:</span>
                    <Badge variant="secondary">3.2 ثانية</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>معدل الأخطاء:</span>
                    <Badge variant="destructive">2%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إحصائيات الاستخدام</CardTitle>
                <CardDescription>بيانات الاستخدام اليومي والشهري</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>فواتير اليوم:</span>
                    <Badge variant="default">{scanStats.todayScans}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>هذا الأسبوع:</span>
                    <Badge variant="secondary">24</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>هذا الشهر:</span>
                    <Badge variant="secondary">156</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>وقت توفير مقدر:</span>
                    <Badge variant="default">12 ساعة</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>أنواع الفواتير الأكثر شيوعاً</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">67%</div>
                    <div className="text-sm text-gray-600">إيجار شهري</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">18%</div>
                    <div className="text-sm text-gray-600">مخالفات مرورية</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">15%</div>
                    <div className="text-sm text-gray-600">صيانة</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* تبويبة الإعدادات */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات المسح</CardTitle>
                <CardDescription>تخصيص خيارات مسح الفواتير</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">دقة المسح</label>
                  <div className="flex gap-2">
                    <Badge variant="default">عالية</Badge>
                    <Badge variant="outline">متوسطة</Badge>
                    <Badge variant="outline">سريعة</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">اللغات المدعومة</label>
                  <div className="flex gap-2">
                    <Badge variant="default">العربية</Badge>
                    <Badge variant="default">English</Badge>
                    <Badge variant="outline">Français</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">حد الثقة للمطابقة التلقائية</label>
                  <div className="flex gap-2">
                    <Badge variant="outline">60%</Badge>
                    <Badge variant="default">80%</Badge>
                    <Badge variant="outline">90%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات المعالجة</CardTitle>
                <CardDescription>خيارات معالجة الفواتير والدفعات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">معالجة تلقائية للعقود عالية الثقة</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">حساب غرامات التأخير تلقائياً</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">إشعارات العمليات الناجحة</span>
                  <Badge variant="default">مفعل</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">حفظ صور الفواتير الأصلية</span>
                  <Badge variant="outline">معطل</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>حالة النظام</CardTitle>
                <CardDescription>معلومات حالة خدمات المسح</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Google Vision API</span>
                    <Badge variant="default">متصل</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">قاعدة البيانات</span>
                    <Badge variant="default">متصل</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">خدمة المطابقة</span>
                    <Badge variant="secondary">بطيء</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 