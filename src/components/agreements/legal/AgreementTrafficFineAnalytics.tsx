import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

// Define TrafficFine interface locally since it's not exported from the hook
interface TrafficFine {
  id: string;
  fine_number: string;
  amount: number;
  fine_date: string;
  status: 'pending' | 'paid' | 'disputed';
  description?: string;
  vehicle_id?: string;
  agreement_id?: string;
}

interface AgreementTrafficFineAnalyticsProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

export function AgreementTrafficFineAnalytics({ 
  agreementId, 
  startDate, 
  endDate 
}: AgreementTrafficFineAnalyticsProps) {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrafficFines = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/traffic-fines?agreementId=${agreementId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TrafficFine[] = await response.json();
        setTrafficFines(data);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch traffic fines');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrafficFines();
  }, [agreementId, startDate, endDate]);

  const totalFinesAmount = trafficFines.reduce((sum, fine) => sum + fine.amount, 0);
  const paidFinesAmount = trafficFines.filter(fine => fine.status === 'paid').reduce((sum, fine) => sum + fine.amount, 0);
  const pendingFinesAmount = trafficFines.filter(fine => fine.status === 'pending').reduce((sum, fine) => sum + fine.amount, 0);
  const disputedFinesAmount = trafficFines.filter(fine => fine.status === 'disputed').reduce((sum, fine) => sum + fine.amount, 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const pieChartData = [
    { name: 'Paid', value: paidFinesAmount },
    { name: 'Pending', value: pendingFinesAmount },
    { name: 'Disputed', value: disputedFinesAmount },
  ];

  const hasFines = trafficFines.length > 0;

  if (isLoading) {
    return <p>Loading traffic fine data...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fine Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          {hasFines ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Summary Metrics */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Total Fines: {formatCurrency(totalFinesAmount)}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Total amount of traffic fines recorded for this agreement.
                </p>
                <Separator />
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <h4 className="text-md font-medium">Paid: {formatCurrency(paidFinesAmount)}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <h4 className="text-md font-medium">Pending: {formatCurrency(pendingFinesAmount)}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <h4 className="text-md font-medium">Disputed: {formatCurrency(disputedFinesAmount)}</h4>
                </div>
              </div>

              {/* Pie Chart */}
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart width={400} height={400}>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-4 bg-amber-50 text-amber-800 rounded-md">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>No traffic fines found for this agreement.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Traffic Fines List */}
      {hasFines && (
        <Card>
          <CardHeader>
            <CardTitle>Traffic Fines List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fine Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trafficFines.map((fine) => (
                    <tr key={fine.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{fine.fine_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(fine.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{new Date(fine.fine_date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          fine.status === 'paid' ? 'success' :
                          fine.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {fine.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{fine.description || 'N/A'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
