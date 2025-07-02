import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

import { fetchCustomerObligations, CustomerObligation } from './CustomerLegalObligations';

interface CustomerSummary {
  customerId: string;
  customerName: string;
  totalDueRent: number;
  totalTrafficFines: number;
  obligations: CustomerObligation[];
}

const CustomerObligationsDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all customers with due rent or fines
        const { data, error: queryError } = await supabase.rpc('get_customers_with_obligations');
        if (queryError) throw queryError;
        // If no RPC, fallback to SQL
        let customerRows = data;
        if (!customerRows) {
          const { data: fallback, error: fallbackError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .limit(100);
          if (fallbackError) throw fallbackError;
          customerRows = fallback;
        }
        // For each customer, fetch obligations
        const summaries: CustomerSummary[] = [];
        for (const row of customerRows) {
          const obligations = await fetchCustomerObligations(row.id);
          const totalDueRent = obligations.filter((o: CustomerObligation) => o.obligationType === 'payment').reduce((sum: number, o: CustomerObligation) => sum + (o.amount || 0), 0);
          const totalTrafficFines = obligations.filter((o: CustomerObligation) => o.obligationType === 'traffic_fine').reduce((sum: number, o: CustomerObligation) => sum + (o.amount || 0), 0);
          if (totalDueRent > 0 || totalTrafficFines > 0) {
            summaries.push({
              customerId: row.id,
              customerName: row.full_name,
              totalDueRent,
              totalTrafficFines,
              obligations,
            });
          }
        }
        setCustomers(summaries);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load obligations');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Customer Obligations Dashboard</h3>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : customers.length === 0 ? (
          <p className="text-muted-foreground">No customers with outstanding obligations.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Total Due Rent</TableHead>
                <TableHead>Total Traffic Fines</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.customerId}>
                  <TableCell>{c.customerName}</TableCell>
                  <TableCell>{c.totalDueRent}</TableCell>
                  <TableCell>{c.totalTrafficFines}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => window.location.href = `/customers/${c.customerId}`}>View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerObligationsDashboard; 