
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export const SimpleAgreementList = () => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgreements = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('leases')
          .select('id, status, customer_id, vehicle_id, start_date, end_date, total_amount, rent_amount, created_at')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (data) {
          // Make sure to map the data to include total_amount
          const mappedData = data.map(item => ({
            id: item.id,
            status: item.status,
            customer_id: item.customer_id,
            vehicle_id: item.vehicle_id,
            start_date: item.start_date,
            end_date: item.end_date,
            total_amount: item.total_amount || 0, // Ensure total_amount is present
            rent_amount: item.rent_amount,
            created_at: item.created_at
          })) as Agreement[];
          
          setAgreements(mappedData);
        }
      } catch (error) {
        console.error('Error fetching agreements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgreements();
  }, []);

  if (loading) return <div>Loading agreements...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {agreements.map((agreement) => (
            <tr key={agreement.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agreement.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${agreement.status === 'active' ? 'bg-green-100 text-green-800' : 
                  agreement.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'}`}>
                  {agreement.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {agreement.start_date ? format(new Date(agreement.start_date), 'PP') : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {agreement.end_date ? format(new Date(agreement.end_date), 'PP') : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(agreement.total_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
