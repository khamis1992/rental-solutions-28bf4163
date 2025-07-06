import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { invoiceOcrService } from '../services/invoice-ocr';
import { invoiceMatcherService } from '../services/invoice-matcher';
import { 
  InvoiceData, 
  InvoiceOcrResult, 
  InvoiceMatchResult, 
  PaymentProcessingData,
  ProcessingStep,
  ProcessingStatus,
  InvoiceScanOptions
} from '../types/invoice-types';
import { 
  validateInvoiceData, 
  preparePaymentData, 
  processPayment,
  generateInvoiceSummary
} from '../utils/invoice-utils';

interface UseInvoiceScannerResult {
  // حالة المسح
  isScanning: boolean;
  processingStatus: ProcessingStatus;
  
  // النتائج
  ocrResult: InvoiceOcrResult | null;
  matchResult: InvoiceMatchResult | null;
  paymentData: PaymentProcessingData | null;
  
  // الوظائف
  scanInvoice: (file: File, options?: InvoiceScanOptions) => Promise<void>;
  selectAgreement: (agreementId: string) => Promise<void>;
  confirmPayment: () => Promise<void>;
  reset: () => void;
  
  // أخطاء وإشعارات
  error: string | null;
  validationResult: any;
}

export function useInvoiceScanner(): UseInvoiceScannerResult {
  const { toast } = useToast();
  
  // States الأساسية
  const [isScanning, setIsScanning] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    currentStep: 'uploading',
    progress: 0,
    message: 'في انتظار رفع الملف...',
    isLoading: false
  });
  
  // نتائج المعالجة
  const [ocrResult, setOcrResult] = useState<InvoiceOcrResult | null>(null);
  const [matchResult, setMatchResult] = useState<InvoiceMatchResult | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentProcessingData | null>(null);
  
  // إدارة الأخطاء
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  /**
   * تحديث حالة المعالجة
   */
  const updateProcessingStatus = useCallback((
    step: ProcessingStep, 
    progress: number, 
    message: string, 
    isLoading: boolean = true
  ) => {
    setProcessingStatus({
      currentStep: step,
      progress,
      message,
      isLoading,
      error: undefined
    });
  }, []);

  /**
   * إعادة تعيين جميع الحالات
   */
  const reset = useCallback(() => {
    setIsScanning(false);
    setOcrResult(null);
    setMatchResult(null);
    setPaymentData(null);
    setError(null);
    setValidationResult(null);
    setProcessingStatus({
      currentStep: 'uploading',
      progress: 0,
      message: 'في انتظار رفع الملف...',
      isLoading: false
    });
  }, []);

  /**
   * مسح الفاتورة الرئيسي
   */
  const scanInvoice = useCallback(async (file: File, options?: InvoiceScanOptions) => {
    try {
      setIsScanning(true);
      setError(null);
      
      // المرحلة 1: رفع الملف
      updateProcessingStatus('uploading', 10, 'جاري رفع الملف...');
      await new Promise(resolve => setTimeout(resolve, 500)); // تأخير بصري
      
      // المرحلة 2: مسح النص
      updateProcessingStatus('scanning', 25, 'جاري مسح الفاتورة...');
      const scanResult = await invoiceOcrService.scanInvoiceFromFile(file, options);
      
      if (!scanResult.success) {
        throw new Error(scanResult.error || 'فشل في مسح الفاتورة');
      }
      
      setOcrResult(scanResult);
      
      // المرحلة 3: استخراج البيانات
      updateProcessingStatus('extracting', 50, 'جاري استخراج البيانات...');
      
      if (!scanResult.data) {
        throw new Error('لم يتم استخراج بيانات صالحة من الفاتورة');
      }
      
      // التحقق من صحة البيانات
      const validation = validateInvoiceData(scanResult.data);
      setValidationResult(validation);
      
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        updateProcessingStatus('extracting', 50, 'خطأ في البيانات المستخرجة', false);
        return;
      }
      
      // المرحلة 4: البحث عن العقد المطابق
      updateProcessingStatus('matching', 75, 'جاري البحث عن العقد المناسب...');
      const matching = await invoiceMatcherService.findMatchingAgreement(scanResult.data);
      setMatchResult(matching);
      
      // المرحلة 5: اكتمال المسح
      updateProcessingStatus('completed', 100, 'تم مسح الفاتورة بنجاح!', false);
      
      // إشعار النجاح
      toast({
        title: "✅ تم مسح الفاتورة بنجاح",
        description: `تم استخراج ${Object.keys(scanResult.extractedFields).length} حقل من البيانات`,
        duration: 3000,
      });
      
      // إذا وُجد عقد مطابق بثقة عالية، حضر بيانات الدفعة
      if (matching.agreement && matching.confidence > 0.8) {
        await preparePaymentForAgreement(scanResult.data, matching.agreement.id);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف في المسح';
      setError(errorMessage);
      updateProcessingStatus('scanning', 0, `خطأ: ${errorMessage}`, false);
      
      toast({
        title: "❌ فشل في مسح الفاتورة",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast, updateProcessingStatus]);

  /**
   * اختيار عقد محدد للفاتورة
   */
  const selectAgreement = useCallback(async (agreementId: string) => {
    try {
      if (!ocrResult?.data) {
        throw new Error('لا توجد بيانات فاتورة لمعالجتها');
      }
      
      updateProcessingStatus('calculating', 25, 'جاري حساب تفاصيل الدفعة...');
      
      await preparePaymentForAgreement(ocrResult.data, agreementId);
      
      toast({
        title: "✅ تم اختيار العقد",
        description: "تم حساب تفاصيل الدفعة بنجاح",
        duration: 3000,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في اختيار العقد';
      setError(errorMessage);
      
      toast({
        title: "❌ خطأ في اختيار العقد",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [ocrResult, toast, updateProcessingStatus]);

  /**
   * تأكيد ومعالجة الدفعة
   */
  const confirmPayment = useCallback(async () => {
    try {
      if (!paymentData) {
        throw new Error('لا توجد بيانات دفعة لمعالجتها');
      }
      
      updateProcessingStatus('processing', 50, 'جاري تسجيل الدفعة في النظام...');
      
      const result = await processPayment(paymentData);
      
      if (!result.success) {
        throw new Error(result.message || 'فشل في تسجيل الدفعة');
      }
      
      updateProcessingStatus('completed', 100, 'تم تسجيل الدفعة بنجاح!', false);
      
      // إنشاء ملخص للدفعة
      if (ocrResult?.data) {
        const summary = generateInvoiceSummary(ocrResult.data, paymentData);
        console.log('ملخص الدفعة:', summary);
      }
      
      toast({
        title: "🎉 تم تسجيل الدفعة بنجاح",
        description: `رقم الدفعة: ${result.paymentId}`,
        duration: 5000,
      });
      
      // إعادة تعيين بعد النجاح
      setTimeout(() => {
        reset();
      }, 2000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في تسجيل الدفعة';
      setError(errorMessage);
      updateProcessingStatus('processing', 0, `خطأ: ${errorMessage}`, false);
      
      toast({
        title: "❌ فشل في تسجيل الدفعة",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [paymentData, ocrResult, toast, updateProcessingStatus, reset]);

  /**
   * تحضير بيانات الدفعة لعقد محدد
   */
  const preparePaymentForAgreement = useCallback(async (
    invoiceData: InvoiceData, 
    agreementId: string
  ) => {
    updateProcessingStatus('calculating', 50, 'جاري حساب غرامات التأخير...');
    
    const paymentResult = await preparePaymentData(invoiceData, agreementId);
    
    if ('error' in paymentResult) {
      throw new Error(paymentResult.message);
    }
    
    setPaymentData(paymentResult);
    updateProcessingStatus('confirming', 75, 'في انتظار تأكيد الدفعة...', false);
  }, [updateProcessingStatus]);

  return {
    // حالة المسح
    isScanning,
    processingStatus,
    
    // النتائج
    ocrResult,
    matchResult,
    paymentData,
    
    // الوظائف
    scanInvoice,
    selectAgreement,
    confirmPayment,
    reset,
    
    // أخطاء وإشعارات
    error,
    validationResult
  };
}

/**
 * Hook مبسط لمسح الفواتير فقط (بدون معالجة الدفعات)
 */
export function useInvoiceOCR() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InvoiceOcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const scanFile = useCallback(async (file: File, options?: InvoiceScanOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const scanResult = await invoiceOcrService.scanInvoiceFromFile(file, options);
      setResult(scanResult);
      
      if (!scanResult.success) {
        setError(scanResult.error || 'فشل في المسح');
      }
      
      return scanResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ في المسح';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);
  
  return {
    isLoading,
    result,
    error,
    scanFile,
    reset
  };
}

/**
 * Hook للبحث عن العقود المطابقة
 */
export function useAgreementMatcher() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<InvoiceMatchResult | null>(null);
  const [allAgreements, setAllAgreements] = useState<any[]>([]);
  
  const searchAgreements = useCallback(async (invoiceData: InvoiceData) => {
    try {
      setIsSearching(true);
      const matchResult = await invoiceMatcherService.findMatchingAgreement(invoiceData);
      setResults(matchResult);
      return matchResult;
    } catch (error) {
      console.error('خطأ في البحث عن العقود:', error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  const loadAllAgreements = useCallback(async () => {
    try {
      const agreements = await invoiceMatcherService.getAllActiveAgreements();
      setAllAgreements(agreements);
      return agreements;
    } catch (error) {
      console.error('خطأ في جلب العقود:', error);
      throw error;
    }
  }, []);
  
  const reset = useCallback(() => {
    setResults(null);
    setAllAgreements([]);
  }, []);
  
  return {
    isSearching,
    results,
    allAgreements,
    searchAgreements,
    loadAllAgreements,
    reset
  };
} 