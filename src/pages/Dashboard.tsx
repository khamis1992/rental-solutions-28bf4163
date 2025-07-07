import React, { useState, useCallback, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useDashboardData } from '@/hooks/use-dashboard';
import { toast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { AnalyticsEngineProvider } from '@/components/analytics/core/AnalyticsEngine';
import { CacheManager } from '@/lib/cache-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';

// Suppress Supabase schema cache errors more comprehensively
if (typeof window !== 'undefined') {
  // Override console.error to filter out specific error messages
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Filter out all errors about relationships in schema cache
    if (args[0] && typeof args[0] === 'string' && 
        args[0].includes('schema cache')) {
      return; // Suppress all schema cache related errors
    }
    // Pass all other errors to the original console.error
    originalConsoleError.apply(console, args);
  };
}

const Dashboard = () => {
  const { stats, revenue, activity, isLoading, isError, error } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{[key: string]: boolean}>({});
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Clear cache when refreshing
      CacheManager.clear();
      
      // Invalidate and refetch dashboard queries instead of full page reload
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      toast({
        title: "تم تحديث لوحة التحكم",
        description: "تم تحديث جميع البيانات بأحدث المعلومات."
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث البيانات. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);
  
  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => ({ 
      ...prev, 
      [section]: !prev[section] 
    }));
  }, []);
  
  // Get current date in Arabic format (Gregorian only)
  const currentDate = (() => {
    try {
      const date = new Date().toLocaleDateString('ar-QA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      // التأكد من أن النتيجة string صالح
      return typeof date === 'string' ? date : new Date().toLocaleDateString('ar');
    } catch (error) {
      console.error('خطأ في تنسيق التاريخ:', error);
      return new Date().toLocaleDateString('ar');
    }
  })();

  // Enhanced CSS for proper Arabic text alignment and RTL experience
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideInRTL {
        from { transform: translateX(10px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .animate-fade-in {
        animation: fadeIn 0.5s ease-in-out;
      }
      .animate-slide-in {
        animation: slideIn 0.5s ease-out;
      }
      .animate-slide-in-rtl {
        animation: slideInRTL 0.5s ease-out;
      }
      .section-transition {
        transition: all 0.3s ease-in-out;
      }
      .card-transition {
        transition: all 0.2s ease;
      }
      
      /* ENHANCED RIGHT ALIGNMENT FOR ARABIC TEXT */
      /* Force right alignment for all Arabic text elements */
      [dir="rtl"] h1,
      [dir="rtl"] h2,
      [dir="rtl"] h3,
      [dir="rtl"] h4,
      [dir="rtl"] h5,
      [dir="rtl"] h6,
      [dir="rtl"] p,
      [dir="rtl"] div,
      [dir="rtl"] span {
        text-align: right !important;
        direction: rtl !important;
      }
      
      /* Specific dashboard header alignment */
      [dir="rtl"] .dashboard-header-text {
        text-align: right !important;
        direction: rtl !important;
      }
      
      /* Section header specific alignment */
      [dir="rtl"] .section-header-content {
        text-align: right !important;
        align-items: flex-end !important;
      }
      
      /* Dashboard title and description */
      [dir="rtl"] .dashboard-title {
        text-align: right !important;
        direction: rtl !important;
      }
      
      [dir="rtl"] .dashboard-description {
        text-align: right !important;
        direction: rtl !important;
      }
      
      /* Override any conflicting alignment */
      [dir="rtl"] .text-left {
        text-align: right !important;
      }
      
      [dir="rtl"] .text-center {
        text-align: right !important;
      }
      
      /* Card content alignment */
      [dir="rtl"] .card-content {
        text-align: right !important;
      }
      
      /* Arabic text container */
      .arabic-text-container {
        text-align: right !important;
        direction: rtl !important;
        width: 100% !important;
      }
      
      /* RTL-specific dashboard styles */
      [dir="rtl"] .dashboard-grid {
        direction: rtl;
        text-align: right;
      }
      
      [dir="rtl"] .dashboard-card {
        text-align: right !important;
      }
      
      [dir="rtl"] .dashboard-header {
        flex-direction: row-reverse;
        text-align: right;
      }
      
      [dir="rtl"] .dashboard-actions {
        flex-direction: row-reverse;
      }
      
      /* Arabic font optimization */
      .arabic-text {
        font-family: 'Cairo', 'Amiri', 'Noto Sans Arabic', sans-serif;
        font-feature-settings: "liga" 1, "kern" 1;
        text-align: right !important;
        direction: rtl !important;
      }
      
      /* Enhanced RTL spacing */
      [dir="rtl"] .rtl-spacing > * + * {
        margin-right: 1rem;
        margin-left: 0;
      }
      
      /* RTL-aware flex layouts */
      [dir="rtl"] .rtl-flex {
        flex-direction: row-reverse;
      }
      
      /* Flex container alignment for RTL */
      [dir="rtl"] .flex-container-rtl {
        display: flex !important;
        flex-direction: row-reverse !important;
        justify-content: flex-start !important;
        align-items: center !important;
        text-align: right !important;
      }
      
      /* Arabic number formatting */
      .arabic-numbers {
        font-variant-numeric: tabular-nums;
        direction: ltr;
        unicode-bidi: embed;
      }
      
      /* Button text alignment - keep centered for buttons */
      [dir="rtl"] button {
        text-align: center !important;
      }
      
      /* Ensure proper alignment for dashboard components */
      [dir="rtl"] .dashboard-container * {
        text-align: right !important;
      }
      
      [dir="rtl"] .dashboard-container button {
        text-align: center !important;
      }
      
      /* Specific fixes for dashboard header */
      [dir="rtl"] .dashboard-container h2 {
        text-align: right !important;
        direction: rtl !important;
      }
      
      [dir="rtl"] .dashboard-container p {
        text-align: right !important;
        direction: rtl !important;
      }
      
      /* Force alignment for any remaining elements */
      [dir="rtl"] .text-muted-foreground {
        text-align: right !important;
      }
      
      [dir="rtl"] .tracking-tight {
        text-align: right !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      try {
        if (style && document.head && document.head.contains(style)) {
          document.head.removeChild(style);
        }
      } catch (error) {
        // Silently handle DOM manipulation errors
        console.debug('Style cleanup error (safe to ignore):', error);
      }
    };
  }, []);

  return (
    <AnalyticsEngineProvider>
      <PageContainer className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        {/* Background decorations */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
        </div>
        
        <div 
          dir={language === 'ar' ? 'rtl' : 'ltr'} 
          className={`${language === 'ar' ? 'arabic-dashboard' : ''} min-h-screen relative z-10`}
        >
          <DashboardHeader 
            currentDate={currentDate}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
          
          <DashboardContent 
            isLoading={isLoading}
            isError={isError}
            error={error}
            stats={stats}
            revenue={revenue}
            activity={activity}
            collapsedSections={collapsedSections}
            onToggleSection={toggleSection}
          />
        </div>
      </PageContainer>
    </AnalyticsEngineProvider>
  );
};

export default Dashboard;
