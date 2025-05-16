
import React, { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { AgreementList } from '@/components/agreements/AgreementList-Simple';
import AgreementTable from '@/components/agreements/AgreementTable';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import { Database } from 'lucide-react';

interface AgreementContentProps {
  activeTab: string;
  viewMode: 'card' | 'table' | 'compact';
}

export const AgreementContent: React.FC<AgreementContentProps> = ({ 
  activeTab, 
  viewMode 
}) => {
  // Loading placeholder component
  const LoadingPlaceholder = () => (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center space-x-2">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="text-lg font-medium">Loading agreements...</span>
      </div>
    </div>
  );

  // Content component for agreement tabs
  const AgreementTabContent = () => (
    <div className="p-4">
      {viewMode === 'card' && <AgreementList onAgreementSelected={() => {}} />}
      {viewMode === 'table' && <AgreementTable />}
      {viewMode === 'compact' && <AgreementTable compact />}
    </div>
  );

  return (
    <>
      <TabsContent value="agreements" className="m-0">
        <Suspense fallback={<LoadingPlaceholder />}>
          <AgreementTabContent />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="active" className="m-0">
        <Suspense fallback={<LoadingPlaceholder />}>
          <AgreementTabContent />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="pending" className="m-0">
        <Suspense fallback={<LoadingPlaceholder />}>
          <AgreementTabContent />
        </Suspense>
      </TabsContent>

      <TabsContent value="history" className="m-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Import History
          </h2>
          <ImportHistoryList items={[]} isLoading={false} />
        </div>
      </TabsContent>
    </>
  );
};
