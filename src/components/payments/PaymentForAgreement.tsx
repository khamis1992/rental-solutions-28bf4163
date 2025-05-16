
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { usePaymentDetails } from '@/hooks/use-payment-details';
import { usePayments } from '@/hooks/use-payments';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface PaymentForAgreementProps {
  onBack: () => void;
  onClose: () => void;
}

export function PaymentForAgreement({ onBack, onClose }: PaymentForAgreementProps) {
  const [carNumber, setCarNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const { data, isLoading, error } = usePaymentDetails(carNumber);
  const { addPayment } = usePayments();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'dd MMM yyyy');
  };

  // Group payments by their status
  const getGroupedPayments = () => {
    if (!data?.allPayments) return { pending: [], completed: [], overdue: [], other: [] };
    
    return data.allPayments.reduce((groups, payment) => {
      const status = payment.status.toLowerCase();
      if (status === 'pending' || status === 'partially_paid') {
        groups.pending.push(payment);
      } else if (status === 'completed') {
        groups.completed.push(payment);
      } else if (status === 'overdue') {
        groups.overdue.push(payment);
      } else {
        groups.other.push(payment);
      }
      return groups;
    }, { 
      pending: [], 
      completed: [], 
      overdue: [], 
      other: [] 
    } as Record<string, any[]>);
  };

  const groupedPayments = getGroupedPayments();

  // Get status badge based on payment status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'partially_paid':
        return <Badge className="bg-blue-500">Partially Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Only proceed if we have valid data
      if (!data?.leaseId) {
        throw new Error('No valid agreement found');
      }

      // If a specific payment is selected, use that payment
      let paymentData;
      
      if (selectedPaymentId && selectedPaymentId !== 'new') {
        // Find the selected payment
        const selectedPayment = data.allPayments.find(p => p.id === selectedPaymentId);
        
        if (!selectedPayment) {
          throw new Error('Selected payment not found');
        }

        // Update the existing payment to mark it as completed
        const { error: updateError } = await supabase
          .from('unified_payments')
          .update({
            status: 'completed',
            payment_date: new Date().toISOString(),
            payment_method: 'cash',
            description: `Payment for ${data.agreementNumber}`
          })
          .eq('id', selectedPaymentId);

        if (updateError) throw updateError;
        
        toast({
          title: "Payment Recorded",
          description: `The selected payment of ${selectedPayment.amount} QAR has been marked as completed.`,
        });
      } else {
        // Create a new payment if no specific payment was selected or "new" was selected
        paymentData = {
          amount: data.rentAmount,
          payment_date: new Date().toISOString(),
          lease_id: data.leaseId,
          payment_method: 'cash',
          description: `Monthly rent payment for ${data.agreementNumber}`,
          status: 'completed',
          type: 'Income',
          late_fine_amount: data.lateFeeAmount || 0
        };

        await addPayment(paymentData);
        
        toast({
          title: "Payment Recorded",
          description: "The payment has been successfully recorded.",
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        className="mb-2"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-2">
        <Label htmlFor="carNumber">Car Number</Label>
        <Input
          id="carNumber"
          placeholder="Enter car number"
          value={carNumber}
          onChange={(e) => {
            setCarNumber(e.target.value);
            setSelectedPaymentId(null); // Reset selection when car number changes
          }}
          required
        />
      </div>

      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading payment details...</div>
      )}

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            {data.agreementNumber && (
              <div className="flex justify-between text-sm">
                <span>Agreement Number:</span>
                <span className="font-semibold">{data.agreementNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Current Rent Amount:</span>
              <span className="font-semibold">QAR {data.rentAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Late Payment Fee:</span>
              <span className="font-semibold text-destructive">
                QAR {data.lateFeeAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Default Total Due:</span>
              <span className="font-semibold">QAR {data.totalDue.toFixed(2)}</span>
            </div>
            {data.contractAmount !== null && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Contract Amount:</span>
                <span>QAR {data.contractAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {data.allPayments && data.allPayments.length > 0 ? (
            <div className="space-y-3">
              <Label>Select a Payment to Record</Label>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="pending" className="text-xs">
                    Pending ({groupedPayments.pending.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">
                    Completed ({groupedPayments.completed.length})
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="text-xs">
                    Overdue ({groupedPayments.overdue.length})
                  </TabsTrigger>
                  <TabsTrigger value="new" className="text-xs">
                    New Payment
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="pt-2">
                  {groupedPayments.pending.length > 0 ? (
                    <RadioGroup 
                      value={selectedPaymentId || ''} 
                      onValueChange={setSelectedPaymentId}
                      className="space-y-2"
                    >
                      {groupedPayments.pending.map((payment) => (
                        <div key={payment.id} className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value={payment.id} id={payment.id} />
                          <div className="grid flex-1">
                            <div className="flex justify-between">
                              <Label htmlFor={payment.id} className="font-medium">
                                QAR {payment.amount.toFixed(2)}
                              </Label>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                {payment.description || 'Payment'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Due: {payment.due_date ? formatDate(payment.due_date) : 'Not set'}
                              </span>
                            </div>
                            {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                              <div className="text-sm text-red-500 mt-1">
                                Late Fee: QAR {payment.late_fine_amount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No pending payments found
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="pt-2">
                  {groupedPayments.completed.length > 0 ? (
                    <RadioGroup 
                      value={selectedPaymentId || ''} 
                      onValueChange={setSelectedPaymentId}
                      className="space-y-2"
                    >
                      {groupedPayments.completed.map((payment) => (
                        <div key={payment.id} className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value={payment.id} id={payment.id} />
                          <div className="grid flex-1">
                            <div className="flex justify-between">
                              <Label htmlFor={payment.id} className="font-medium">
                                QAR {payment.amount.toFixed(2)}
                              </Label>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                {payment.description || 'Payment'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Paid: {payment.payment_date ? formatDate(payment.payment_date) : 'Not set'}
                              </span>
                            </div>
                            {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                              <div className="text-sm text-red-500 mt-1">
                                Late Fee: QAR {payment.late_fine_amount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No completed payments found
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="overdue" className="pt-2">
                  {groupedPayments.overdue.length > 0 ? (
                    <RadioGroup 
                      value={selectedPaymentId || ''} 
                      onValueChange={setSelectedPaymentId}
                      className="space-y-2"
                    >
                      {groupedPayments.overdue.map((payment) => (
                        <div key={payment.id} className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value={payment.id} id={payment.id} />
                          <div className="grid flex-1">
                            <div className="flex justify-between">
                              <Label htmlFor={payment.id} className="font-medium">
                                QAR {payment.amount.toFixed(2)}
                              </Label>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">
                                {payment.description || 'Payment'}
                              </span>
                              <span className="text-sm text-red-500 font-medium">
                                Overdue since: {payment.due_date ? formatDate(payment.due_date) : 'Not set'}
                              </span>
                            </div>
                            {payment.late_fine_amount && payment.late_fine_amount > 0 && (
                              <div className="text-sm text-red-500 mt-1">
                                Late Fee: QAR {payment.late_fine_amount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No overdue payments found
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="new" className="pt-2">
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    {/* Fix: Wrap RadioGroupItem inside a RadioGroup */}
                    <RadioGroup value={selectedPaymentId === 'new' ? 'new' : ''} onValueChange={() => setSelectedPaymentId('new')}>
                      <RadioGroupItem value="new" id="new-payment" />
                    </RadioGroup>
                    <div className="grid flex-1">
                      <Label htmlFor="new-payment" className="font-medium">Create New Payment</Label>
                      <span className="text-sm text-muted-foreground">
                        Amount: QAR {data.totalDue.toFixed(2)} (Rent + Late Fee)
                      </span>
                      {data.lateFeeAmount > 0 && (
                        <span className="text-sm text-red-500">
                          Includes Late Fee: QAR {data.lateFeeAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center p-4 border rounded-md">
              <p className="text-muted-foreground">No payments found for this agreement.</p>
              <p className="text-sm text-muted-foreground mt-2">
                You can create a new payment below.
              </p>
              <div className="mt-4">
                {/* Fix: Wrap RadioGroupItem inside a RadioGroup */}
                <RadioGroup value={selectedPaymentId === 'new' ? 'new' : ''} onValueChange={() => setSelectedPaymentId('new')} className="hidden">
                  <RadioGroupItem value="new" id="new-payment" />
                </RadioGroup>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setSelectedPaymentId('new')}
                >
                  Create New Payment
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={!carNumber || loading || isLoading || !!error || !data || (!selectedPaymentId && selectedPaymentId !== 'new')}
        >
          Record Payment
        </Button>
      </div>
    </form>
  );
}
