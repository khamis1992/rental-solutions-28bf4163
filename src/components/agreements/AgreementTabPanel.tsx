import { Suspense } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import AgreementTable from '@/components/agreements/AgreementTable';
import { AgreementList } from '@/components/agreements/AgreementList-Simple';
import { RefreshCw, Search } from 'lucide-react';

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
        {!isLoading && agreements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center" dir="rtl">
            <Search className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد عقود تطابق الفلتر المطبق
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              جرب تغيير الفلتر أو إزالة الفلاتر المطبقة لعرض المزيد من العقود
            </p>
          </div>
        ) : (
          <>
            {!isLoading && agreements.length > 0 && (
              <div className="mb-4 p-2 bg-blue-50 rounded-lg" dir="rtl">
                <p className="text-sm text-blue-700 text-right">
                  تم العثور على {agreements.length} عقد يطابق الفلتر المطبق
                </p>
              </div>
            )}
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
          </>
        )}
      </div>
    </Suspense>
  </TabsContent>
);

export default AgreementTabPanel;
