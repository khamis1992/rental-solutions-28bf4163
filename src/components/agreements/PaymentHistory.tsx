
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentHistoryProps } from './PaymentHistory.types';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertTriangle, Calendar, CheckCircle2, Clock, Plus } from 'lucide-react';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { PaymentEditDialog } from './PaymentEditDialog';
import { toast } from 'sonner';
import { usePaymentService } from '@/hooks/services';

export const PaymentHistory = ({ 
  leaseStartDate, 
  leaseEndDate,
  rentAmount,
  contractAmount,
  onPaymentDeleted,
  leaseId
}: PaymentHistoryProps) => {
  const [activeTab, setActiveTab] = useState('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  // Use our payment service hook
  const { 
    payments, 
    isLoading, 
    deletePayment, 
    updatePayment,
    recordPayment,
    refetch
  } = usePaymentService(leaseId);

  // Filter payments based on active tab
  const filteredPayments = payments.filter(payment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'late' && payment.days_overdue) return payment.days_overdue > 0;
    return payment.type === activeTab;
  });

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deletePayment(paymentId);
      onPaymentDeleted();
    } catch (error) {
      console.error("Error deleting payment:", error);
    }
  };

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePayment = async (updatedPayment: any) => {
    try {
      await updatePayment({ 
        id: updatedPayment.id, 
        data: updatedPayment 
      });
      setIsEditDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const handleRecordPayment = async (payment: any) => {
    try {
      await recordPayment(payment);
      setIsPaymentDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  const getPaymentStatusBadge = (status: string | undefined) => {
    if (status === 'completed' || status === 'paid') {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
    } else if (status === 'pending' || status === 'partially_paid') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
    } else {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{status || 'Unknown'}</Badge>;
    }
  };

  // Calculate totals
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0);
  const totalRemaining = contractAmount ? contractAmount - totalPaid : 0;

  return (
    <Card className="border rounded-lg shadow-sm w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-lg">Payment History</CardTitle>
            <CardDescription>Track all payment records for this agreement</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Record Payment
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-b">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Paid</p>
            <p className="text-xl font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
            <p className="text-xl font-semibold">{formatCurrency(rentAmount || 0)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Remaining</p>
            <p className="text-xl font-semibold text-blue-600">{formatCurrency(totalRemaining)}</p>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="p-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="rent">Rent</TabsTrigger>
            <TabsTrigger value="LATE_PAYMENT_FEE">Late Fees</TabsTrigger>
            <TabsTrigger value="late">Overdue</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading payment history...</p>
              </div>
            ) : filteredPayments.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                            <div>
                              {payment.payment_date 
                                ? format(parseISO(payment.payment_date), 'dd MMM yyyy')
                                : 'Not Paid'}
                              
                              {payment.days_overdue && payment.days_overdue > 0 && (
                                <div className="text-xs text-red-500 flex items-center mt-1">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {payment.days_overdue} days late
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {payment.type === 'LATE_PAYMENT_FEE' ? 'Late Payment Fee' : 'Rent Payment'}
                            </div>
                            <div className="text-xs text-gray-500">{payment.description || 'No description'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPaymentStatusBadge(payment.status)}
                          {payment.payment_method && (
                            <div className="text-xs text-gray-500 mt-1">
                              {payment.payment_method}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(payment.amount)}
                          </div>
                          {payment.amount_paid !== undefined && payment.amount_paid < payment.amount && (
                            <div className="text-xs text-gray-500">
                              Paid: {formatCurrency(payment.amount_paid || 0)}
                            </div>
                          )}
                          {payment.late_fine_amount > 0 && (
                            <div className="text-xs text-red-500">
                              +{formatCurrency(payment.late_fine_amount)} late fee
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditPayment(payment)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this payment record?')) {
                                handleDeletePayment(payment.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
                <h3 className="mt-2 text-sm font-medium">No payment records found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No {activeTab === 'all' ? 'payment' : activeTab === 'late' ? 'overdue' : activeTab} records found for this agreement.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <div className="text-sm text-gray-500">
          {leaseStartDate && leaseEndDate && (
            <span>Agreement Period: {format(new Date(leaseStartDate), 'dd MMM yyyy')} - {format(new Date(leaseEndDate), 'dd MMM yyyy')}</span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm text-gray-700">Payments: {payments.length}</span>
        </div>
      </CardFooter>

      {/* Payment Entry Dialog */}
      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        onPaymentCreated={handleRecordPayment}
        leaseId={leaseId}
        rentAmount={rentAmount}
      />

      {/* Payment Edit Dialog */}
      {selectedPayment && (
        <PaymentEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          payment={selectedPayment}
          onPaymentUpdated={handleUpdatePayment}
        />
      )}
    </Card>
  );
};
