
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Agreement } from '@/types/agreement';

interface TableContentProps {
  agreements: Agreement[];
  isLoading: boolean;
  compact?: boolean;
  pagination?: any;
}

export function TableContent({ agreements, isLoading, compact = false }: TableContentProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th>Agreement #</th>
            <th>Customer</th>
            <th>Vehicle</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agreements.map((agreement) => (
            <tr key={agreement.id}>
              <td>{agreement.agreement_number}</td>
              <td>{agreement.customers?.full_name || 'N/A'}</td>
              <td>{agreement.vehicles?.license_plate || 'N/A'}</td>
              <td>
                <Badge>{agreement.status}</Badge>
              </td>
              <td>{agreement.rent_amount}</td>
              <td>
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/agreements/${agreement.id}`)}
                >
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
