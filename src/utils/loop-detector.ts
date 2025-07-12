// Loop Detection System
// يراقب التطبيق ويمنع الحلقات اللانهائية التي قد تسبب تجمد النظام

interface LoopDetectionOptions {
  maxCallsPerSecond?: number;
  monitoringInterval?: number;
  emergencyThreshold?: number;
}

class LoopDetector {
  private callCounts: Map<string, number[]> = new Map();
  private isMonitoring = false;
  private options: Required<LoopDetectionOptions>;

  constructor(options: LoopDetectionOptions = {}) {
    this.options = {
      maxCallsPerSecond: 100,
      monitoringInterval: 1000,
      emergencyThreshold: 500,
      ...options
    };
  }

  // تتبع استدعاء الدوال
  public trackCall(functionName: string): boolean {
    const now = Date.now();
    
    if (!this.callCounts.has(functionName)) {
      this.callCounts.set(functionName, []);
    }

    const calls = this.callCounts.get(functionName)!;
    
    // إضافة الاستدعاء الحالي
    calls.push(now);
    
    // إزالة الاستدعاءات القديمة (أكثر من ثانية)
    const oneSecondAgo = now - 1000;
    while (calls.length > 0 && calls[0] < oneSecondAgo) {
      calls.shift();
    }

    // فحص إذا تجاوز الحد المسموح
    if (calls.length > this.options.maxCallsPerSecond) {
      console.error(`🚨 Loop detected in ${functionName}: ${calls.length} calls in 1 second`);
      
      // إذا تجاوز الحد الطارئ، قم بإعادة تعيين النظام
      if (calls.length > this.options.emergencyThreshold) {
        console.error(`🚨 Emergency: ${functionName} called ${calls.length} times! Resetting...`);
        this.triggerEmergencyReset();
      }
      
      return false; // منع التنفيذ
    }

    return true; // السماح بالتنفيذ
  }

  // بدء المراقبة
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Loop detector started');

    const monitor = () => {
      if (!this.isMonitoring) return;

      // تنظيف البيانات القديمة
      this.cleanupOldData();
      
      // فحص الحلقات النشطة
      this.checkActiveLoops();
      
      setTimeout(monitor, this.options.monitoringInterval);
    };

    monitor();
  }

  // إيقاف المراقبة
  public stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🔍 Loop detector stopped');
  }

  // تنظيف البيانات القديمة
  private cleanupOldData(): void {
    const now = Date.now();
    const fiveSecondsAgo = now - 5000;

    for (const [functionName, calls] of this.callCounts.entries()) {
      // إزالة الاستدعاءات الأقدم من 5 ثوان
      while (calls.length > 0 && calls[0] < fiveSecondsAgo) {
        calls.shift();
      }
      
      // إزالة الدوال التي لم تعد تستدعى
      if (calls.length === 0) {
        this.callCounts.delete(functionName);
      }
    }
  }

  // فحص الحلقات النشطة
  private checkActiveLoops(): void {
    for (const [functionName, calls] of this.callCounts.entries()) {
      if (calls.length > this.options.maxCallsPerSecond / 2) {
        console.warn(`⚠️ Potential loop in ${functionName}: ${calls.length} calls`);
      }
    }
  }

  // تشغيل إعادة التعيين الطارئ
  private triggerEmergencyReset(): void {
    // استدعاء emergency reset إذا كان متاحاً
    if (typeof window !== 'undefined' && (window as any).emergencyReset) {
      (window as any).emergencyReset();
    } else {
      console.error('🚨 Emergency reset not available');
      // إعادة تحميل الصفحة كحل أخير
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  // الحصول على إحصائيات
  public getStats() {
    const stats: Record<string, number> = {};
    for (const [functionName, calls] of this.callCounts.entries()) {
      stats[functionName] = calls.length;
    }
    return stats;
  }

  // إعادة تعيين العدادات
  public reset(): void {
    this.callCounts.clear();
    console.log('🔄 Loop detector reset');
  }
}

// إنشاء instance عام
export const loopDetector = new LoopDetector();

// دالة مساعدة للتتبع السريع
export const trackLoop = (functionName: string): boolean => {
  return loopDetector.trackCall(functionName);
};

// decorator للدوال
export function detectLoop(functionName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const name = functionName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      if (!trackLoop(name)) {
        console.warn(`🚨 Loop detected - blocking ${name}`);
        return;
      }
      return originalMethod.apply(this, args);
    };
  };
}

// Auto-initialize
if (typeof window !== 'undefined') {
  // بدء المراقبة تلقائياً
  loopDetector.startMonitoring();
  
  // إضافة للوصول من console
  (window as any).loopDetector = loopDetector;
  (window as any).trackLoop = trackLoop;
  
  console.log('🔍 Loop detector initialized');
} 