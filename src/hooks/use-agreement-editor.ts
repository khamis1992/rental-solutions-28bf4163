
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEditAgreement } from './use-edit-agreement';
import { Agreement } from '@/types/agreement';

export function useAgreementEditor() {
  const { id } = useParams<{ id: string }>();
  const [userId, setUserId] = useState<string>('');

  // Use the existing edit agreement hook
  const { agreement, isLoading, error } = useEditAgreement(id || '');

  // Extract vehicle and customer data from the agreement
  const vehicleData = agreement?.vehicles ? {
    id: agreement.vehicles.id,
    make: agreement.vehicles.make,
    model: agreement.vehicles.model,
    license_plate: agreement.vehicles.license_plate,
    year: agreement.vehicles.year,
    vin: agreement.vehicles.vin,
    color: agreement.vehicles.color,
    status: agreement.vehicles.status
  } : null;

  const customerData = agreement?.customers ? {
    id: agreement.customers.id,
    full_name: agreement.customers.full_name,
    email: agreement.customers.email,
    phone_number: agreement.customers.phone_number,
    address: agreement.customers.address,
    city: agreement.customers.city,
    state: agreement.customers.state,
    zip_code: agreement.customers.zip_code,
    role: agreement.customers.role,
    created_at: agreement.customers.created_at,
    updated_at: agreement.customers.updated_at
  } : null;

  // Set userId from customer_id if available
  useEffect(() => {
    if (agreement?.customer_id) {
      setUserId(agreement.customer_id);
    }
  }, [agreement]);

  return {
    id,
    userId,
    agreement: agreement as Agreement | null,
    isLoading,
    vehicleData,
    customerData
  };
}
