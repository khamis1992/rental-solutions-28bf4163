
import { useAgreementTable } from '@/hooks/use-agreement-table';
import { AgreementCardView } from './AgreementCardView';
import { Agreement } from '@/types/agreement';
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

  // Convert to proper Agreement type with required properties
  const convertedInternalAgreements: Agreement[] = (internalAgreements || []).map((agreement: any): Agreement => ({
    id: agreement.id,
    agreement_number: agreement.agreement_number,
    status: agreement.status,
    start_date: agreement.start_date,
    end_date: agreement.end_date,
    rent_amount: agreement.rent_amount,
    customer_id: agreement.customer_id,
    vehicle_id: agreement.vehicle_id,
    payment_frequency: agreement.payment_frequency || 'monthly',
    payment_day: agreement.payment_day,
    rent_due_day: agreement.rent_due_day,
    confirmation_email_sent: agreement.confirmation_email_sent || false,
    daily_late_fee: agreement.daily_late_fee,
    deposit_amount: agreement.deposit_amount,
    down_payment: agreement.down_payment || 0,
    notes: agreement.notes,
    created_at: agreement.created_at,
    updated_at: agreement.updated_at,
    agreement_type: agreement.agreement_type || 'short_term',
    total_amount: agreement.total_amount || 0,
    terms_accepted: agreement.terms_accepted,
    additional_drivers: agreement.additional_drivers,
    customers: agreement.customers,
    vehicles: agreement.vehicles,
    customer_name: agreement.customer_name,
    vehicle_info: agreement.vehicle_info
  }));

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

