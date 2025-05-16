
import React from 'react';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { handleSupabaseResponse } from '@/types/database-types';

interface AgreementListSimpleProps {
  onAgreementSelected: (agreement: Agreement) => void;
}

// This is a simplified agreement list for demonstration purposes
const AgreementListSimple: React.FC<AgreementListSimpleProps> = ({ onAgreementSelected }) => {
  const [agreements, setAgreements] = React.useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchAgreements = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await supabase
          .from('leases')
          .select('id, status, customer_id, vehicle_id, start_date, end_date, total_amount, rent_amount, created_at')
          .limit(5);

        const data = handleSupabaseResponse(response);
        
        if (data && Array.isArray(data)) {
          // Map Supabase results to Agreement type
          const mappedAgreements: Agreement[] = data.map(item => ({
            id: item.id || '',
            status: item.status || '',
            customer_id: item.customer_id || '',
            vehicle_id: item.vehicle_id || '',
            start_date: item.start_date ? new Date(item.start_date) : new Date(),
            end_date: item.end_date ? new Date(item.end_date) : new Date(),
            total_amount: item.total_amount || 0,
            rent_amount: item.rent_amount || 0,
            created_at: item.created_at ? new Date(item.created_at) : new Date(),
          }));
          
          setAgreements(mappedAgreements);
        } else {
          setAgreements([]);
        }
      } catch (err) {
        console.error('Error fetching agreements:', err);
        setError(err instanceof Error ? err : new Error('Failed to load agreements'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgreements();
  }, []);

  if (isLoading) {
    return <div>Loading agreements...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium">Recent Agreements</h3>
      {agreements.length === 0 ? (
        <div className="text-sm text-gray-500">No agreements found</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {agreements.map((agreement) => (
            <li 
              key={agreement.id}
              className="py-2 px-1 hover:bg-gray-50 cursor-pointer rounded"
              onClick={() => onAgreementSelected(agreement)}
            >
              <div className="flex justify-between">
                <span className="text-sm font-medium">Agreement #{agreement.id.substring(0, 8)}</span>
                <span className="text-xs text-gray-500">{agreement.total_amount} QAR</span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(agreement.start_date).toLocaleDateString()} - {new Date(agreement.end_date).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Export both the original component name and an alias matching what's being imported
export default AgreementListSimple;
export { AgreementListSimple as AgreementList };
