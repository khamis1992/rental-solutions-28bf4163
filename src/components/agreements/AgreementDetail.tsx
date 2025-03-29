
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"
import { formatCurrency } from "@/lib/utils"
import { Agreement, AgreementStatus } from "@/lib/validation-schemas/agreement"
import { Badge } from "@/components/ui/badge"
import { format, differenceInMonths } from "date-fns"
import { Trash2, Edit, FileText, Download } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, useEffect, useRef } from "react"
import { PaymentEntryForm } from "./PaymentEntryForm"
import { Payment, PaymentHistory } from "./PaymentHistory"
import { AgreementTrafficFines } from "./AgreementTrafficFines"
import { generatePdfDocument } from "@/utils/agreementUtils"
import { usePayments } from "@/hooks/use-payments"

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
  onDelete,
  contractAmount,
  rentAmount,
  onPaymentDeleted
}) => {
  const navigate = useNavigate()
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [durationMonths, setDurationMonths] = useState<number>(0)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  
  const isMounted = useRef(true);
  
  const { payments, isLoadingPayments, fetchPayments } = usePayments(agreement.id, rentAmount);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (agreement.start_date && agreement.end_date) {
      const months = differenceInMonths(
        new Date(agreement.end_date),
        new Date(agreement.start_date)
      );
      setDurationMonths(months > 0 ? months : 1);
    }
  }, [agreement.start_date, agreement.end_date]);

  const handleEdit = () => {
    if (agreement && agreement.id) {
      console.log(`Navigating to edit agreement: /agreements/edit/${agreement.id}`);
      navigate(`/agreements/edit/${agreement.id}`);
      toast.info("Editing agreement " + agreement.agreement_number);
    } else {
      toast.error("Cannot edit: Agreement ID is missing");
    }
  }

  const handleDelete = () => {
    if (onDelete && agreement.id) {
      onDelete(agreement.id);
    }
  }

  const handlePrintAgreement = () => {
    toast.info("Print functionality will be implemented in a future update")
  }

  const handleDownloadAgreement = async () => {
    setIsGeneratingPdf(true);
    try {
      console.log("Generating PDF for agreement:", agreement);
      
      toast.info("Preparing agreement PDF document...");
      
      const success = await generatePdfDocument(agreement);
      
      if (success) {
        toast.success("Agreement downloaded as PDF");
      } else {
        toast.error("Failed to generate PDF document");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF document: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // When a payment is completed or deleted, refresh payments
  const handlePaymentChange = () => {
    fetchPayments();
    if (onPaymentDeleted) {
      onPaymentDeleted();
    }
  }

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

      {/* Customer Information Card */}
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

        {/* Vehicle Information Card */}
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

        {/* Agreement Details Card */}
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
                  <p className="text-sm text-muted-foreground">
                    Duration: {durationMonths} {durationMonths === 1 ? 'month' : 'months'}
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
                  <p className="font-medium">Monthly Rent Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(rentAmount || agreement.total_amount)}</p>
                </div>
                <div>
                  <p className="font-medium">Total Contract Amount</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(contractAmount || (rentAmount ? rentAmount * durationMonths : agreement.total_amount * durationMonths))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Monthly rent × {durationMonths} {durationMonths === 1 ? 'month' : 'months'})
                  </p>
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
              <Button 
                variant="outline" 
                onClick={handleDownloadAgreement}
                disabled={isGeneratingPdf}
              >
                <Download className="mr-2 h-4 w-4" />
                {isGeneratingPdf ? "Generating..." : "Download PDF"}
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
                      handlePaymentChange();
                    }} 
                    defaultAmount={rentAmount}
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
            rentAmount={rentAmount}
            onPaymentDeleted={handlePaymentChange}
            leaseStartDate={agreement.start_date}
            leaseEndDate={agreement.end_date}
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

interface AgreementDetailProps {
  agreement: Agreement
  onDelete?: (id: string) => void
  contractAmount?: number | null
  rentAmount?: number | null
  onPaymentDeleted?: () => void
}
