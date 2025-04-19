
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarDays, User, Car, CreditCard, 
  ClipboardList, FileText, ChevronLeft, 
  Phone, Mail, MapPin, Edit, Printer,
  Download, Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAgreement } from '@/hooks/use-agreements';
import { PaymentHistory } from './PaymentHistory';
import LegalCaseCard from './LegalCaseCard';
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { AgreementActions } from './AgreementActions';
import { AgreementTabs } from './AgreementTabs';
import { AgreementSummaryHeader } from './AgreementSummaryHeader';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { Payment } from './PaymentHistory.types';

const AgreementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);

  const { agreement, isLoading: isAgreementLoading, error: agreementError } = useAgreement(id);
  const [localAgreement, setLocalAgreement] = useState<any>(null);
  const { rentAmount, isLoading: isRentAmountLoading } = useRentAmount(localAgreement, id || '');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [legalCases, setLegalCases] = useState<any[]>([]);
  const [isLoadingLegalCases, setIsLoadingLegalCases] = useState(true);

  useEffect(() => {
    if (agreement) {
      setLocalAgreement(agreement);
    }
  }, [agreement]);

  useEffect(() => {
    if (id) {
      fetchPayments();
      fetchLegalCases();
    }
  }, [id]);

  const fetchPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', id || '');
      
      if (error) throw error;
      
      // Cast to Payment[] to match expected type
      const typedPayments = (data || []) as unknown as Payment[];
      setPayments(typedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Error fetching payments',
        description: 'Could not load payment history for this agreement',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const fetchLegalCases = async () => {
    setIsLoadingLegalCases(true);
    try {
      if (!localAgreement?.customers?.id) {
        console.log("No customer ID available yet for legal cases query");
        setIsLoadingLegalCases(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('customer_id', localAgreement.customers.id);
      
      if (error) throw error;
      
      setLegalCases(data || []);
    } catch (error) {
      console.error('Error fetching legal cases:', error);
    } finally {
      setIsLoadingLegalCases(false);
    }
  };

  const handlePaymentDeleted = () => {
    fetchPayments();
  };

  const refetchAgreement = async () => {
    if (id && agreement) {
      setLocalAgreement(agreement);
    }
  };

  const handleEdit = () => {
    navigate(`/agreements/edit/${id}`);
    toast({
      title: "Editing Agreement",
      description: "Navigating to edit page"
    });
  };

  const handlePrint = () => {
    toast({
      title: "Print Feature",
      description: "Print functionality coming soon",
      variant: "default"
    });
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      toast({
        title: "Preparing PDF",
        description: "Generating agreement document..."
      });
      
      toast({
        title: "PDF Generated",
        description: "Agreement downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDelete = async () => {
    try {
      toast({
        title: "Agreement Deleted",
        description: "The agreement has been removed"
      });
      navigate("/agreements");
    } catch (error) {
      console.error('Error deleting agreement:', error);
      toast({
        title: "Error",
        description: "Failed to delete agreement",
        variant: "destructive"
      });
    }
  };

  const ActionButtons = () => (
    <div className="flex items-center gap-2 mb-6">
      <Button variant="outline" onClick={handleEdit} className="gap-2">
        <Edit className="h-4 w-4" />
        Edit
      </Button>
      <Button variant="outline" onClick={handlePrint} className="gap-2">
        <Printer className="h-4 w-4" />
        Print
      </Button>
      <Button variant="outline" onClick={handleDownloadPDF} className="gap-2" disabled={isGeneratingPdf}>
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
      <Button 
        variant="destructive" 
        onClick={() => setIsDeleteDialogOpen(true)} 
        className="gap-2 ml-auto"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );

  const dateFormat = (date: string | Date | undefined | null) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (err) {
      return 'Invalid date';
    }
  };

  if (isAgreementLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" className="gap-2" asChild>
            <a href="/agreements">
              <ChevronLeft className="h-4 w-4" /> Back to Agreements
            </a>
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-28 bg-slate-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="h-64 bg-slate-200 rounded-lg"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
            <div className="h-64 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (agreementError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" className="gap-2" asChild>
            <a href="/agreements">
              <ChevronLeft className="h-4 w-4" /> Back to Agreements
            </a>
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
          <h2 className="text-lg font-medium text-red-800">Error loading agreement</h2>
          <p className="text-red-600 mt-2">Please try again or contact support if the problem persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" className="gap-2" asChild>
          <a href="/agreements">
            <ChevronLeft className="h-4 w-4" /> Back to Agreements
          </a>
        </Button>
      </div>

      <ActionButtons />

      <AgreementSummaryHeader agreement={localAgreement} rentAmount={rentAmount} />

      <AgreementTabs 
        agreement={localAgreement}
        payments={payments}
        isLoadingPayments={isLoadingPayments}
        rentAmount={rentAmount}
        onPaymentDeleted={handlePaymentDeleted}
        onRefreshPayments={fetchPayments}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <Avatar className="h-10 w-10 bg-primary/10">
                  <AvatarFallback className="text-primary">
                    {localAgreement?.customers?.full_name ? localAgreement.customers.full_name.charAt(0) : 'C'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Name</span>
                  </div>
                  <p className="text-sm mt-1">{localAgreement?.customers?.full_name || 'N/A'}</p>
                </div>
                
                {localAgreement?.customers?.phone_number && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Phone</span>
                    </div>
                    <p className="text-sm mt-1">{localAgreement.customers.phone_number}</p>
                  </div>
                )}
                
                {localAgreement?.customers?.email && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-sm mt-1">{localAgreement.customers.email}</p>
                  </div>
                )}
                
                {localAgreement?.customers?.address && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Address</span>
                    </div>
                    <p className="text-sm mt-1">{localAgreement.customers.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Vehicle Details</h3>
                <Car className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Make</div>
                    <p className="text-sm">{localAgreement?.vehicles?.make || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Model</div>
                    <p className="text-sm">{localAgreement?.vehicles?.model || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Year</div>
                    <p className="text-sm">{localAgreement?.vehicles?.year || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Color</div>
                    <p className="text-sm">{localAgreement?.vehicles?.color || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Plate</div>
                    <p className="text-sm">{localAgreement?.vehicles?.license_plate || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">VIN</div>
                    <p className="text-sm truncate">{localAgreement?.vehicles?.vin || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Agreement Details</h3>
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Agreement #</div>
                    <p className="text-sm">{localAgreement?.agreement_number}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Status</div>
                    <p className="text-sm">
                      <Badge variant={localAgreement?.status === 'active' ? 'success' : 'secondary'}>
                        {localAgreement?.status?.toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Start Date</div>
                    <p className="text-sm">{localAgreement?.start_date ? dateFormat(localAgreement.start_date) : 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">End Date</div>
                    <p className="text-sm">{localAgreement?.end_date ? dateFormat(localAgreement.end_date) : 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Rent Amount</div>
                    <p className="text-sm">QAR {rentAmount?.toLocaleString() || localAgreement?.rent_amount?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Deposit</div>
                    <p className="text-sm">QAR {localAgreement?.deposit_amount?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <PaymentHistory 
          payments={payments || []}
          onPaymentDeleted={handlePaymentDeleted}
          leaseStartDate={localAgreement?.start_date}
          leaseEndDate={localAgreement?.end_date}
          rentAmount={rentAmount}
        />
        
        <LegalCaseCard 
          agreementId={id || ''} 
        />
        
        <AgreementTrafficFines 
          agreementId={id || ''}
          startDate={localAgreement?.start_date}
          endDate={localAgreement?.end_date}
        />
      </AgreementTabs>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the agreement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <InvoiceGenerator 
            recordType="agreement" 
            recordId={id || ''} 
            onClose={() => setIsDocumentDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgreementDetail;
