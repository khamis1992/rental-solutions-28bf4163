import React, { Suspense, useState, memo, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart4, Plus, RefreshCw, Filter, FileText } from 'lucide-react';

// المكونات المحسنة
import EnhancedPagination, { SimplePagination } from '@/components/ui/enhanced-pagination';
import { usePaginatedAgreementService } from '@/hooks/services/usePaginatedAgreementService';
import { useAdvancedLazyLoading, usePerformanceMonitor } from '@/hooks/use-advanced-lazy-loading';
import { AgreementCard } from '@/components/agreements/AgreementCard';
import { AgreementStats } from '@/components/agreements/AgreementStats';
import { CustomerListFilterClone } from '@/components/agreements/CustomerListFilterClone';
import { AgreementFilterPanel } from '@/components/agreements/AgreementFilterPanel';
import { ActiveFilters } from '@/components/agreements/page/ActiveFilters';

// Lazy loaded components for better performance
const CSVImportModal = React.lazy(() => import('@/components/agreements/CSVImportModal'));
const AgreementAnalytics = React.lazy(() => import('@/components/agreements/AgreementAnalytics'));

interface AgreementWithPaginationProps {
  className?: string;
}

const AgreementsWithPagination = memo<AgreementWithPaginationProps>(() => {
  const navigate = useNavigate();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  
  // Performance monitoring
  const { addCleanup } = usePerformanceMonitor('AgreementsWithPagination');
  
  // Local state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => urlSearchParams.get('searchTerm') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'compact'>('card');

  // استخدام الخدمة المحسنة مع pagination
  const {
    agreements,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isFetching,
    isLoadingRecent,
    isLoadingStats,
    recentAgreements,
    agreementStats,
    filters,
    searchTerm,
    error,
    updateFilters,
    search,
    clearSearch,
    resetFilters,
    refreshData,
    serverPagination
  } = usePaginatedAgreementService({
    initialFilters: {
      page: parseInt(urlSearchParams.get('page') || '1'),
      pageSize: parseInt(urlSearchParams.get('pageSize') || '25'),
    },
    enableAutoRefresh: false,
    staleTime: 300000, // 5 minutes
  });

  // Lazy loading for component parts
  const { isVisible: isStatsVisible, ref: statsRef } = useAdvancedLazyLoading({
    threshold: 0.1,
    triggerOnce: true
  });

  const { isVisible: isAnalyticsVisible, ref: analyticsRef } = useAdvancedLazyLoading({
    threshold: 0.1,
    triggerOnce: true
  });

  // Update URL params when pagination changes
  useEffect(() => {
    const newParams = new URLSearchParams(urlSearchParams);
    newParams.set('page', currentPage.toString());
    newParams.set('pageSize', pageSize.toString());
    
    if (searchTerm) {
      newParams.set('searchTerm', searchTerm);
    } else {
      newParams.delete('searchTerm');
    }
    
    setUrlSearchParams(newParams, { replace: true });
  }, [currentPage, pageSize, searchTerm, setUrlSearchParams, urlSearchParams]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    search(query);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, any>) => {
    updateFilters(newFilters);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'card' | 'table' | 'compact') => {
    setViewMode(mode);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset filters when changing tabs
    if (value === 'all') {
      resetFilters();
    } else if (value === 'active') {
      updateFilters({ statuses: ['نشط'] });
    } else if (value === 'expired') {
      updateFilters({ statuses: ['منتهي'] });
    } else if (value === 'pending') {
      updateFilters({ statuses: ['معلق'] });
    }
  };

  // Handle add agreement
  const handleAddAgreement = () => {
    navigate('/agreements/add');
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refreshData();
      toast.success('تم تحديث البيانات بنجاح');
    } catch (error) {
      toast.error('فشل في تحديث البيانات');
    }
  };

  // Clean up performance monitoring
  useEffect(() => {
    addCleanup(() => {
      console.log('AgreementsWithPagination unmounted');
    });
  }, [addCleanup]);

  // Loading fallback component
  const LoadingFallback = ({ message = "جارٍ التحميل..." }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );

  // Error display
  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-red-500 text-lg font-semibold">حدث خطأ في تحميل البيانات</div>
          <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="إدارة العقود"
        subtitle="إدارة شاملة لجميع عقود الإيجار"
        icon={<FileText className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              المرشحات
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button onClick={handleAddAgreement}>
              <Plus className="mr-2 h-4 w-4" />
              عقد جديد
            </Button>
          </div>
        }
      />

      {/* شريط البحث */}
      <div className="mb-6">
        <CustomerListFilterClone
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          placeholder="البحث برقم العقد أو اسم العميل أو رقم السيارة..."
        />
      </div>

      {/* الإحصائيات */}
      <div ref={statsRef} className="mb-6">
        {isStatsVisible && (
          <Suspense fallback={<LoadingFallback message="جارٍ تحميل الإحصائيات..." />}>
            {isLoadingStats ? (
              <LoadingFallback message="جارٍ تحميل الإحصائيات..." />
            ) : (
              <AgreementStats stats={agreementStats} />
            )}
          </Suspense>
        )}
      </div>

      {/* المرشحات النشطة */}
      {showFilters && (
        <div className="mb-6">
          <AgreementFilterPanel
            onFilterChange={handleFilterChange}
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      <ActiveFilters
        filters={filters}
        onFilterRemove={(key) => {
          const newFilters = { ...filters };
          delete newFilters[key];
          updateFilters(newFilters);
        }}
        onClearAll={resetFilters}
      />

      {/* التبويبات */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto">
          <TabsTrigger value="all" className="flex items-center gap-2">
            الكل
            <Badge variant="secondary" className="text-xs">
              {totalCount.toLocaleString('ar-QA')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">نشط</TabsTrigger>
          <TabsTrigger value="expired">منتهي</TabsTrigger>
          <TabsTrigger value="pending">معلق</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-6">
              {/* عدد النتائج ومعلومات الصفحة */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isLoading ? (
                    "جارٍ التحميل..."
                  ) : (
                    `إجمالي ${totalCount.toLocaleString('ar-QA')} عقد`
                  )}
                </div>
                
                {/* أزرار عرض البيانات */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('card')}
                  >
                    بطاقات
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleViewModeChange('table')}
                  >
                    جدول
                  </Button>
                </div>
              </div>

              {/* قائمة العقود */}
              {isLoading ? (
                <LoadingFallback message="جارٍ تحميل العقود..." />
              ) : agreements.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    لا توجد عقود
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm ? 'لم يتم العثور على عقود تطابق البحث' : 'لم يتم إنشاء أي عقود بعد'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={handleAddAgreement}>
                      <Plus className="mr-2 h-4 w-4" />
                      إنشاء أول عقد
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Grid view for cards */}
                  {viewMode === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {agreements.map(agreement => (
                        <AgreementCard 
                          key={agreement.id} 
                          agreement={agreement}
                          onEdit={(id) => navigate(`/agreements/edit/${id}`)}
                          onView={(id) => navigate(`/agreements/${id}`)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Table view */}
                  {viewMode === 'table' && (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        عرض الجدول قيد التطوير
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <EnhancedPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    pageSize={pageSize}
                    onPageChange={serverPagination.goToPage}
                    onPageSizeChange={serverPagination.setPageSize}
                    loading={isLoading || isFetching}
                    showInfo={true}
                    showPageSizeSelector={true}
                    pageSizeOptions={[10, 25, 50, 100]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* التحليلات */}
      <div ref={analyticsRef} className="mt-8">
        {isAnalyticsVisible && (
          <Suspense fallback={<LoadingFallback message="جارٍ تحميل التحليلات..." />}>
            <AgreementAnalytics />
          </Suspense>
        )}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <Suspense fallback={<LoadingFallback message="جارٍ تحميل نافذة الاستيراد..." />}>
          <CSVImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportComplete={() => {
              setIsImportModalOpen(false);
              refreshData();
              toast.success('تم استيراد العقود بنجاح');
            }}
          />
        </Suspense>
      )}
    </PageContainer>
  );
});

AgreementsWithPagination.displayName = 'AgreementsWithPagination';

export default AgreementsWithPagination; 