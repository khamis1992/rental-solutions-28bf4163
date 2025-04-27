
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  asLeaseId,
  exists,
  hasProperties,
  safelyExtractFields,
  safeExtract,
  castDatabaseResult,
  castRowData
} from '@/utils/database-type-helpers';
import { toast } from 'sonner';

interface AgreementDetails {
  id: string;
  agreement_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  profiles?: any | null;
}

export function ReassignmentWizard() {
  const [agreementId, setAgreementId] = useState('');
  const [agreementDetails, setAgreementDetails] = useState<AgreementDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchAgreementDetails = async () => {
    if (!agreementId.trim()) return;
    
    setIsLoading(true);
    try {
      const typedLeaseId = asLeaseId(agreementId);
      
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          profiles:customer_id (
            full_name,
            email,
            phone_number
          )
        `)
        .eq('id', typedLeaseId)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Only proceed if we have valid data
      if (data && exists(data)) {
        const profileData = data.profiles || {};
        
        // Create a properly typed AgreementDetails object
        const details: AgreementDetails = {
          id: data.id || '',
          agreement_number: data.agreement_number || '',
          customer_name: profileData.full_name || null,
          customer_email: profileData.email || null,
          customer_phone: profileData.phone_number || null,
          profiles: data.profiles
        };
        
        setAgreementDetails(details);
      } else {
        setAgreementDetails(null);
        toast.error('Agreement not found');
      }
    } catch (error) {
      console.error('Error fetching agreement details:', error);
      toast.error('Failed to fetch agreement details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      await fetchAgreementDetails();
    } catch (error) {
      console.error("Error during agreement search:", error);
      toast.error('Failed to fetch agreement details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Reassignment Wizard</h2>
      <div>
        <input
          type="text"
          placeholder="Enter Agreement ID"
          value={agreementId}
          onChange={(e) => setAgreementId(e.target.value)}
        />
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {agreementDetails && (
        <div>
          <h3>Agreement Details</h3>
          <p>Agreement Number: {agreementDetails.agreement_number}</p>
          <p>Customer Name: {agreementDetails.customer_name}</p>
          <p>Customer Email: {agreementDetails.customer_email}</p>
          <p>Customer Phone: {agreementDetails.customer_phone}</p>
        </div>
      )}
    </div>
  );
}

export default ReassignmentWizard;
