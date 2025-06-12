
import { useAgreementService } from '@/hooks/services/useAgreementService';
import { TableContent } from './table/TableContent';
import { Agreement } from '@/types/agreement';

const AgreementList = () => {
  const {
    agreements,
    isLoading,
    error
  } = useAgreementService();

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  // Ensure agreements are properly typed
  const typedAgreements: Agreement[] = (agreements || []).map((agreement: any): Agreement => ({
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
    total_amount: agreement.total_amount || agreement.rent_amount || 0,
    customers: agreement.customers,
    vehicles: agreement.vehicles,
    customer_name: agreement.customer_name
  }));

  return (
    <TableContent 
      agreements={typedAgreements}
      isLoading={isLoading}
      pagination={undefined}
    />
  );
};

export default AgreementList;
