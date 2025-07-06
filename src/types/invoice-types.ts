// أنواع البيانات المحسنة للفواتير مع دعم ChatGPT

export interface ExtractedField {
  value: string | number;
  confidence: number;
  source: string;
}

// أنواع البيانات لنظام مسح الفواتير التلقائي
export interface InvoiceData {
  // البيانات الأساسية المستخرجة من الفاتورة
  amount: number;           // قيمة الفاتورة
  customerName?: string;    // اسم العميل
  vehiclePlate?: string;    // رقم السيارة/اللوحة
  date: string;            // تاريخ الفاتورة
  invoiceNumber?: string;   // رقم الفاتورة
  paymentMethod?: string;   // طريقة الدفع
  description?: string;     // وصف الدفع أو ملاحظات
  
  // بيانات إضافية
  merchantName?: string;    // اسم التاجر/المؤسسة
  location?: string;       // موقع الدفع
  currency?: string;       // العملة (افتراضي QAR)
  
  // معلومات التصنيف
  category?: 'إيجار' | 'صيانة' | 'وقود' | 'غرامة' | 'تأمين' | 'غير محدد';
  isReceipt?: boolean;     // هل هي إيصال أم فاتورة
}

export interface InvoiceOcrResult {
  success: boolean;
  data?: InvoiceData;
  confidence: number;
  rawText?: string;
  extractedFields: {
    amount?: ExtractedField;
    date?: ExtractedField;
    customerName?: ExtractedField;
    vehiclePlate?: ExtractedField;
    invoiceNumber?: ExtractedField;
  };
  processingTime: number;
  error?: string;
  // معلومات إضافية للنظام المحسن
  enhancedStats?: {
    usesChatGPT: boolean;
    chatgptSuccess: boolean;
    chatgptConfidence: number;
    method: 'chatgpt' | 'traditional' | 'hybrid';
    qualityScore: number;
    ocrTime: number;
    analysisTime: number;
    fallbackUsed: boolean;
  };
}

export interface InvoiceScanOptions {
  maxFileSize?: number; // MB
  allowedTypes?: string[];
  useAI?: boolean;
  confidenceThreshold?: number;
  
  // خيارات OCR إضافية
  languageHints?: string[]; // لغات المسح
  enhanceImage?: boolean;   // تحسين جودة الصورة
  
  // خيارات المطابقة
  autoMatch?: boolean;      // مطابقة تلقائية
  minConfidence?: number;   // أقل نسبة ثقة مقبولة
  
  // خيارات التحليل
  analyzeStructure?: boolean; // تحليل بنية الفاتورة
  extractMetadata?: boolean;  // استخراج البيانات الوصفية
}

export interface InvoiceMatchResult {
  agreement?: {
    id: string;
    agreement_number: string;
    customer_name: string;
    vehicle_info: string;
    license_plate: string;
    rent_amount: number;
    status: string;
  };
  
  matchMethod: 'vehicle_plate' | 'customer_name' | 'manual_selection' | 'none';
  confidence: number;
  alternatives?: Array<{
    id: string;
    agreement_number: string;
    customer_name: string;
    vehicle_info: string;
    matchScore: number;
    matchReason: string;
  }>;
}

export interface PaymentProcessingData {
  // بيانات العقد
  agreementId: string;
  
  // بيانات الدفعة
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber?: string;
  description: string;
  
  // حساب غرامات التأخير
  isLate: boolean;
  daysLate: number;
  lateFeeAmount: number;
  
  // المجموع النهائي
  totalAmount: number;
  
  // حالة المعالجة
  processingStatus: 'pending' | 'confirmed' | 'processing' | 'completed' | 'failed';
  notes?: string;
}

export interface InvoiceValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completeness: number; // 0-100%
  suggestions?: string[];
  
  // التحقق من البيانات المطلوبة
  hasAmount: boolean;
  hasDate: boolean;
  hasValidCustomerOrVehicle: boolean;
  
  // التحقق من المنطق
  isAmountReasonable: boolean;
  isDateValid: boolean;
  isWithinExpectedRange: boolean;
}

export interface InvoiceProcessingStatus {
  step: 'uploading' | 'scanning' | 'analyzing' | 'matching' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100%
  message: string;
  details?: any;
}

// أنواع إضافية للاختبار والتطوير
export interface MockInvoiceData {
  id: string;
  scenario: string;
  ocrText: string;
  expectedResult: InvoiceData;
  difficulty: 'easy' | 'medium' | 'hard';
}

// أنواع الأخطاء
export type InvoiceError = 
  | 'SCAN_FAILED'
  | 'INVALID_IMAGE'
  | 'NO_TEXT_DETECTED'
  | 'INSUFFICIENT_DATA'
  | 'AMOUNT_NOT_FOUND'
  | 'DATE_INVALID'
  | 'NO_MATCHING_AGREEMENT'
  | 'MULTIPLE_MATCHES_FOUND'
  | 'PAYMENT_ALREADY_EXISTS'
  | 'AGREEMENT_INACTIVE'
  | 'NETWORK_ERROR'
  | 'PROCESSING_ERROR';

// حالات المعالجة
export type ProcessingStep = 
  | 'uploading'
  | 'scanning'
  | 'extracting'
  | 'matching'
  | 'calculating'
  | 'confirming'
  | 'processing'
  | 'completed';

export interface ProcessingStatus {
  currentStep: ProcessingStep;
  progress: number; // 0-100
  message: string;
  isLoading: boolean;
  error?: string;
}

// إعدادات النظام
export interface InvoiceSystemSettings {
  // إعدادات OCR
  ocrProvider: 'google_vision' | 'tesseract';
  ocrApiKey?: string;
  
  // إعدادات المطابقة
  autoMatchThreshold: number;        // نسبة الثقة للمطابقة التلقائية
  requireManualConfirmation: boolean; // يتطلب تأكيد يدوي
  
  // إعدادات الدفع
  allowLateFeeAdjustment: boolean;   // السماح بتعديل غرامة التأخير
  defaultPaymentMethod: string;      // طريقة الدفع الافتراضية
  
  // إعدادات الأمان
  requireApproval: boolean;          // يتطلب موافقة
  maxDailyProcessing: number;        // حد أقصى للمعالجة اليومية
  
  // إعدادات الإشعارات
  notifyOnSuccess: boolean;
  notifyOnError: boolean;
  notifyOnManualReview: boolean;
}

// سجل العمليات
export interface InvoiceProcessingLog {
  id: string;
  timestamp: Date;
  invoiceData: InvoiceData;
  matchResult: InvoiceMatchResult;
  paymentData?: PaymentProcessingData;
  status: 'success' | 'failed' | 'pending_review';
  processingTime: number;
  userId: string;
  notes?: string;
  errorDetails?: string;
} 