
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { formatCurrency } from "@/lib/utils"
import { Agreement, AgreementStatus } from "@/lib/validation-schemas/agreement"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Trash2, Edit, FileText } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { PaymentEntryForm } from "./PaymentEntryForm"
import { Payment, PaymentHistory } from "./PaymentHistory"
import { supabase, initializeSystem } from "@/lib/supabase"
import { AgreementTrafficFines } from "./AgreementTrafficFines"

interface AgreementDetailProps {
  agreement: Agreement
  onDelete?: (id: string) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case AgreementStatus.ACTIVE:
      return "bg-green-500"
    case AgreementStatus.EXPIRED:
      return "bg-gray-500"
    case AgreementStatus.CANCELLED:
      return "bg-red-500"
    case AgreementStatus.DRAFT:
      return "bg-yellow-500"
    case AgreementStatus.PENDING:
      return "bg-blue-500"
    case AgreementStatus.CLOSED:
      return "bg-purple-500"
    default:
      return "bg-gray-500"
  }
}

export const AgreementDetail: React.FC<AgreementDetailProps> = ({ 
  agreement, 
  onDelete 
}) => {
  const navigate = useNavigate()
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)

  const handleEdit = () => {
    navigate(`/agreements/edit/${agreement.id}`)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(agreement.id)
    }
  }

  const handlePrintAgreement = () => {
    toast.info("Print functionality will be implemented in a future update")
  }

  const fetchPayments = async () => {
    setIsLoadingPayments(true)
    try {
      console.log("Fetching payments for agreement:", agreement.id);
      
      // Use a more detailed query to ensure we get all payment records
      const { data: unifiedPayments, error: unifiedError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreement.id)
        .order('payment_date', { ascending: false });
      
      if (unifiedError) {
        console.error("Error fetching unified payments:", unifiedError);
        throw unifiedError;
      }
      
      console.log("Raw payments data:", unifiedPayments);
      
      const formattedPayments = (unifiedPayments || []).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || 'cash',
        reference_number: payment.transaction_id,
        notes: payment.description,
        type: payment.type,
        status: payment.status,
        late_fine_amount: payment.late_fine_amount,
        days_overdue: payment.days_overdue
      }));
      
      setPayments(formattedPayments);
      console.log("Formatted payments set:", formattedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setIsLoadingPayments(false);
    }
  }

  useEffect(() => {
    // Initialize the system and fetch payments when component mounts
    const initializeAndFetch = async () => {
      await initializeSystem();
      await fetchPayments();
    };
    
    initializeAndFetch();
  }, [agreement.id]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agreement {agreement.agreement_number}</h2>
          <p className="text-muted-foreground">
            Created on {format(new Date(agreement.created_at || new Date()), "PPP")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(agreement.status)}>
            {agreement.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Details about the customer</CardDescription>
          </CardHeader>
          <CardContent>
            {agreement.customers ? (
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Name</p>
                  <p>{agreement.customers.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p>{agreement.customers.email || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p>{agreement.customers.phone || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No customer information available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Details about the rented vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            {agreement.vehicles ? (
              <div className="space-y-2">
                <div>
                  <p className="font-medium">Vehicle</p>
                  <p>{agreement.vehicles.make} {agreement.vehicles.model} ({agreement.vehicles.year})</p>
                </div>
                <div>
                  <p className="font-medium">License Plate</p>
                  <p>{agreement.vehicles.license_plate || "N/A"}</p>
                </div>
                <div>
                  <p className="font-medium">Color</p>
                  <p>{agreement.vehicles.color || "N/A"}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No vehicle information available</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Agreement Details</CardTitle>
            <CardDescription>Rental terms and payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Rental Period</p>
                  <p>
                    {format(new Date(agreement.start_date), "PPP")} to {format(new Date(agreement.end_date), "PPP")}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Additional Drivers</p>
                  <p>
                    {agreement.additional_drivers && agreement.additional_drivers.length > 0
                      ? agreement.additional_drivers.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(agreement.total_amount)}</p>
                </div>
                <div>
                  <p className="font-medium">Deposit Amount</p>
                  <p>{formatCurrency(agreement.deposit_amount || 0)}</p>
                </div>
                <div>
                  <p className="font-medium">Terms Accepted</p>
                  <p>{agreement.terms_accepted ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="font-medium">Signature</p>
                  <p>{agreement.signature_url ? "Signed" : "Not signed"}</p>
                </div>
              </div>
            </div>
            
            {agreement.notes && (
              <div className="mt-6">
                <p className="font-medium">Notes</p>
                <p className="whitespace-pre-line">{agreement.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" onClick={handlePrintAgreement}>
                <FileText className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">
                    Record Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Record New Payment</DialogTitle>
                    <DialogDescription>
                      Enter the payment details for agreement {agreement.agreement_number}
                    </DialogDescription>
                  </DialogHeader>
                  <PaymentEntryForm 
                    agreementId={agreement.id} 
                    onPaymentComplete={() => {
                      setIsPaymentDialogOpen(false);
                      fetchPayments();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    agreement and remove the data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <div className="md:col-span-2">
          <PaymentHistory 
            payments={payments} 
            isLoading={isLoadingPayments} 
          />
        </div>

        <div className="md:col-span-2">
          <AgreementTrafficFines 
            agreementId={agreement.id}
            startDate={agreement.start_date}
            endDate={agreement.end_date}
          />
        </div>
      </div>
    </div>
  )
}
