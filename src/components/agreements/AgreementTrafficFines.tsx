
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { trafficFinesApi } from '@/lib/api/trafficFines';
import { DbId } from '@/types/database-common';
import { mapTrafficFineToComponentFormat } from '@/utils/traffic-fine-mapper';

interface TrafficFine {
  id: string;
  violationNumber: string;
  licensePlate: string;
  violationDate: Date | string;
  fineAmount: number;
  violationCharge: string;
  paymentStatus: string;
  location: string;
}

interface AgreementTrafficFinesProps {
  agreementId: DbId;
  startDate?: Date;
  endDate?: Date;
}

export const AgreementTrafficFines: React.FC<AgreementTrafficFinesProps> = ({ agreementId, startDate, endDate }) => {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrafficFines = async () => {
    try {
      setLoading(true);
      const response = await trafficFinesApi.fetchByLeaseId(agreementId);
      // Use the mapper to ensure consistent property naming
      const mappedFines = response.map(mapTrafficFineToComponentFormat);
      setTrafficFines(mappedFines);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching traffic fines:", error);
      setError("Failed to load traffic fines");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (agreementId) {
      fetchTrafficFines();
    }
  }, [agreementId]);

  if (loading) {
    return <Card>Loading traffic fines...</Card>;
  }

  if (error) {
    return <Card>Error: {error}</Card>;
  }

  if (!trafficFines || trafficFines.length === 0) {
    return <Card>No traffic fines found for this agreement.</Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fines</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Violation #
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  License Plate
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trafficFines.map((fine) => (
                <tr key={fine.id}>
                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                    {fine.violationNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                    {fine.licensePlate}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                    {fine.violationDate instanceof Date
                      ? format(fine.violationDate, 'dd/MM/yyyy')
                      : format(new Date(fine.violationDate), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                    {formatCurrency(fine.fineAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5">
                    <Badge
                      variant={fine.paymentStatus === 'paid' ? 'success' : 'warning'}
                      className={
                        fine.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {fine.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-900">
                    {fine.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgreementTrafficFines;
