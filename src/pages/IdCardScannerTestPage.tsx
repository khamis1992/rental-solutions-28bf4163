import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import CustomerFormWithIdScanner from '@/components/customers/CustomerFormWithIdScanner';
import IdCardScanner from '@/components/customers/IdCardScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTab 
} from '@/components/ui/tabs';
import {
  CreditCard,
  User,
  TestTube,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { ExtractedIdData } from '@/hooks/use-id-card-scanner';

const IdCardScannerTestPage: React.FC = () => {
  const [extractedData, setExtractedData] = useState<ExtractedIdData | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  // معالجة استخراج البيانات من المسح
  const handleDataExtracted = (data: ExtractedIdData) => {
    setExtractedData(data);
    setTestResults(prev => [...prev, {
      timestamp: new Date().toLocaleString('ar-QA'),
      confidence: data.confidence,
      extractedFields: Object.keys(data).length,
      success: true
    }]);
    toast.success(`تم استخراج البيانات بنجاح! دقة: ${data.confidence}%`);
  };

  // معالجة حفظ العميل
  const handleCustomerSubmit = async (data: any) => {
    console.log('بيانات العميل:', data);
    toast.success('تم حفظ بيانات العميل بنجاح!');
    
    // إضافة للنتائج
    setTestResults(prev => [...prev, {
      timestamp: new Date().toLocaleString('ar-QA'),
      action: 'حفظ عميل',
      data: Object.keys(data).length + ' حقل',
      success: true
    }]);
  };

  // مسح النتائج
  const clearResults = () => {
    setTestResults([]);
    setExtractedData(null);
    toast.info('تم مسح جميع النتائج');
  };

  return (
    <PageContainer
      title="اختبار نظام مسح البطاقة الشخصية"
      description="صفحة اختبار وتجريب لنظام مسح البطاقة الشخصية القطرية"
    >
      <div className="space-y-6" dir="rtl">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">عدد الاختبارات</p>
                  <p className="text-xl font-bold">{testResults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">نجح</p>
                  <p className="text-xl font-bold text-green-600">
                    {testResults.filter(r => r.success).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">دقة متوسطة</p>
                  <p className="text-xl font-bold text-purple-600">
                    {testResults.length > 0 
                      ? Math.round(testResults.reduce((acc, r) => acc + (r.confidence || 0), 0) / testResults.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">آخر نتيجة</p>
                  <p className="text-xl font-bold text-orange-600">
                    {extractedData ? `${extractedData.confidence}%` : '--'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات الرئيسية */}
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-3" dir="rtl">
            <TabsTab value="scanner" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              مسح البطاقة
            </TabsTab>
            <TabsTab value="form" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              نموذج العميل
            </TabsTab>
            <TabsTab value="results" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              النتائج
            </TabsTab>
          </TabsList>

          {/* تبويب مسح البطاقة */}
          <TabsContent value="scanner" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                هذا مسح تجريبي للبطاقة الشخصية القطرية. النظام يستخدم بيانات محاكاة للاختبار.
              </AlertDescription>
            </Alert>

            <IdCardScanner
              onDataExtracted={handleDataExtracted}
              isArabic={true}
            />

            {/* عرض البيانات المستخرجة */}
            {extractedData && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    آخر بيانات مستخرجة
                    <Badge variant="secondary" className="mr-2">
                      {extractedData.confidence}% دقة
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p><strong>الاسم:</strong> {extractedData.fullName}</p>
                    <p><strong>رقم الهوية:</strong> {extractedData.idNumber}</p>
                    <p><strong>الجنسية:</strong> {extractedData.nationality}</p>
                    <p><strong>تاريخ الميلاد:</strong> {extractedData.dateOfBirth}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>تاريخ الانتهاء:</strong> {extractedData.expiryDate}</p>
                    <p><strong>الهاتف:</strong> {extractedData.phoneNumber}</p>
                    <p><strong>الجنس:</strong> {extractedData.gender}</p>
                    <p><strong>العنوان:</strong> {extractedData.address}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* تبويب نموذج العميل */}
          <TabsContent value="form" className="space-y-6">
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                نموذج إضافة عميل جديد مع إمكانية مسح البطاقة الشخصية المدمجة.
              </AlertDescription>
            </Alert>

            <CustomerFormWithIdScanner
              onSubmit={handleCustomerSubmit}
              isArabic={true}
            />
          </TabsContent>

          {/* تبويب النتائج */}
          <TabsContent value="results" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">سجل الاختبارات</h3>
              <Button variant="outline" onClick={clearResults}>
                مسح النتائج
              </Button>
            </div>

            {testResults.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">لا توجد نتائج اختبار بعد</p>
                  <p className="text-sm text-muted-foreground">
                    قم بتجربة مسح البطاقة أو ملء النموذج لرؤية النتائج
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {testResults.map((result, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">
                              {result.action || 'مسح البطاقة'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {result.timestamp}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.confidence && (
                            <Badge variant="secondary">
                              {result.confidence}% دقة
                            </Badge>
                          )}
                          {result.extractedFields && (
                            <Badge variant="outline">
                              {result.extractedFields} حقل
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* معلومات النظام */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              معلومات النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">الميزات المدعومة:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• مسح البطاقة الشخصية القطرية</li>
                  <li>• استخراج البيانات تلقائياً</li>
                  <li>• التحقق من صحة البيانات</li>
                  <li>• دعم الكاميرا ورفع الصور</li>
                  <li>• ملء النموذج تلقائياً</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">البيانات المستخرجة:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• الاسم الكامل</li>
                  <li>• رقم الهوية (11 رقم)</li>
                  <li>• الجنسية</li>
                  <li>• تاريخ الميلاد والانتهاء</li>
                  <li>• رقم الهاتف والعنوان</li>
                  <li>• الجنس وبيانات QR</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default IdCardScannerTestPage; 