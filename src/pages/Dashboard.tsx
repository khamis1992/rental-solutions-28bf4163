import React, { useState, useCallback, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useDashboardData } from '@/hooks/use-dashboard';
import { toast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { CacheManager } from '@/lib/cache-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

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
  
  // Use error handler
  const { error: errorState, handleError, clearError } = useErrorHandler();
  
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
      handleError(error, {
        showToast: true,
        logError: true,
        context: { page: 'dashboard', action: 'refresh' }
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
  const currentDate = new Date().toLocaleDateString('ar-QA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
    <PageContainer>
      <div 
        dir={language === 'ar' ? 'rtl' : 'ltr'} 
        className={`${language === 'ar' ? 'arabic-dashboard' : ''} min-h-screen`}
      >
        <ErrorBoundary 
          context={{ page: 'dashboard', component: 'header' }}
          showRetry={true}
          showBack={false}
        >
          <DashboardHeader 
            currentDate={currentDate}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        </ErrorBoundary>
        
        {/* Error Display for unified error handler */}
        {errorState.hasError && (
          <div className="p-4 mb-4">
            <ErrorDisplay
              error={errorState.error}
              variant="card"
              showRetry={true}
              onRetry={() => {
                clearError();
                handleRefresh();
              }}
            />
          </div>
        )}
        
        <ErrorBoundary 
          context={{ page: 'dashboard', component: 'content' }}
          showRetry={true}
          showBack={false}
        >
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
        </ErrorBoundary>
      </div>
    </PageContainer>
  );
};

export default Dashboard;
