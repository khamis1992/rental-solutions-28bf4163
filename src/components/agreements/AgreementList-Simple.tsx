
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementCardView } from './AgreementCardView';
import { Agreement } from '@/types/agreement';
import { SimpleAgreement } from '@/types/simple-agreement';
import { SimplePagination } from '@/components/ui/simple-pagination';

interface AgreementListProps {
  agreements?: Agreement[];
  isLoading?: boolean;
  onDeleteAgreement?: (id: string) => void;
  pagination?: {
    page: number;
    totalPages: number;
    totalCount: number;
    handlePageChange: (page: number) => void;
  };
}

export function AgreementList({
  agreements: externalAgreements,
  isLoading: externalLoading,
  onDeleteAgreement,
  pagination: externalPagination,
}: AgreementListProps) {
  const {
    agreements: internalAgreements,
    isLoading: internalLoading,
    error,
    deleteAgreements,
    pagination: internalPagination,
  } = useAgreementTable();

  // Convert SimpleAgreement to Agreement if needed - now both types are compatible
  const convertedInternalAgreements = (internalAgreements as Agreement[]) || [];

  const agreements = externalAgreements ?? convertedInternalAgreements;
  const isLoading = externalLoading ?? internalLoading;
  
  // Handle delete function - either use provided function or delete single agreement
  const handleDelete = onDeleteAgreement ?? (async (id: string) => {
    await deleteAgreements([id]);
  });
  
  const pagination = externalPagination ?? {
    page: internalPagination.pageIndex + 1,
    totalPages: Math.ceil(internalPagination.total / internalPagination.pageSize),
    totalCount: internalPagination.total,
    handlePageChange: () => {} // Simple implementation
  };

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <AgreementCardView
        agreements={agreements}
        isLoading={isLoading}
        onDeleteAgreement={handleDelete}
      />
      
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col items-center justify-center mt-6">
          <SimplePagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.handlePageChange}
          />
          <div className="text-sm text-muted-foreground text-center mt-2">
            Showing {agreements.length} of {pagination.totalCount}
          </div>
        </div>
      )}
    </div>
  );
}
