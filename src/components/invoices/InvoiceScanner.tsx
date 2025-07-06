import React, { useCallback, useState } from 'react';
import { Upload, FileText, Camera, Scan, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { useInvoiceScanner } from '@/hooks/use-invoice-scanner';
import { formatAmount, formatArabicDate } from '@/utils/invoice-utils';
import { ProcessingStep } from '@/types/invoice-types';

interface InvoiceScannerProps {
  onScanComplete?: (result: any) => void;
  onPaymentProcessed?: (paymentId: string) => void;
  autoProcess?: boolean;
  className?: string;
}

export function InvoiceScanner({ 
  onScanComplete, 
  onPaymentProcessed, 
  autoProcess = false,
  className = ""
}: InvoiceScannerProps) {
  const {
    isScanning,
    processingStatus,
    ocrResult,
    matchResult,
    paymentData,
    scanInvoice,
    selectAgreement,
    confirmPayment,
    reset,
    error,
    validationResult
  } = useInvoiceScanner();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // إعداد dropzone لرفع الملفات
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: handleFileUpload
  });

  /**
   * معالجة رفع الملف
   */
  async function handleFileUpload(files: File[]) {
    const file = files[0];
    if (!file) return;

    setSelectedFile(file);
    await scanInvoice(file, {
      maxFileSize: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      autoMatch: true,
      minConfidence: 0.6,
      enhanceImage: true,
      languageHints: ['ar', 'en']
    });

    if (onScanComplete) {
      onScanComplete({ file, ocrResult, matchResult });
    }
  }

  /**
   * معالجة اختيار عقد
   */
  const handleAgreementSelect = async (agreementId: string) => {
    await selectAgreement(agreementId);
  };

  /**
   * معالجة تأكيد الدفعة
   */
  const handlePaymentConfirm = async () => {
    await confirmPayment();
    
    if (onPaymentProcessed && paymentData) {
      // سيتم استدعاؤها بعد نجاح المعالجة
      setTimeout(() => {
        if (paymentData.processingStatus === 'completed') {
          onPaymentProcessed('success');
        }
      }, 1000);
    }
  };

  /**
   * إعادة تعيين المكون
   */
  const handleReset = () => {
    setSelectedFile(null);
    reset();
  };

  /**
   * الحصول على أيقونة المرحلة
   */
  const getStepIcon = (step: ProcessingStep) => {
    const icons = {
      uploading: Upload,
      scanning: Scan,
      extracting: FileText,
      matching: Zap,
      calculating: Clock,
      confirming: CheckCircle,
      processing: Clock,
      completed: CheckCircle
    };
    return icons[step] || FileText;
  };

  /**
   * الحصول على لون التقدم
   */
  const getProgressColor = () => {
    if (error) return 'bg-red-500';
    if (processingStatus.currentStep === 'completed') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* منطقة رفع الملف */}
      {!ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5 text-blue-600" />
              مسح فاتورة تلقائي
            </CardTitle>
            <CardDescription>
              ارفع صورة الفاتورة أو اسحبها هنا لمسحها تلقائياً واستخراج البيانات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
                }
                ${isScanning ? 'pointer-events-none opacity-50' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  {isScanning ? (
                    <div className="animate-spin">
                      <Scan className="h-12 w-12 text-blue-600" />
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Upload className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                </div>
                
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isDragActive 
                      ? 'أفلت الملف هنا...' 
                      : isScanning 
                        ? 'جاري المسح...'
                        : 'اسحب الفاتورة هنا أو انقر للاختيار'
                    }
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    يدعم صور JPG, PNG وملفات PDF (حتى 10 ميجابايت)
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* شريط التقدم */}
      {(isScanning || ocrResult) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const StepIcon = getStepIcon(processingStatus.currentStep);
                    return <StepIcon className="h-5 w-5 text-blue-600" />;
                  })()}
                  <span className="font-medium">{processingStatus.message}</span>
                </div>
                <Badge variant={error ? "destructive" : "secondary"}>
                  {processingStatus.progress}%
                </Badge>
              </div>
              
              <Progress 
                value={processingStatus.progress} 
                className={`h-2 ${getProgressColor()}`}
              />
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* نتائج المسح */}
      {ocrResult && ocrResult.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              نتائج المسح
            </CardTitle>
            <CardDescription>
              تم استخراج البيانات التالية من الفاتورة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ocrResult.data?.amount && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">المبلغ</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatAmount(ocrResult.data.amount)}
                  </p>
                </div>
              )}
              
              {ocrResult.data?.date && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">التاريخ</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatArabicDate(ocrResult.data.date)}
                  </p>
                </div>
              )}
              
              {ocrResult.data?.customerName && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">اسم العميل</p>
                  <p className="text-lg font-bold text-purple-700">
                    {String(ocrResult.data.customerName || 'غير محدد')}
                  </p>
                </div>
              )}
              
              {ocrResult.data?.vehiclePlate && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">رقم السيارة</p>
                  <p className="text-lg font-bold text-orange-700">
                    {String(ocrResult.data.vehiclePlate || 'غير محدد')}
                  </p>
                </div>
              )}
            </div>

            {ocrResult.confidence && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">دقة المسح</span>
                  <Badge variant={ocrResult.confidence > 0.8 ? "default" : "secondary"}>
                    {Math.round(ocrResult.confidence * 100)}%
                  </Badge>
                </div>
                <Progress value={ocrResult.confidence * 100} className="mt-2 h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* نتائج المطابقة */}
      {matchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              العقد المطابق
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchResult.agreement ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-green-800">
                      عقد رقم {matchResult.agreement.agreement_number}
                    </h4>
                    <Badge variant="default">
                      {Math.round(matchResult.confidence * 100)}% مطابقة
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">العميل: </span>
                      <span className="font-medium">{String(matchResult.agreement.customer_name || 'غير محدد')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">المركبة: </span>
                      <span className="font-medium">{String(matchResult.agreement.vehicle_info || 'غير محدد')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">رقم السيارة: </span>
                      <span className="font-medium">{String(matchResult.agreement.license_plate || 'غير محدد')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">قيمة الإيجار: </span>
                      <span className="font-medium">{formatAmount(matchResult.agreement.rent_amount || 0)}</span>
                    </div>
                  </div>
                </div>

                {!paymentData && (
                  <Button 
                    onClick={() => handleAgreementSelect(matchResult.agreement!.id)}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    تأكيد العقد وحساب الدفعة
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لم يتم العثور على عقد مطابق
                </h3>
                <p className="text-gray-600 mb-4">
                  لم نتمكن من إيجاد عقد مطابق تلقائياً. يرجى المراجعة اليدوية.
                </p>
                {/* يمكن إضافة قائمة للاختيار اليدوي هنا */}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* تأكيد الدفعة */}
      {paymentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              تأكيد الدفعة
            </CardTitle>
            <CardDescription>
              مراجعة تفاصيل الدفعة قبل التسجيل النهائي
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">مبلغ الدفعة</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatAmount(paymentData.amount)}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">تاريخ الدفعة</p>
                  <p className="text-lg font-bold text-gray-700">
                    {formatArabicDate(paymentData.paymentDate.toISOString().split('T')[0])}
                  </p>
                </div>

                {paymentData.isLate && (
                  <>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">أيام التأخير</p>
                      <p className="text-lg font-bold text-red-700">
                        {paymentData.daysLate} يوم
                      </p>
                    </div>
                    
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">غرامة التأخير</p>
                      <p className="text-lg font-bold text-red-700">
                        {formatAmount(paymentData.lateFeeAmount)}
                      </p>
                    </div>
                  </>
                )}
                
                <div className="p-3 bg-green-50 rounded-lg md:col-span-2">
                  <p className="text-sm text-gray-600">المجموع النهائي</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatAmount(paymentData.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handlePaymentConfirm}
                  className="flex-1"
                  size="lg"
                  disabled={paymentData.processingStatus === 'processing'}
                >
                  {paymentData.processingStatus === 'processing' ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      جاري التسجيل...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      تأكيد وتسجيل الدفعة
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  disabled={paymentData.processingStatus === 'processing'}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* أزرار الإجراءات */}
      {ocrResult && !paymentData && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            مسح جديد
          </Button>
        </div>
      )}
    </div>
  );
} 