// أنواع البيانات الخاصة بتكامل ChatGPT مع نظام الفواتير

import { InvoiceData, ExtractedField } from './invoice-types';

export interface ChatGPTProcessingStats {
  usesChatGPT: boolean;
  chatgptSuccess: boolean;
  chatgptConfidence: number;
  chatgptProcessingTime: number;
  fallbackUsed: boolean;
  aiAnalysis?: string;
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost: number; // بالدولار الأمريكي
  };
}

export interface EnhancedInvoiceResult {
  // النتائج الأساسية
  success: boolean;
  data?: InvoiceData;
  confidence: number;
  processingTime: number;
  error?: string;
  
  // إحصائيات ChatGPT
  chatgptStats: ChatGPTProcessingStats;
  
  // معلومات إضافية
  method: 'chatgpt' | 'traditional' | 'hybrid';
  qualityScore: number; // نقاط الجودة من 0-100
  recommendations?: string[]; // توصيات للتحسين
  
  // الحقول المستخرجة
  extractedFields?: {
    amount?: ExtractedField;
    date?: ExtractedField;
    customerName?: ExtractedField;
    vehiclePlate?: ExtractedField;
    invoiceNumber?: ExtractedField;
  };
}

export interface InvoiceAnalysisConfig {
  // إعدادات ChatGPT
  enableChatGPT: boolean;
  fallbackToTraditional: boolean;
  maxRetries: number;
  timeoutMs: number;
  
  // إعدادات الجودة
  minConfidenceThreshold: number;
  requireMandatoryFields: string[];
  
  // إعدادات التكلفة
  enableCostTracking: boolean;
  maxTokensPerRequest: number;
}

export interface ProcessingMetrics {
  startTime: number;
  endTime: number;
  totalProcessingTime: number;
  ocrTime: number;
  analysisTime: number;
  chatgptTime?: number;
  matchingTime: number;
  validationTime: number;
}

export interface QualityAssessment {
  dataCompleteness: number; // نسبة اكتمال البيانات
  dataAccuracy: number; // دقة البيانات المقدرة
  overallQuality: number; // الجودة الإجمالية
  missingFields: string[]; // الحقول المفقودة
  potentialIssues: string[]; // المشاكل المحتملة
}

export interface CostAnalysis {
  currentRequestCost: number;
  dailyTotalCost: number;
  monthlyTotalCost: number;
  averageCostPerInvoice: number;
  tokenEfficiency: number; // tokens per dollar
}

// إعدادات افتراضية محسنة
export const DEFAULT_INVOICE_CONFIG: InvoiceAnalysisConfig = {
  enableChatGPT: true,
  fallbackToTraditional: true,
  maxRetries: 2,
  timeoutMs: 15000, // 15 ثانية
  minConfidenceThreshold: 75,
  requireMandatoryFields: ['amount', 'date'],
  enableCostTracking: true,
  maxTokensPerRequest: 1000
};

// تقدير التكلفة (GPT-3.5-turbo)
export const CHATGPT_PRICING = {
  inputTokenCost: 0.0005 / 1000, // $0.0005 per 1K tokens
  outputTokenCost: 0.0015 / 1000, // $0.0015 per 1K tokens
  maxDailyCost: 10.0, // حد أقصى $10 يومياً
  maxMonthlyCost: 200.0 // حد أقصى $200 شهرياً
};

export type InvoiceProcessingMethod = 'chatgpt-primary' | 'traditional-primary' | 'hybrid' | 'chatgpt-only' | 'traditional-only';

export interface MethodSelectionCriteria {
  fileSize: number;
  complexity: 'simple' | 'medium' | 'complex';
  language: 'arabic' | 'english' | 'mixed';
  urgency: 'low' | 'medium' | 'high';
  costSensitivity: boolean;
} 