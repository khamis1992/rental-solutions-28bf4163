import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, FileText, PlusCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { useAgreementDetail } from '@/hooks/use-agreement-detail';
import { PaymentEntryDialog } from './PaymentEntryDialog';
import { PaymentHistory } from './PaymentHistory';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { calculateLateFee } from '@/utils/agreement-utils';
import { Badge } from '@/components/ui/badge';
import { AgreementDetailProps, AgreementDetailParams, PaymentSubmitParams } from './AgreementDetail.types';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { ExtendedPayment } from './PaymentHistory.types';

export const AgreementDetail: React.FC<AgreementDetailProps> = ({
  agreement,
  onDelete,
  onGenerateDocument,
  onDataRefresh,
  rentAmount,
  contractAmount,
  onPaymentDeleted
}) => {
  const { id } = useParams<AgreementDetailParams>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    payments, 
    fetchPayments, 
    addPayment: handleAddPayment,
    isLoading: isPaymentsLoading 
  } = useAgreementDetail(id as string);
  
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<ExtendedPayment | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<ExtendedPayment | null>(null);
  const [daysLate, setDaysLate] = useState(0);
  const [lateFeeAmount, setLateFeeAmount] = useState(0);

  useEffect(() => {
    if (!agreement) return;

    const today = new Date();
    const dueDate = agreement.due_date ? new Date(agreement.due_date) : today;
    const diffTime = today.getTime() - dueDate.getTime();
    const days = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    setDaysLate(days);

    if (agreement.rent_amount) {
      const lateFee = calculateLateFee(agreement.rent_amount, days);
      setLateFeeAmount(lateFee);
    }
  }, [agreement]);

  const handleDeleteClick = (payment: ExtendedPayment) => {
    setPaymentToDelete(payment);
    setIsDeleteConfirmationOpen(true);
  };

  const confirmDeletePayment = async () => {
    if (paymentToDelete) {
      try {
        toast.success("Payment deleted successfully");
        onPaymentDeleted();
      } catch (error) {
        console.error("Error deleting payment:", error);
        toast.error("Failed to delete payment");
      } finally {
        setIsDeleteConfirmationOpen(false);
        setPaymentToDelete(null);
      }
    }
  };

  const handleEditPayment = (payment: ExtendedPayment) => {
    setSelectedPayment(payment);
    setIsPaymentDialogOpen(true);
  };

  const handleSubmitPayment = async (params: PaymentSubmitParams) => {
    try {
      await handleAddPayment(params);
      setIsPaymentDialogOpen(false);
      onDataRefresh();
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("Failed to record payment");
    }
  };

  if (!agreement) {
    return <div>Loading agreement details...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{agreement.customer_name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Agreement Details</div>
              <div className="text-muted-foreground">
                Start Date: {format(new Date(agreement.start_date), 'PPP')}
                <br />
                End Date: {format(new Date(agreement.end_date), 'PPP')}
                <br />
                Due Date: {agreement.due_date ? format(new Date(agreement.due_date), 'PPP') : 'N/A'}
                <br />
                Status: <Badge variant="secondary">{agreement.status}</Badge>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Financial Overview</div>
              <div className="text-muted-foreground">
                Rent Amount: QAR {rentAmount?.toFixed(2) || agreement.rent_amount?.toFixed(2)}
                <br />
                Contract Amount: QAR {contractAmount?.toFixed(2) || agreement.contract_amount?.toFixed(2)}
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Vehicle Information</div>
              <div className="text-muted-foreground">
                Make: {agreement.vehicles?.make || 'N/A'}
                <br />
                Model: {agreement.vehicles?.model || 'N/A'}
                <br />
                License Plate: {agreement.vehicles?.license_plate || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Customer Details</div>
              <div className="text-muted-foreground">
                Customer Name: {agreement.customer_name}
                <br />
                Customer Phone: {agreement.customer_phone}
                <br />
                Customer Email: {agreement.customer_email}
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/agreements/edit/${id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(id as string)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <div className="flex gap-2">
              {onGenerateDocument && (
                <Button variant="secondary" size="sm" onClick={onGenerateDocument}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              )}
              <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isPaymentsLoading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <PaymentHistory
              payments={payments}
              isLoading={isPaymentsLoading}
              onPaymentDeleted={onPaymentDeleted}
              onPaymentUpdated={async () => {}}
              onEdit={handleEditPayment}
              onDelete={handleDeleteClick}
              rentAmount={rentAmount}
              contractAmount={contractAmount}
            />
          )}
        </CardContent>
      </Card>

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        handleSubmit={(
          amount, 
          paymentDate, 
          notes, 
          paymentMethod, 
          referenceNumber, 
          includeLatePaymentFee, 
          isPartialPayment,
          targetPaymentId
        ) => {
          handleSubmitPayment({
            amount,
            paymentDate,
            notes,
            paymentMethod,
            referenceNumber,
            includeLatePaymentFee,
            isPartialPayment,
            targetPaymentId
          });
        }}
        defaultAmount={rentAmount || 0}
        lateFeeDetails={{ days: daysLate, amount: lateFeeAmount }}
        selectedPayment={selectedPayment}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={confirmDeletePayment}
        itemType="payment"
      />
    </div>
  );
};

export default AgreementDetail;
