import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCheck, 
  FileEdit, 
  Calendar, 
  MailCheck, 
  FileClock, 
  AlertTriangle, 
  Settings, 
  Car, 
  User, 
  Phone, 
  Mail, 
  Delete, 
  FileText,
  Calendar as CalendarIcon,
  CheckCircle,
  X,
  ArrowUpDown,
  FileX,
  FileMinus2
} from 'lucide-react';
import { format } from 'date-fns';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PaymentHistory } from "@/components/payments/PaymentHistory";
import { AgreementDocuments } from "./AgreementDocuments";
import { formatCurrency, formatAsQatariPhone } from '@/lib/utils';
import { activateAgreement } from '@/utils/agreement-utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ConflictAlert } from './ConflictAlert';

interface AgreementDetailProps {
  agreement: Agreement;
  onDelete: (id: string) => void;
  onPaymentDeleted?: () => void;
  onDataRefresh?: () => void;
  onGenerateDocument?: () => void;
  rentAmount?: number;
  contractAmount?: number;
}

export const AgreementDetail: React.FC<AgreementDetailProps> = ({
  agreement,
  onDelete,
  onPaymentDeleted,
  onDataRefresh,
  onGenerateDocument,
  rentAmount,
  contractAmount
}) => {
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const navigate = useNavigate();

  const handleActivateAgreement = async () => {
    if (!agreement || !agreement.id || !agreement.vehicle_id) {
      toast.error("Missing required information to activate agreement");
      return;
    }
    
    setIsStatusChanging(true);
    
    try {
      const success = await activateAgreement(agreement.id, agreement.vehicle_id);
      
      if (success) {
        toast.success("Agreement activated successfully");
        if (onDataRefresh) {
          onDataRefresh();
        }
      }
    } catch (error) {
      console.error("Error activating agreement:", error);
      toast.error("Failed to activate agreement");
    } finally {
      setIsStatusChanging(false);
    }
  };

  const updateStatus = async (newStatus: typeof AgreementStatus[keyof typeof AgreementStatus]) => {
    if (!agreement.id) return;
    
    setIsStatusChanging(true);
    
    try {
      const { error } = await supabase
        .from('leases')
        .update({ status: newStatus })
        .eq('id', agreement.id);
        
      if (error) {
        throw error;
      }
      
      toast.success(`Agreement marked as ${newStatus}`);
      
      if (onDataRefresh) {
        onDataRefresh();
      }
    } catch (error) {
      console.error("Error updating agreement status:", error);
      toast.error("Failed to update agreement status");
    } finally {
      setIsStatusChanging(false);
    }
  };

  const getStatusIcon = () => {
    switch(agreement.status) {
      case AgreementStatus.ACTIVE:
        return <FileCheck className="h-5 w-5 text-green-500" />;
      case AgreementStatus.DRAFT:
        return <FileEdit className="h-5 w-5 text-gray-500" />;
      case AgreementStatus.PENDING:
        return <FileClock className="h-5 w-5 text-orange-500" />;
      case AgreementStatus.EXPIRED:
        return <FileText className="h-5 w-5 text-gray-500" />;
      case AgreementStatus.CANCELLED:
        return <FileX className="h-5 w-5 text-red-500" />;
      case AgreementStatus.CLOSED:
        return <FileMinus2 className="h-5 w-5 text-blue-500" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadgeVariant = () => {
    switch(agreement.status) {
      case AgreementStatus.ACTIVE:
        return "success";
      case AgreementStatus.DRAFT:
        return "secondary";
      case AgreementStatus.PENDING:
        return "warning";
      case AgreementStatus.EXPIRED:
        return "outline";
      case AgreementStatus.CANCELLED:
        return "destructive";
      case AgreementStatus.CLOSED:
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      {agreement.status === AgreementStatus.PENDING && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Agreement is Pending</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>This agreement is in pending status. Would you like to activate it?</p>
            <div className="flex gap-2 mt-2">
              <Button 
                size="sm" 
                onClick={handleActivateAgreement}
                disabled={isStatusChanging}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {isStatusChanging ? "Activating..." : "Activate Agreement"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {agreement.vehicle_id && (
        <ConflictAlert 
          agreementId={agreement.id} 
          vehicleId={agreement.vehicle_id} 
          onResolved={onDataRefresh}
        />
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h2 className="text-2xl font-bold">
            Agreement #{agreement.agreement_number || '[No Number]'}
          </h2>
          <Badge variant={getStatusBadgeVariant()} className="capitalize ml-2">
            {agreement.status}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateDocument}
          >
            <FileText className="h-4 w-4 mr-1" />
            Generate Document
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Agreement Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`/agreements/edit/${agreement.id}`)}>
                <FileEdit className="h-4 w-4 mr-2" />
                Edit Agreement
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              
              {agreement.status !== AgreementStatus.ACTIVE && (
                <DropdownMenuItem 
                  onClick={handleActivateAgreement}
                  disabled={isStatusChanging}
                >
                  <FileCheck className="h-4 w-4 mr-2 text-green-500" />
                  Mark as Active
                </DropdownMenuItem>
              )}
              
              {agreement.status !== AgreementStatus.PENDING && (
                <DropdownMenuItem 
                  onClick={() => updateStatus(AgreementStatus.PENDING)}
                  disabled={isStatusChanging}
                >
                  <FileClock className="h-4 w-4 mr-2 text-amber-500" />
                  Mark as Pending
                </DropdownMenuItem>
              )}
              
              {agreement.status !== AgreementStatus.CLOSED && (
                <DropdownMenuItem 
                  onClick={() => updateStatus(AgreementStatus.CLOSED)}
                  disabled={isStatusChanging}
                >
                  <FileMinus2 className="h-4 w-4 mr-2 text-blue-500" />
                  Mark as Closed
                </DropdownMenuItem>
              )}
              
              {agreement.status !== AgreementStatus.EXPIRED && (
                <DropdownMenuItem 
                  onClick={() => updateStatus(AgreementStatus.EXPIRED)}
                  disabled={isStatusChanging}
                >
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  Mark as Expired
                </DropdownMenuItem>
              )}
              
              {agreement.status !== AgreementStatus.CANCELLED && (
                <DropdownMenuItem 
                  onClick={() => updateStatus(AgreementStatus.CANCELLED)}
                  disabled={isStatusChanging}
                >
                  <FileX className="h-4 w-4 mr-2 text-red-500" />
                  Mark as Cancelled
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive" 
                onClick={() => agreement.id && onDelete(agreement.id)}
              >
                <Delete className="h-4 w-4 mr-2" />
                Delete Agreement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agreement Summary</CardTitle>
          <CardDescription>
            Details about the rental agreement
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center space-x-4">
            <Car className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Vehicle Information</h3>
              <p className="text-sm text-muted-foreground">
                {agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.license_plate})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Customer Information</h3>
              <p className="text-sm text-muted-foreground">
                {agreement.customers?.full_name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Rental Period</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(agreement.start_date || new Date()), 'MMM d, yyyy')} - {format(new Date(agreement.end_date || new Date()), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div>
            <h3 className="text-lg font-semibold">Total Amount</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(agreement.total_amount || 0)}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Monthly Rent</h3>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(rentAmount || 0)}
            </p>
          </div>
        </CardFooter>
      </Card>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="customer">Customer Details</TabsTrigger>
          <TabsTrigger value="vehicle">Vehicle Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="payments" className="space-y-2">
          <PaymentHistory 
            agreementId={agreement.id} 
            onPaymentDeleted={onPaymentDeleted}
          />
        </TabsContent>
        <TabsContent value="customer" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>Information about the customer associated with this agreement</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center space-x-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">{agreement.customers?.full_name}</h3>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">{agreement.customers?.email}</h3>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">{formatAsQatariPhone(agreement.customers?.phone_number)}</h3>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="vehicle" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
              <CardDescription>Information about the vehicle associated with this agreement</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center space-x-4">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">{agreement.vehicles?.make} {agreement.vehicles?.model}</h3>
                  <p className="text-sm text-muted-foreground">Vehicle Make and Model</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">{agreement.vehicles?.year}</h3>
                  <p className="text-sm text-muted-foreground">Year of Manufacture</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <MailCheck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">{agreement.vehicles?.license_plate}</h3>
                  <p className="text-sm text-muted-foreground">License Plate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="space-y-2">
          <AgreementDocuments agreement={agreement} />
        </TabsContent>
        <TabsContent value="notes" className="space-y-2">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Notes</CardTitle>
              <CardDescription>Additional notes and information about this agreement</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{agreement.notes || 'No notes available.'}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      <Accordion type="single" collapsible>
        <AccordionItem value="terms">
          <AccordionTrigger>Terms and Conditions</AccordionTrigger>
          <AccordionContent>
            Unfortunately, we do not have any specific terms and conditions to display at this time.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
