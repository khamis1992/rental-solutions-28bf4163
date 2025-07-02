import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Brain,
  Database,
  Zap,
  TrendingUp,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { 
  calculateSmartPaymentStats,
  updatePaymentStatuses,
  type PaymentData 
} from '../../utils/smart-payment-analysis';

interface UpdateResult {
  agreementId: string;
  agreementNumber: string;
  customerName: string;
  totalPayments: number;
  updatedPayments: number;
  conflictsFound: number;
  errors: string[];
  status: 'success' | 'partial' | 'failed';
}

interface SystemStats {
  totalAgreements: number;
  totalPayments: number;
  totalUpdated: number;
  totalConflicts: number;
  totalErrors: number;
  completedAgreements: number;
}

export default function SmartPaymentSystemUpdater() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAgreement, setCurrentAgreement] = useState<string>('');
  const [results, setResults] = useState<UpdateResult[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalAgreements: 0,
    totalPayments: 0,
    totalUpdated: 0,
    totalConflicts: 0,
    totalErrors: 0,
    completedAgreements: 0
  });
  const [showDetails, setShowDetails] = useState(false);

  // تشغيل التحديث الشامل
  const runSystemUpdate = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setSystemStats({
      totalAgreements: 0,
      totalPayments: 0,
      totalUpdated: 0,
      totalConflicts: 0,
      totalErrors: 0,
      completedAgreements: 0
    });

    try {
      console.log('🚀 بدء النظام الذكي الشامل لتحديث جميع العقود...');
      toast.info('بدء تحليل وتحديث جميع العقود في النظام...');

             // جلب جميع العقود مع دفعاتها
       const { data: agreements, error } = await supabase
         .from('leases')
         .select(`
           id,
           agreement_number,
           profiles:customer_id(full_name),
           payments(*)
         `)
         .not('payments', 'is', null);

      if (error) {
        throw new Error(`خطأ في جلب العقود: ${error.message}`);
      }

      if (!agreements || agreements.length === 0) {
        toast.warning('لا توجد عقود للمعالجة');
        return;
      }

      console.log(`📊 تم العثور على ${agreements.length} عقد للمعالجة`);
      
      const newStats: SystemStats = {
        totalAgreements: agreements.length,
        totalPayments: 0,
        totalUpdated: 0,
        totalConflicts: 0,
        totalErrors: 0,
        completedAgreements: 0
      };

      const updateResults: UpdateResult[] = [];

      // معالجة كل عقد
      for (let i = 0; i < agreements.length; i++) {
        const agreement = agreements[i];
        const progressPercent = Math.round(((i + 1) / agreements.length) * 100);
        
        setProgress(progressPercent);
        setCurrentAgreement(`${agreement.agreement_number} - ${agreement.profiles?.[0]?.full_name || 'عميل غير محدد'}`);

        console.log(`\n📋 معالجة العقد ${i + 1}/${agreements.length}: ${agreement.agreement_number}`);

        try {
          const payments = agreement.payments || [];
          newStats.totalPayments += payments.length;

          if (payments.length === 0) {
            updateResults.push({
              agreementId: agreement.id,
              agreementNumber: agreement.agreement_number,
              customerName: agreement.profiles?.[0]?.full_name || 'غير محدد',
              totalPayments: 0,
              updatedPayments: 0,
              conflictsFound: 0,
              errors: [],
              status: 'success'
            });
            continue;
          }

          // تحويل البيانات للنوع المطلوب
          const smartPayments: PaymentData[] = payments.map(p => ({
            id: p.id,
            amount: p.amount,
            due_date: p.due_date,
            status: p.status,
            description: p.description || '',
            created_at: p.created_at || ''
          }));

          // تحليل الدفعات
          const smartStats = calculateSmartPaymentStats(smartPayments);
          newStats.totalConflicts += smartStats.counts.conflicts;

          // تحديث الدفعات المتضاربة
          const updateResult = await updatePaymentStatuses(smartPayments, supabase);
          
          newStats.totalUpdated += updateResult.updated;
          newStats.totalErrors += updateResult.errors.length;

          updateResults.push({
            agreementId: agreement.id,
            agreementNumber: agreement.agreement_number,
            customerName: agreement.profiles?.[0]?.full_name || 'غير محدد',
            totalPayments: payments.length,
            updatedPayments: updateResult.updated,
            conflictsFound: smartStats.counts.conflicts,
            errors: updateResult.errors,
            status: updateResult.errors.length === 0 ? 'success' : 
                   updateResult.updated > 0 ? 'partial' : 'failed'
          });

          console.log(`✅ تم معالجة العقد ${agreement.agreement_number}: ${updateResult.updated} تحديث`);

        } catch (error) {
          console.error(`❌ خطأ في معالجة العقد ${agreement.agreement_number}:`, error);
          
          updateResults.push({
            agreementId: agreement.id,
            agreementNumber: agreement.agreement_number,
            customerName: agreement.profiles?.[0]?.full_name || 'غير محدد',
            totalPayments: agreement.payments?.length || 0,
            updatedPayments: 0,
            conflictsFound: 0,
            errors: [`خطأ في المعالجة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
            status: 'failed'
          });

          newStats.totalErrors++;
        }

        newStats.completedAgreements = i + 1;
        setSystemStats({...newStats});
        
        // تأخير قصير لتجنب إرهاق الخادم
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setResults(updateResults);
      setCurrentAgreement('اكتمل التحديث');
      
      // عرض النتائج النهائية
      const successCount = updateResults.filter(r => r.status === 'success').length;
      const partialCount = updateResults.filter(r => r.status === 'partial').length;
      const failedCount = updateResults.filter(r => r.status === 'failed').length;

      console.log('\n🎉 اكتمل التحديث الشامل!');
      console.log(`📊 النتائج النهائية:`, {
        'إجمالي العقود': newStats.totalAgreements,
        'إجمالي الدفعات': newStats.totalPayments,
        'تم تحديثها': newStats.totalUpdated,
        'تضارب تم حله': newStats.totalConflicts,
        'عقود ناجحة': successCount,
        'عقود جزئية': partialCount,
        'عقود فاشلة': failedCount,
        'أخطاء': newStats.totalErrors
      });

      if (newStats.totalUpdated > 0) {
        toast.success(`🎉 تم تحديث ${newStats.totalUpdated} دفعة في ${successCount + partialCount} عقد بنجاح!`);
      } else if (newStats.totalConflicts === 0) {
        toast.success('✅ جميع الدفعات محدثة ولا تحتاج تغيير!');
      } else {
        toast.warning(`⚠️ تم العثور على ${newStats.totalConflicts} تضارب لكن لم يتم التحديث`);
      }

    } catch (error) {
      console.error('❌ خطأ شامل في النظام:', error);
      toast.error(`فشل في تحديث النظام: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'partial':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">النظام الذكي الشامل لتحديث الدفعات</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                تحديث حالات جميع الدفعات في النظام تلقائياً باستخدام التحليل الذكي
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* معلومات النظام */}
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>كيف يعمل النظام الذكي؟</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>يحلل أوصاف الدفعات لاستخراج التواريخ الصحيحة</li>
                  <li>يقارن تواريخ الاستحقاق مع التاريخ الحالي</li>
                  <li>يحدث حالات الدفعات (معلقة ← متأخرة) تلقائياً</li>
                  <li>يحافظ على الدفعات المدفوعة كما هي</li>
                  <li>ينشئ سجل مفصل لكل التحديثات</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* أزرار التحكم */}
            <div className="flex gap-3">
              <Button
                onClick={runSystemUpdate}
                disabled={isRunning}
                size="lg"
                className={`flex-1 ${isRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                    جاري التحديث الشامل...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 ml-2" />
                    تشغيل النظام الذكي الشامل
                  </>
                )}
              </Button>
              
              {results.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  size="lg"
                >
                  <FileText className="w-4 h-4 ml-2" />
                  {showDetails ? 'إخفاء' : 'عرض'} التفاصيل
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التقدم والحالة الحالية */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">التقدم الشامل</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {currentAgreement && (
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span>يتم معالجة: {currentAgreement}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* إحصائيات شاملة */}
      {(isRunning || results.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">العقود</p>
                  <p className="text-lg font-bold">{systemStats.totalAgreements}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">الدفعات</p>
                  <p className="text-lg font-bold">{systemStats.totalPayments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">تم التحديث</p>
                  <p className="text-lg font-bold text-green-600">{systemStats.totalUpdated}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-xs text-muted-foreground">تضارب</p>
                  <p className="text-lg font-bold text-yellow-600">{systemStats.totalConflicts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">مكتمل</p>
                  <p className="text-lg font-bold">{systemStats.completedAgreements}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">أخطاء</p>
                  <p className="text-lg font-bold text-red-600">{systemStats.totalErrors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* تفاصيل النتائج */}
      {showDetails && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>تقرير مفصل للنتائج</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={result.agreementId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.agreementNumber}</span>
                          <Badge variant="outline" className={getStatusColor(result.status)}>
                            {result.status === 'success' ? 'نجح' : 
                             result.status === 'partial' ? 'جزئي' : 'فشل'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          العميل: {result.customerName}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">الدفعات: </span>
                            <span className="font-medium">{result.totalPayments}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">محدث: </span>
                            <span className="font-medium text-green-600">{result.updatedPayments}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">تضارب: </span>
                            <span className="font-medium text-yellow-600">{result.conflictsFound}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">أخطاء: </span>
                            <span className="font-medium text-red-600">{result.errors.length}</span>
                          </div>
                        </div>

                        {result.errors.length > 0 && (
                          <div className="mt-2">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-red-600 font-medium">
                                عرض الأخطاء ({result.errors.length})
                              </summary>
                              <ul className="mt-2 space-y-1 text-red-600">
                                {result.errors.map((error, i) => (
                                  <li key={i} className="text-xs">• {error}</li>
                                ))}
                              </ul>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* ملخص النتائج */}
      {!isRunning && results.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">اكتمل التحديث الشامل!</h3>
              <p className="text-sm text-muted-foreground">
                تم معالجة {systemStats.totalAgreements} عقد و {systemStats.totalPayments} دفعة
              </p>
              {systemStats.totalUpdated > 0 && (
                <p className="text-sm font-medium text-green-600">
                  ✅ تم تحديث {systemStats.totalUpdated} دفعة بنجاح
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 