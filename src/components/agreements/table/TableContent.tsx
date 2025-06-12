
import { Agreement } from '@/types/agreement';
import { AgreementTable } from './AgreementTable';

interface TableContentProps {
  agreements: Agreement[];
  isLoading: boolean;
  compact?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
    handlePageChange: (page: number) => void;
  };
}

export function TableContent({ 
  agreements, 
  isLoading, 
  compact = false,
  pagination 
}: TableContentProps) {
  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  return (
    <AgreementTable 
      agreements={agreements}
      pagination={pagination}
      compact={compact}
    />
  );
}
