// Dark Mode Safety Test Utility
// يقوم بفحص أمان تبديل الثيم ومنع التجمد

interface SafetyTestResult {
  success: boolean;
  error?: string;
  metrics: {
    switchTime: number;
    memoryUsage?: number;
    renderTime: number;
  };
}

class DarkModeSafetyTester {
  private changeCount = 0;
  private lastChangeTime = 0;
  private maxChangesPerSecond = 3;
  private testResults: SafetyTestResult[] = [];

  // فحص سلامة التبديل
  public async testSafeSwitch(newTheme: 'light' | 'dark'): Promise<SafetyTestResult> {
    const startTime = performance.now();
    
    try {
      // فحص معدل التغيير
      if (!this.isChangeRateSafe()) {
        throw new Error('معدل تغيير الثيم سريع جداً - تم منع التبديل لحماية النظام');
      }

      // فحص الذاكرة قبل التبديل
      const initialMemory = this.getMemoryUsage();

      // تطبيق التغيير بأمان
      await this.applySafeThemeChange(newTheme);

      // فحص الذاكرة بعد التبديل
      const finalMemory = this.getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      // تحذير إذا زادت الذاكرة كثيراً
      if (memoryIncrease > 50 * 1024 * 1024) { // 50MB
        console.warn('تحذير: تبديل الثيم استهلك ذاكرة كبيرة:', memoryIncrease);
      }

      const endTime = performance.now();
      const result: SafetyTestResult = {
        success: true,
        metrics: {
          switchTime: endTime - startTime,
          memoryUsage: memoryIncrease,
          renderTime: this.measureRenderTime()
        }
      };

      this.testResults.push(result);
      this.updateChangeTracking();

      return result;

    } catch (error) {
      const endTime = performance.now();
      const result: SafetyTestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'خطأ غير معروف',
        metrics: {
          switchTime: endTime - startTime,
          renderTime: 0
        }
      };

      this.testResults.push(result);
      return result;
    }
  }

  // فحص معدل التغيير
  private isChangeRateSafe(): boolean {
    const now = Date.now();
    const timeSinceLastChange = now - this.lastChangeTime;

    // إعادة تعيين العداد كل ثانية
    if (timeSinceLastChange > 1000) {
      this.changeCount = 0;
      this.lastChangeTime = now;
    }

    // منع التغيير السريع
    if (this.changeCount >= this.maxChangesPerSecond) {
      return false;
    }

    return true;
  }

  // تطبيق تغيير الثيم بأمان
  private async applySafeThemeChange(newTheme: 'light' | 'dark'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // تطبيق التغيير مع timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('انتهت مهلة تبديل الثيم'));
        }, 5000);

        // تطبيق التغيير
        this.applyThemeChange(newTheme);

        // انتظار قصير للتأكد من اكتمال التغيير
        setTimeout(() => {
          clearTimeout(timeoutId);
          resolve();
        }, 100);

      } catch (error) {
        reject(error);
      }
    });
  }

  // تطبيق تغيير الثيم الفعلي
  private applyThemeChange(newTheme: 'light' | 'dark'): void {
    const root = document.documentElement;
    
    // إزالة الثيم القديم
    root.classList.remove('light', 'dark');
    
    // إضافة الثيم الجديد
    root.classList.add(newTheme);
    
    // تحديث البيانات
    root.setAttribute('data-theme', newTheme);
    
    // حفظ في localStorage بأمان
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.warn('فشل في حفظ الثيم في localStorage:', error);
    }
  }

  // قياس وقت الرندر
  private measureRenderTime(): number {
    const start = performance.now();
    
    // إجبار إعادة الرندر
    document.body.offsetHeight;
    
    return performance.now() - start;
  }

  // الحصول على استخدام الذاكرة
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  // تحديث تتبع التغييرات
  private updateChangeTracking(): void {
    this.changeCount++;
    this.lastChangeTime = Date.now();
  }

  // الحصول على إحصائيات الاختبار
  public getTestStats() {
    const successfulTests = this.testResults.filter(r => r.success);
    const failedTests = this.testResults.filter(r => !r.success);
    
    const avgSwitchTime = successfulTests.length > 0 
      ? successfulTests.reduce((sum, r) => sum + r.metrics.switchTime, 0) / successfulTests.length
      : 0;

    return {
      totalTests: this.testResults.length,
      successfulTests: successfulTests.length,
      failedTests: failedTests.length,
      successRate: this.testResults.length > 0 ? (successfulTests.length / this.testResults.length) * 100 : 0,
      averageSwitchTime: avgSwitchTime,
      recentErrors: failedTests.slice(-5).map(r => r.error)
    };
  }

  // إعادة تعيين نتائج الاختبار
  public resetTestResults(): void {
    this.testResults = [];
    this.changeCount = 0;
    this.lastChangeTime = 0;
  }

  // اختبار شامل للثيم
  public async runComprehensiveTest(): Promise<{
    success: boolean;
    details: SafetyTestResult[];
    summary: any;
  }> {
    const results: SafetyTestResult[] = [];
    
    try {
      // اختبار التبديل إلى الداكن
      const darkResult = await this.testSafeSwitch('dark');
      results.push(darkResult);
      
      // انتظار قصير
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // اختبار التبديل إلى الفاتح
      const lightResult = await this.testSafeSwitch('light');
      results.push(lightResult);
      
      const allSuccessful = results.every(r => r.success);
      
      return {
        success: allSuccessful,
        details: results,
        summary: this.getTestStats()
      };
      
    } catch (error) {
      return {
        success: false,
        details: results,
        summary: {
          error: error instanceof Error ? error.message : 'فشل في الاختبار الشامل'
        }
      };
    }
  }
}

// إنشاء instance عام
export const darkModeSafetyTester = new DarkModeSafetyTester();

// دالة مساعدة للاختبار السريع
export const testDarkModeSwitch = (newTheme: 'light' | 'dark') => {
  return darkModeSafetyTester.testSafeSwitch(newTheme);
};

// دالة للحصول على إحصائيات الأمان
export const getDarkModeStats = () => {
  return darkModeSafetyTester.getTestStats();
};

// دالة لتشغيل اختبار شامل
export const runDarkModeComprehensiveTest = () => {
  return darkModeSafetyTester.runComprehensiveTest();
}; 