import React, { Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import AgreementTable from '@/components/agreements/AgreementTable';
import { AgreementList } from '@/components/agreements/AgreementList-Simple';
import { RefreshCw } from 'lucide-react';

interface AgreementTabPanelProps {
  value: string;
  viewMode: 'card' | 'table' | 'compact';
  agreements: any[];
  isLoading: boolean;
  onDeleteAgreement?: (id: string) => void;
  loadingText?: string;
}

export const AgreementTabPanel = ({
  value,
  viewMode,
  agreements,
  isLoading,
  onDeleteAgreement,
  loadingText = 'Loading agreements...'
}: AgreementTabPanelProps) => (
  <TabsContent value={value} className="m-0">
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            {loadingText && (
              <span className="text-lg font-medium">{loadingText}</span>
            )}
          </div>
        </div>
      }
    >
      <div className="p-4">
        {viewMode === 'card' && (
          <AgreementList
            agreements={agreements}
            isLoading={isLoading}
            onDeleteAgreement={onDeleteAgreement}
          />
        )}
        {viewMode === 'table' && (
          <AgreementTable agreements={agreements} isLoading={isLoading} />
        )}
        {viewMode === 'compact' && (
          <AgreementTable
            compact
            agreements={agreements}
            isLoading={isLoading}
          />
        )}
      </div>
    </Suspense>
  </TabsContent>
);

export default AgreementTabPanel;
