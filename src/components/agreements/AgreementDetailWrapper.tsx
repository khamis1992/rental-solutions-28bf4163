
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AgreementDetail } from './AgreementDetail';
import { RedesignedAgreementDetail } from './redesigned/RedesignedAgreementDetail';
import { Agreement } from '@/types/agreement';
import { LayoutGrid, List } from 'lucide-react';

interface AgreementDetailWrapperProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
  onGenerateDocument?: () => void;
}

export function AgreementDetailWrapper(props: AgreementDetailWrapperProps) {
  const [useRedesign, setUseRedesign] = useState(true);

  return (
    <div className="space-y-4">
      {/* Design Toggle */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View Mode:</span>
          <div className="flex items-center gap-2">
            <Button
              variant={useRedesign ? "default" : "outline"}
              size="sm"
              onClick={() => setUseRedesign(true)}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              New Design
            </Button>
            <Button
              variant={!useRedesign ? "default" : "outline"}
              size="sm"
              onClick={() => setUseRedesign(false)}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Classic
            </Button>
          </div>
        </div>
      </div>

      {/* Render the appropriate component */}
      {useRedesign ? (
        <RedesignedAgreementDetail {...props} />
      ) : (
        <AgreementDetail {...props} />
      )}
    </div>
  );
}
