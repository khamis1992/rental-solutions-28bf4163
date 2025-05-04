
import React, { useState } from 'react';
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { Agreement } from '@/types/agreement';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { AgreementTable } from './table/AgreementTable';
import { AgreementCardView } from './AgreementCardView';
import { Button } from '@/components/ui/button';
import { LayoutGrid, LayoutList, Loader2 } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export const AgreementList: React.FC = () => {
  const {
    agreements,
    isLoading,
    error,
    rowSelection,
    setRowSelection,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    handleBulkDelete,
    pagination,
    setPagination,
    totalItems,
    statusCounts
  } = useAgreementTable();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeTab, setActiveTab] = useState('all');

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4 text-sm text-red-700">
        Error loading agreements: {error.message}
      </div>
    );
  }

  // Cast agreements to the correct type with the required fields
  const typedAgreements = agreements?.map((agreement: SimpleAgreement) => ({
    ...agreement,
    payment_frequency: agreement.payment_frequency || 'monthly',
    payment_day: 1, 
    customers: {
      full_name: agreement.customers?.full_name || agreement.customer_name || 'N/A',
      id: agreement.customers?.id || agreement.customer_id
    },
  })) as Agreement[];

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, pageIndex: page - 1 }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Apply status filter based on tab
    // This would need to be connected to your filter system
  };

  // Calculate total pages
  const totalPages = Math.ceil((totalItems || 0) / pagination.pageSize);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading agreements...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="all" className="relative">
              All
              <Badge variant="secondary" className="ml-2 text-xs py-0 px-1.5">
                {statusCounts?.total || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="relative">
              Active
              <Badge variant="secondary" className="ml-2 text-xs py-0 px-1.5">
                {statusCounts?.active || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              <Badge variant="secondary" className="ml-2 text-xs py-0 px-1.5">
                {statusCounts?.pending || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="expired" className="relative">
              Expired
              <Badge variant="secondary" className="ml-2 text-xs py-0 px-1.5">
                {statusCounts?.expired || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="relative">
              Cancelled
              <Badge variant="secondary" className="ml-2 text-xs py-0 px-1.5">
                {statusCounts?.cancelled || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="hidden sm:flex"
          >
            <LayoutList className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="hidden sm:flex"
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Cards
          </Button>
          {/* Mobile view toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            className="sm:hidden"
          >
            {viewMode === 'table' ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <LayoutList className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <AgreementTable
          agreements={typedAgreements}
          isLoading={isLoading}
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          deleteAgreement={handleBulkDelete}
        />
      ) : (
        <AgreementCardView
          agreements={typedAgreements}
          isLoading={isLoading}
          onDeleteAgreement={handleBulkDelete}
        />
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={pagination.pageIndex + 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
