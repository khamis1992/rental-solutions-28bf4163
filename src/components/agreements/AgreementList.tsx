import React from 'react';
import AgreementListSimple from './AgreementList-Simple';
import { SimpleAgreement } from '@/types/common';

interface AgreementListProps {
  agreements: any[];
  onEdit?: (agreement: any) => void;
  onDelete?: (agreement: any) => void;
  onView?: (agreement: any) => void;
}

const AgreementList: React.FC<AgreementListProps> = ({ 
  agreements, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  // Convert Agreement to SimpleAgreement for compatibility
  const convertedAgreements: SimpleAgreement[] = agreements.map(agreement => ({
    id: agreement.id,
    agreement_number: agreement.agreement_number,
    customer_id: agreement.customer_id,
    vehicle_id: agreement.vehicle_id,
    start_date: agreement.start_date,
    end_date: agreement.end_date,
    status: agreement.status,
    total_amount: agreement.total_amount,
    rent_amount: agreement.rent_amount,
    payment_frequency: agreement.payment_frequency || 'monthly',
    confirmation_email_sent: agreement.confirmation_email_sent || false,
    down_payment: agreement.down_payment || 0,
    created_at: agreement.created_at,
    updated_at: agreement.updated_at,
    customer: agreement.customer,
    vehicle: agreement.vehicle,
    profiles: agreement.profiles,
    vehicles: agreement.vehicles
  }));

  return (
    <AgreementListSimple
      agreements={convertedAgreements}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
    />
  );
};

export default AgreementList;
