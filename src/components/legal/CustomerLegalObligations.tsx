import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

export interface CustomerLegalObligationsProps {
  customerId?: string;
}

export interface CustomerObligation {
  id: string;
  description: string;
  status: string;
  dueDate?: Date;
  createdAt: Date;
  customerId?: string;
  customerName?: string;
  amount?: number;
  urgency?: string;
  daysOverdue?: number;
  obligationType?: string;
}

const sortOptions = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'urgency', label: 'Urgency' },
];

const obligationTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'payment', label: 'Due Rent' },
  { value: 'traffic_fine', label: 'Traffic Fine' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
];

// Fetch obligations for a single customer
export async function fetchCustomerObligations(customerId: string): Promise<CustomerObligation[]> {
  // Fetch customer name
  const { data: customerData, error: customerError } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', customerId)
    .maybeSingle();
  if (customerError) throw customerError;
  const customerName = customerData?.full_name || 'Unknown Customer';

  // Fetch due rent from agreements
  const { data: agreements, error: agreementsError } = await supabase
    .from('agreements')
    .select('id, amount_due, due_date, status, created_at')
    .eq('customer_id', customerId)
    .or('status.eq.overdue,amount_due.gt.0');
  if (agreementsError) throw agreementsError;

  // Fetch unpaid traffic fines
  const { data: fines, error: finesError } = await supabase
    .from('traffic_fines')
    .select('id, fine_amount, violation_date, payment_status, created_at')
    .eq('customer_id', customerId)
    .or('payment_status.eq.unpaid,fine_amount.gt.0');
  if (finesError) throw finesError;

  // Map agreements to obligations
  const rentObligations: CustomerObligation[] = (agreements || []).map((a: any) => ({
    id: a.id,
    customerId,
    customerName,
    description: 'Due Rent',
    status: a.status,
    dueDate: a.due_date ? new Date(a.due_date) : undefined,
    createdAt: a.created_at ? new Date(a.created_at) : new Date(),
    amount: a.amount_due,
    urgency: a.status === 'overdue' ? 'high' : 'medium',
    obligationType: 'payment',
  }));

  // Map fines to obligations
  const fineObligations: CustomerObligation[] = (fines || []).map((f: any) => ({
    id: f.id,
    customerId,
    customerName,
    description: 'Traffic Fine',
    status: f.payment_status,
    dueDate: f.violation_date ? new Date(f.violation_date) : undefined,
    createdAt: f.created_at ? new Date(f.created_at) : new Date(),
    amount: f.fine_amount,
    urgency: f.payment_status === 'unpaid' ? 'high' : 'medium',
    obligationType: 'traffic_fine',
  }));

  return [...rentObligations, ...fineObligations];
}

export const CustomerLegalObligations: React.FC<CustomerLegalObligationsProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('dueDate');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchObligations = async () => {
      if (!customerId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const obligations = await fetchCustomerObligations(customerId);
        setObligations(obligations);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchObligations();
  }, [customerId]);

  // Sorting
  const sortedObligations = [...obligations].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0);
    } else if (sortBy === 'amount') {
      return (b.amount || 0) - (a.amount || 0);
    } else if (sortBy === 'urgency') {
      const order: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
      const aUrgency = typeof a.urgency === 'string' && order[a.urgency] !== undefined ? order[a.urgency] : 0;
      const bUrgency = typeof b.urgency === 'string' && order[b.urgency] !== undefined ? order[b.urgency] : 0;
      return bUrgency - aUrgency;
    }
    return 0;
  });

  // Filtering
  const filteredObligations = sortedObligations.filter((o) => {
    const typeMatch = typeFilter === 'all' || o.obligationType === typeFilter;
    const statusMatch = statusFilter === 'all' || o.status === statusFilter;
    return typeMatch && statusMatch;
  });

  // Actions
  const handleMarkResolved = async (obligation: CustomerObligation) => {
    if (obligation.obligationType === 'payment') {
      await supabase.from('agreements').update({ status: 'resolved' }).eq('id', obligation.id);
    } else if (obligation.obligationType === 'traffic_fine') {
      await supabase.from('traffic_fines').update({ status: 'resolved' }).eq('id', obligation.id);
    }
    // Refresh
    setObligations((prev) => prev.map((o) => o.id === obligation.id ? { ...o, status: 'resolved' } : o));
  };

  const handleSendReminder = (obligation: CustomerObligation) => {
    // Placeholder for sending reminder logic
    alert(`Reminder sent for obligation: ${obligation.description}`);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Legal Obligations</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {obligationTypeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading obligations...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredObligations.length > 0 ? (
          <ul className="space-y-2">
            {filteredObligations.map(obligation => (
              <li key={obligation.id} className="border-b pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="font-medium">{obligation.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Amount: {obligation.amount ?? 'N/A'} | Status: <span className={obligation.status === 'overdue' || obligation.status === 'unpaid' ? 'text-red-500' : ''}>{obligation.status}</span>
                    {obligation.dueDate && (
                      <span> | Due: {obligation.dueDate.toLocaleDateString()}</span>
                    )}
                    {obligation.urgency && (
                      <span> | Urgency: {obligation.urgency}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleSendReminder(obligation)} disabled={obligation.status === 'resolved'}>
                    Send Reminder
                  </Button>
                  <Button size="sm" variant="default" onClick={() => handleMarkResolved(obligation)} disabled={obligation.status === 'resolved'}>
                    Mark as Resolved
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No legal obligations found for this customer.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerLegalObligations;
