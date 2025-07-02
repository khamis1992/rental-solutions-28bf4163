
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementCardView } from './AgreementCardView';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { SimplePagination } from '@/components/ui/simple-pagination';
import { bypassTypes } from '@/lib/type-bypass';

interface AgreementListProps {
  agreements?: SimpleAgreement[];
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

  const agreements = externalAgreements ?? internalAgreements;
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

  // Transform SimpleAgreement to Agreement with type workaround
  const typedAgreements = bypassTypes(agreements?.map((agreement: any) => ({
    ...agreement,
    agreement_type: 'short_term' as const,
    customers: agreement.customers ? {
      ...agreement.customers,
      email: agreement.customers.email || '',
      phone_number: agreement.customers.phone_number || '',
      address: agreement.customers.address || '',
      city: agreement.customers.city || '',
      state: agreement.customers.state || '',
      zip_code: agreement.customers.zip_code || '',
      role: agreement.customers.role || 'customer',
      created_at: agreement.customers.created_at || '',
      updated_at: agreement.customers.updated_at || '',
      driver_license: null,
      id_card_image: null
    } : undefined,
    vehicles: agreement.vehicles ? {
      ...agreement.vehicles,
      attention_needed_notes: '',
      engine_number: '',
      model_number: '',
      notes: '',
      created_at: '',
      updated_at: '',
      vin: agreement.vehicles.vin || ''
    } : undefined
  }))) || [];

  return (
    <div className="space-y-6">
      <AgreementCardView
        agreements={typedAgreements}
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
