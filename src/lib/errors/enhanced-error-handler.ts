import { toast } from '@/hooks/use-toast';

/**
 * Enhanced error handler with better diagnostics and user-friendly messages
 */
export class EnhancedErrorHandler {
  static handleOCRError(error: any, context?: string): void {
    console.error('🔍 OCR Error Analysis:', { error, context });
    
    let userMessage = 'فشل في قراءة الصورة';
    let suggestion = 'يرجى المحاولة مرة أخرى أو إدخال البيانات يدوياً';
    
    // Enhanced error analysis with more specific cases
    if (error?.message?.includes('API key') || error?.message?.includes('API not configured')) {
      userMessage = '⚙️ خطأ في إعدادات النظام';
      suggestion = 'مفاتيح API غير مُعدة. يرجى التواصل مع المطور لإعداد Google Vision API';
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch') || error?.name === 'NetworkError') {
      userMessage = '🌐 مشكلة في الاتصال';
      suggestion = 'يرجى التحقق من الإنترنت والمحاولة مرة أخرى';
    } else if (error?.status === 400 || error?.message?.includes('Invalid image')) {
      userMessage = '📸 ملف غير مدعوم';
      suggestion = 'يرجى استخدام صورة واضحة وعالية الجودة للعقد (PNG, JPG, PDF)';
    } else if (error?.status === 429) {
      userMessage = '⏰ تم تجاوز الحد المسموح';
      suggestion = 'يرجى المحاولة بعد 5 دقائق - تم استنفاد طلبات المعالجة';
    } else if (error?.status === 413) {
      userMessage = '📊 حجم الملف كبير جداً';
      suggestion = 'يرجى تقليل حجم الصورة أو استخدام صورة أصغر';
    } else if (error?.message?.includes('No text detected')) {
      userMessage = '📝 لم يتم العثور على نص';
      suggestion = 'الصورة لا تحتوي على نص واضح. تأكد من وضوح العقد';
    }
    
    toast({
      title: userMessage,
      description: suggestion,
      variant: 'destructive',
      duration: 6000,
    });
  }
  
  static handleOpenAIError(error: any): void {
    console.error('🤖 OpenAI Error Analysis:', error);
    
    let userMessage = 'فشل في تحليل النص';
    let suggestion = 'سيتم استخدام الطريقة التقليدية للاستخراج';
    
    // Enhanced OpenAI error handling
    if (error?.message?.includes('API key') || error?.message?.includes('API not configured')) {
      userMessage = '🔑 خطأ في إعدادات الذكاء الاصطناعي';
      suggestion = 'مفتاح OpenAI غير مُعد. يرجى التواصل مع المطور لإعداد OpenAI API';
    } else if (error?.status === 429) {
      userMessage = '⏱️ تم تجاوز حد استخدام الذكاء الاصطناعي';
      suggestion = 'سيتم استخدام الطريقة التقليدية لاستخراج البيانات';
    } else if (error?.status === 401) {
      userMessage = '🔐 مفتاح API غير صحيح';
      suggestion = 'مفتاح OpenAI غير صالح. يرجى التحقق من الإعدادات';
    } else if (error?.status === 500) {
      userMessage = '🔧 خطأ في خدمة الذكاء الاصطناعي';
      suggestion = 'مشكلة مؤقتة في OpenAI. سيتم المحاولة لاحقاً';
    } else if (error?.message?.includes('context_length_exceeded')) {
      userMessage = '📄 النص طويل جداً للمعالجة';
      suggestion = 'حجم النص كبير. سيتم تقسيمه أو استخدام طريقة أخرى';
    }
    
    toast({
      title: userMessage,
      description: suggestion,
      variant: 'default',
      duration: 5000,
    });
  }
  
  static showSuccessMessage(confidence: number): void {
    if (confidence > 85) {
      toast({
        title: '🎉 تم استخراج البيانات بدقة عالية!',
        description: `دقة الاستخراج: ${confidence}% - البيانات موثوقة ومؤكدة`,
        variant: 'default',
        duration: 4000,
      });
    } else if (confidence > 70) {
      toast({
        title: '✅ تم استخراج البيانات بنجاح',
        description: `دقة الاستخراج: ${confidence}% - يُنصح بمراجعة البيانات`,
        variant: 'default',
        duration: 4000,
      });
    } else if (confidence > 50) {
      toast({
        title: '⚠️ تم استخراج البيانات جزئياً',
        description: `دقة الاستخراج: ${confidence}% - يرجى مراجعة وتعديل البيانات`,
        variant: 'default',
        duration: 5000,
      });
    } else if (confidence > 20) {
      toast({
        title: '📝 تم إنشاء نموذج أساسي',
        description: `دقة منخفضة: ${confidence}% - تحقق من صحة البيانات`,
        variant: 'default',
        duration: 5000,
      });
    } else {
      toast({
        title: '📄 تم إنشاء نموذج فارغ',
        description: 'لم يتم استخراج بيانات موثوقة - يرجى الملء يدوياً',
        variant: 'default',
        duration: 4000,
      });
    }
  }

  static showProcessingMessage(stage: string): void {
    let message = '';
    switch (stage) {
      case 'uploading':
        message = '📤 جاري رفع الملف...';
        break;
      case 'ocr':
        message = '🔍 جاري قراءة النص من الصورة...';
        break;
      case 'ai-processing':
        message = '🤖 جاري تحليل البيانات بالذكاء الاصطناعي...';
        break;
      case 'extracting':
        message = '⚙️ جاري استخراج بيانات العقد...';
        break;
      case 'finalizing':
        message = '✨ جاري تحضير النموذج النهائي...';
        break;
      default:
        message = '🔄 جاري المعالجة...';
    }

    toast({
      title: message,
      description: 'يرجى الانتظار...',
      variant: 'default',
      duration: 2000,
    });
  }
}