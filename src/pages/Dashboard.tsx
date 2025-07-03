import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useDashboardData } from '@/hooks/use-dashboard';
import { toast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { PerformanceMonitorWidget } from '@/components/dashboard/PerformanceMonitorWidget';
import { CacheManager } from '@/lib/cache-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useComprehensiveLogging } from '@/hooks/use-comprehensive-logging';
import { usePerformanceMonitor, useDebounce, useThrottle } from '@/utils/performance-utils';

// Global State Management & Communication
import { 
  useGlobalState, 
  useNotificationState, 
  useSidebarState, 
  useLoadingState 
} from '@/hooks/use-global-state-management';
import { 
  useComponentMessaging, 
  useDataSync, 
  useCommunicationContext 
} from '@/components/providers/CommunicationProvider';
import { EVENTS } from '@/utils/component-communication';

// Advanced State Sync & Cross-Page Communication
import { useAdvancedStateSync, useSmartCache } from '@/hooks/use-advanced-state-sync';
import { useCrossPageSync } from '@/utils/cross-page-sync';

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

const Dashboard = memo(() => {
  const { stats, revenue, activity, isLoading, isError, error } = useDashboardData();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  // Global State Management
  const { state: globalState, updateState } = useGlobalState();
  const notifications = useNotificationState();
  const { isLoading: globalLoading, withLoading } = useLoadingState('dashboard');
  
  // Communication & Event Bus
  const messaging = useComponentMessaging();
  const { eventBus, broadcastUpdate } = useCommunicationContext();
  const dataSync = useDataSync('dashboard');
  
  // Advanced State Sync & Cross-Page Communication
  const dashboardStateSync = useAdvancedStateSync({
    key: 'dashboard-state',
    autoSync: true,
    syncInterval: 2000,
    persistToStorage: true,
    validation: (data) => data && typeof data === 'object'
  }, { stats, revenue, activity });

  const smartCache = useSmartCache('dashboard-cache', {
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxSize: 20,
    autoCleanup: true
  });

  const crossPageSync = useCrossPageSync({
    pageKey: 'dashboard',
    syncKeys: ['stats', 'revenue', 'activity', 'lastUpdate'],
    bidirectional: true,
    autoRefresh: true,
    refreshInterval: 30000 // 30 seconds
  });
  
  // Local state - use global state where possible
  const [isRefreshing, setIsRefreshing] = useState(false);
  const collapsedSections = globalState.cache?.dashboardCollapsedSections || {};
  
  // Performance monitoring
  const { metrics } = usePerformanceMonitor('Dashboard');
  
  // Use error handler
  const { error: errorState, handleError, clearError } = useErrorHandler();
  
  // Use comprehensive logging
  const { logInfo, logUserAction, logError, logWarn } = useComprehensiveLogging('Dashboard');
  
  // Debounce refresh to prevent excessive calls
  const debouncedRefresh = useDebounce(isRefreshing, 300);
  
  const handleRefresh = useCallback(async () => {
    await withLoading(async () => {
      setIsRefreshing(true);
      
      try {
        // Log the refresh action
        await logUserAction('تحديث لوحة التحكم', 'system', undefined, {
          action: 'dashboard_refresh',
          timestamp: new Date().toISOString()
        });
        
        // Clear smart cache first
        smartCache.clear();
        
        // Emit refresh event to all components
        messaging.emit(EVENTS.DATA_REFRESH, { 
          source: 'dashboard',
          timestamp: new Date().toISOString()
        });
        
        // Clear legacy cache when refreshing
        CacheManager.clear();
        
        // Invalidate and refetch dashboard queries instead of full page reload
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        
        // Advanced state sync with new data
        const newDashboardData = { 
          stats, 
          revenue, 
          activity, 
          lastUpdate: new Date().toISOString() 
        };
        
        // Update advanced state sync
        dashboardStateSync.updateData(newDashboardData, 'refresh');
        
        // Cross-page sync
        crossPageSync.syncData('stats', stats);
        crossPageSync.syncData('revenue', revenue);
        crossPageSync.syncData('activity', activity);
        crossPageSync.syncData('lastUpdate', new Date().toISOString());
        
        // Cache the refreshed data
        smartCache.set('dashboard-data', newDashboardData);
        smartCache.set('last-refresh', Date.now());
        
        // Legacy sync for backward compatibility
        dataSync.syncData(newDashboardData);
        
        await logInfo('تم تحديث لوحة التحكم بنجاح', {
          action: 'dashboard_refresh_success',
          queries_invalidated: ['dashboard'],
          cache_cleared: true,
          cross_page_synced: true
        });
        
        // Use messaging for consistent notifications
        messaging.showSuccess('تم التحديث', 'تم تحديث جميع البيانات بأحدث المعلومات');
        
        // Notify other components about the update
        broadcastUpdate('dashboard', 'refreshed', {
          timestamp: new Date().toISOString(),
          stats,
          revenue,
          activity,
          version: dashboardStateSync.version
        });
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack : undefined;
        
        await logError('فشل في تحديث لوحة التحكم', {
          error_message: errorMessage,
          error_stack: errorStack,
          action: 'dashboard_refresh_failed'
        } as any);
        
        // Use messaging for error notifications
        messaging.showError('خطأ في التحديث', errorMessage);
        
        handleError(err, {
          showToast: false, // Already handled by messaging
          logError: true,
          context: { page: 'dashboard', action: 'refresh' }
        });
      } finally {
        setIsRefreshing(false);
      }
    });
  }, [queryClient, logUserAction, logInfo, logError, messaging, dataSync, stats, revenue, activity, withLoading, smartCache, dashboardStateSync, crossPageSync]);
  
  const toggleSection = useCallback((section: string) => {
    const newCollapsedSections = { 
      ...collapsedSections, 
      [section]: !collapsedSections[section] 
    };
    
    // Update global cache state
    updateState('cache', {
      ...globalState.cache,
      dashboardCollapsedSections: newCollapsedSections
    });
    
    // Notify about UI change
    messaging.emit(EVENTS.USER_ACTION, {
      action: 'dashboard_section_toggle',
      component: 'dashboard',
      section,
      collapsed: newCollapsedSections[section]
    });
  }, [collapsedSections, globalState.cache, updateState, messaging]);
  
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
        
        {/* Performance Monitor Widget - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6">
            <ErrorBoundary 
              context={{ page: 'dashboard', component: 'performance-monitor' }}
              showRetry={true}
              showBack={false}
            >
              <PerformanceMonitorWidget />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </PageContainer>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
