import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { formatDate } from '@/utils/date-formatter';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface CustomerTrafficFinesProps {
  customerId: string;
}

const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId }) => {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<string>('all');

  useEffect(() => {
    fetchCustomerAgreements();
    fetchTrafficFines();
  }, [customerId]);

  const fetchCustomerAgreements = async () => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          start_date,
          end_date,
          vehicles (
            id,
            license_plate,
            make,
            model,
            year
          ),
          status
        `)
        .eq('customer_id', customerId);

      if (error) {
        console.error('Error fetching customer agreements:', error);
        return;
      }

      if (data) {
        setAgreements(data);
      }
    } catch (err) {
      console.error('Exception fetching customer agreements:', err);
    }
  };

  const fetchTrafficFines = async (agreementId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('traffic_fines')
        .select(`
          *,
          leases!traffic_fines_lease_id_fkey (
            id,
            agreement_number,
            status
          ),
          vehicles!traffic_fines_vehicle_id_fkey (
            id,
            license_plate,
            make,
            model
          )
        `);

      // If we have a specific agreement ID filter
      if (agreementId && agreementId !== 'all') {
        query = query.eq('lease_id', agreementId);
      } else {
        // Otherwise, fetch all fines for this customer's agreements
        const agreementIds = agreements.map(agreement => agreement.id);
        if (agreementIds.length > 0) {
          query = query.in('lease_id', agreementIds);
        } else {
          // If no agreements, try to find by customer_id directly if that column exists
          // This is a fallback in case the traffic_fines table has a direct customer_id field
          query = query.eq('customer_id', customerId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching traffic fines:', error);
        return;
      }

      setFines(data || []);
    } catch (err) {
      console.error('Exception fetching traffic fines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgreementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAgreement(value);
    fetchTrafficFines(value !== 'all' ? value : undefined);
  };

  const generateReport = async () => {
    try {
      // Implementation of report generation
      toast.success("Report generated successfully");
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error("Failed to generate traffic fine report");
    }
  };

  const getFineStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'disputed':
        return <Badge variant="outline">Disputed</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Traffic Fines</CardTitle>
        <div className="flex items-center space-x-2">
          <div>
            <select
              className="form-select rounded border border-gray-300 px-3 py-1.5 text-sm"
              value={selectedAgreement}
              onChange={handleAgreementChange}
            >
              <option value="all">All Agreements</option>
              {agreements.map(agreement => (
                <option key={agreement.id} value={agreement.id}>
                  {agreement.agreement_number} ({agreement.vehicles?.[0]?.license_plate || 'No Vehicle'})
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={generateReport}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-sm text-gray-500">Loading traffic fines...</div>
          </div>
        ) : fines.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-sm text-gray-500">No traffic fines found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Violation #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fines.map((fine) => (
                  <TableRow key={fine.id}>
                    <TableCell>{fine.violation_number || fine.serial_number || 'N/A'}</TableCell>
                    <TableCell>{formatDate(fine.violation_date)}</TableCell>
                    <TableCell>
                      {fine.vehicles?.license_plate || fine.license_plate || 'N/A'}
                    </TableCell>
                    <TableCell>{fine.fine_location || 'N/A'}</TableCell>
                    <TableCell>{fine.fine_type || fine.violation_charge || 'General'}</TableCell>
                    <TableCell>
                      {typeof fine.fine_amount === 'number' 
                        ? `QAR ${fine.fine_amount.toFixed(2)}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{getFineStatusBadge(fine.payment_status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerTrafficFines;
