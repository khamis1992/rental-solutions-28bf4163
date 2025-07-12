import { toast } from '@/hooks/use-toast';

/**
 * Enhanced error handler with better diagnostics and user-friendly messages
 */
export class EnhancedErrorHandler {
  static handleOCRError(error: any, context?: string): void {
    console.error('OCR Error:', error);
    
    let userMessage = 'فشل في قراءة الصورة';
    let suggestion = 'يرجى المحاولة مرة أخرى أو إدخال البيانات يدوياً';
    
    // Analyze error type
    if (error?.message?.includes('API key')) {
      userMessage = 'خطأ في إعدادات النظام';
      suggestion = 'يرجى التواصل مع المطور لإعداد مفاتيح API';
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      userMessage = 'مشكلة في الاتصال';
      suggestion = 'يرجى التحقق من الإنترنت والمحاولة مرة أخرى';
    } else if (error?.status === 400) {
      userMessage = 'ملف غير مدعوم';
      suggestion = 'يرجى استخدام صورة واضحة للعقد';
    } else if (error?.status === 429) {
      userMessage = 'تم تجاوز الحد المسموح';
      suggestion = 'يرجى المحاولة بعد دقائق قليلة';
    }
    
    toast({
      title: userMessage,
      description: suggestion,
      variant: 'destructive',
      duration: 5000,
    });
  }
  
  static handleOpenAIError(error: any): void {
    console.error('OpenAI Error:', error);
    
    let userMessage = 'فشل في تحليل النص';
    let suggestion = 'سيتم استخدام الطريقة التقليدية للاستخراج';
    
    if (error?.message?.includes('API key')) {
      userMessage = 'خطأ في إعدادات الذكاء الاصطناعي';
      suggestion = 'يرجى التواصل مع المطور لإعداد OpenAI';
    } else if (error?.status === 429) {
      userMessage = 'تم تجاوز حد استخدام الذكاء الاصطناعي';
      suggestion = 'سيتم استخدام الطريقة التقليدية';
    }
    
    toast({
      title: userMessage,
      description: suggestion,
      variant: 'default',
      duration: 4000,
    });
  }
  
  static showSuccessMessage(confidence: number): void {
    if (confidence > 80) {
      toast({
        title: 'تم استخراج البيانات بنجاح! 🎉',
        description: `دقة الاستخراج: ${confidence}% - البيانات موثوقة`,
        variant: 'default',
        duration: 3000,
      });
    } else if (confidence > 50) {
      toast({
        title: 'تم استخراج البيانات جزئياً ⚠️',
        description: `دقة الاستخراج: ${confidence}% - يرجى مراجعة البيانات`,
        variant: 'default',
        duration: 4000,
      });
    } else {
      toast({
        title: 'تم إنشاء نموذج فارغ 📝',
        description: 'يرجى ملء البيانات يدوياً',
        variant: 'default',
        duration: 3000,
      });
    }
  }
}