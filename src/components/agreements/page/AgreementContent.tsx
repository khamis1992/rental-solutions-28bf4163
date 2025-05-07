
import React, { Suspense } from 'react';
import { RefreshCw } from 'lucide-react';
import { Database } from 'lucide-react';
import { AgreementList } from '@/components/agreements/AgreementList-Simple';
import { ImportHistoryList } from '@/components/agreements/ImportHistoryList';
import AgreementTable from '@/components/agreements/AgreementTable';

interface AgreementContentProps {
  activeTab: string;
  viewMode: 'card' | 'table' | 'compact';
}

export function AgreementContent({ activeTab, viewMode }: AgreementContentProps) {
  if (activeTab === 'history') {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Import History
        </h2>
        <ImportHistoryList />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading agreements...</span>
        </div>
      </div>
    }>
      <div className="p-4">
        {viewMode === 'card' && <AgreementList />}
        {viewMode === 'table' && <AgreementTable />}
        {viewMode === 'compact' && <AgreementTable compact />}
      </div>
    </Suspense>
  );
}
