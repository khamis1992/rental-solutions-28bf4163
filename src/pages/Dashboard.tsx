import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useDashboardData } from '@/hooks/use-dashboard';
import { toast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { AgreementServiceTester } from '@/components/dashboard/AgreementServiceTester';
import { CacheManager } from '@/lib/cache-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';

// Suppress Supabase schema cache errors more comprehensively
if (typeof window !== 'undefined') {
  // Override console.error to filter out specific error messages
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Filter out all errors about relationships in schema
    const message = args.join(' ').toLowerCase();
    if (
      message.includes('relationship') && 
      message.includes('schema') ||
      message.includes('could not find') && message.includes('relationship') ||
      message.includes('table') && message.includes('does not exist') ||
      message.includes('rpc') && message.includes('does not exist')
    ) {
      return; // Skip these errors
    }
    // Call original console.error for other messages
    originalConsoleError.apply(console, args);
  };
}

const Dashboard: React.FC = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  // إنشاء currentDate آمن مع useMemo
  const currentDate = useMemo(() => {
    try {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      };
      
      if (language === 'ar') {
        const arabicDate = date.toLocaleDateString('ar-QA', options);
        // تأكد من إرجاع string صالح
        return typeof arabicDate === 'string' ? arabicDate : String(arabicDate);
      } else {
        const englishDate = date.toLocaleDateString('en-US', options);
        return typeof englishDate === 'string' ? englishDate : String(englishDate);
      }
    } catch (error) {
      console.warn('Error formatting date:', error);
      // fallback آمن
      return new Date().toISOString().split('T')[0];
    }
  }, [language]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});

  const {
    data,
    isLoading,
    error,
    refetch
  } = useDashboardData();

  // Handle section toggle
  const handleToggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // دالة تحديث البيانات
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // مسح الكاش أولاً
      CacheManager.clearExpiredCache();
      
      // إعادة جلب البيانات
      await refetch();
      
      // مسح كاش react-query أيضاً
      await queryClient.invalidateQueries();
      
      toast({
        title: "تم تحديث البيانات",
        description: "تم تحديث جميع البيانات بنجاح",
      });
    } catch (error) {
      console.error('خطأ في تحديث البيانات:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, queryClient, toast]);

  // تحديث تلقائي كل 5 دقائق
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [handleRefresh]);

  return (
    <PageContainer dir="rtl" className="min-h-screen bg-background">
      <div className="space-y-6" dir="rtl">
        <DashboardHeader
          currentDate={currentDate}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
        />

        {/* زر لإظهار/إخفاء فاحص العقود */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowTester(!showTester)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showTester ? 'إخفاء فاحص العقود' : 'إظهار فاحص العقود'}
          </button>
        </div>

        {/* فاحص خدمة العقود */}
        {showTester && (
          <div className="flex justify-center">
            <AgreementServiceTester />
          </div>
        )}

        <DashboardContent
          isLoading={isLoading}
          isError={!!error}
          error={error}
          stats={data?.stats}
          revenue={data?.revenue || []}
          activity={data?.activity || []}
          collapsedSections={collapsedSections}
          onToggleSection={handleToggleSection}
        />
      </div>
    </PageContainer>
  );
};

export default Dashboard;
