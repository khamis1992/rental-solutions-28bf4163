import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertTriangle, 
  Car, 
  CheckCircle, 
  MoreVertical, 
  Plus, 
  Search, 
  X,
  UserCheck,
  DollarSign,
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/ui/stat-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { useTranslation as useAppTranslation } from '@/contexts/TranslationContext';

interface TrafficFinesListProps {
  onAddFine?: () => void;
  isAutoAssigning?: boolean;
}

const TrafficFinesList = ({ onAddFine, isAutoAssigning = false }: TrafficFinesListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { trafficFines, isLoading, error, payTrafficFine, disputeTrafficFine, assignToCustomer } = useTrafficFines();
  const [assigningFines, setAssigningFines] = useState(false);
  const [dataValidation, setDataValidation] = useState<{ valid: boolean; issues: string[] }>({ 
    valid: true, 
    issues: [] 
  });
  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();
  
  useEffect(() => {
    if (trafficFines && trafficFines.length > 0) {
      validateTrafficFinesData(trafficFines);
    }
  }, [trafficFines]);
  
  const validateTrafficFinesData = (fines: any[]) => {
    const issues: string[] = [];
    
    fines.forEach((fine, index) => {
      if (!fine.id) {
        issues.push(`Fine at index ${index} is missing ID field`);
      }
      
      if (!fine.violationNumber) {
        issues.push(`Fine ID ${fine.id} is missing violation number`);
      }
      
      if (!fine.licensePlate) {
        issues.push(`Fine ID ${fine.id} (${fine.violationNumber || 'Unknown'}) is missing license plate`);
      }
      
      if (!fine.fineAmount && fine.fineAmount !== 0) {
        issues.push(`Fine ID ${fine.id} (${fine.violationNumber || 'Unknown'}) is missing amount`);
      }
      
      if (fine.violationDate && !(fine.violationDate instanceof Date) && isNaN(new Date(fine.violationDate).getTime())) {
        issues.push(`Fine ID ${fine.id} (${fine.violationNumber || 'Unknown'}) has invalid violation date`);
      }
    });
    
    setDataValidation({
      valid: issues.length === 0,
      issues
    });
    
    if (issues.length > 0) {
      console.warn('Traffic fines data validation issues:', issues);
    }
  };

  const filteredFines = trafficFines ? trafficFines.filter(fine => 
    ((fine.violationNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.licensePlate?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (fine.violationCharge?.toLowerCase() || '').includes(searchQuery.toLowerCase()))
  ) : [];

  const assignedFines = filteredFines.filter(fine => fine.customerId);
  const unassignedFines = filteredFines.filter(fine => !fine.customerId);
  
  const assignedFinesAmount = assignedFines.reduce((total, fine) => total + fine.fineAmount, 0);
  const unassignedFinesAmount = unassignedFines.reduce((total, fine) => total + fine.fineAmount, 0);

  const handlePayFine = async (id: string) => {
    try {
      await payTrafficFine.mutate({ id });
      toast.success(t("trafficFines.paymentSuccess", "Fine marked as paid successfully"));
    } catch (error) {
      console.error("Error paying fine:", error);
      toast.error(t("trafficFines.paymentError", "Failed to pay fine"), {
        description: error instanceof Error ? error.message : t("common.unknownError", "An unknown error occurred")
      });
    }
  };

  const handleDisputeFine = async (id: string) => {
    try {
      await disputeTrafficFine.mutate({ id });
      toast.success(t("trafficFines.disputeSuccess", "Fine marked as disputed successfully"));
    } catch (error) {
      console.error("Error disputing fine:", error);
      toast.error(t("trafficFines.disputeError", "Failed to dispute fine"), {
        description: error instanceof Error ? error.message : t("common.unknownError", "An unknown error occurred")
      });
    }
  };

  const handleAutoAssignFines = async () => {
    try {
      setAssigningFines(true);
      toast.info(t("trafficFines.autoAssigning", "Auto-assigning fines"), {
        description: t("trafficFines.autoAssigningDesc", "Please wait while fines are assigned to customers...")
      });

      let assignedCount = 0;
      let failedCount = 0;
      const pendingFines = filteredFines.filter(fine => !fine.customerId);

      if (pendingFines.length === 0) {
        toast.info("No unassigned fines to process");
        setAssigningFines(false);
        return;
      }

      console.log(`Attempting to auto-assign ${pendingFines.length} fines`);

      for (const fine of pendingFines) {
        if (!fine.licensePlate) {
          console.log(`Skipping fine ${fine.id} - missing license plate`);
          continue;
        }

        try {
          console.log(`Assigning fine ${fine.id} with license plate ${fine.licensePlate}`);
          await assignToCustomer.mutate({ id: fine.id });
          assignedCount++;
        } catch (error) {
          console.error(`Failed to assign fine ${fine.id}:`, error);
          failedCount++;
        }
      }

      if (assignedCount > 0) {
        toast.success(`Successfully assigned ${assignedCount} out of ${pendingFines.length} fines to customers`);
      } else {
        toast.warning("No fines could be assigned to customers");
      }

      if (failedCount > 0) {
        toast.error(`Failed to assign ${failedCount} fines`);
      }
    } catch (error: any) {
      console.error("Auto-assignment error:", error);
      toast.error(t("trafficFines.autoAssignError", "There was an error assigning fines to customers: ") + 
                 (error.message || t("common.unknownError", "Unknown error")));
    } finally {
      setAssigningFines(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 text-white border-green-600"><CheckCircle className={`${isRTL ? 'ml-1' : 'mr-1'} h-3 w-3`} /> {t("trafficFines.status.paid", "Paid")}</Badge>;
      case 'disputed':
        return <Badge className="bg-amber-500 text-white border-amber-600"><AlertTriangle className={`${isRTL ? 'ml-1' : 'mr-1'} h-3 w-3`} /> {t("trafficFines.status.disputed", "Disputed")}</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-red-500 text-white border-red-600"><X className={`${isRTL ? 'ml-1' : 'mr-1'} h-3 w-3`} /> {t("trafficFines.status.pending", "Pending")}</Badge>;
    }
  };

  const getCustomerAssignmentStatus = (fine: any) => {
    if (fine.customerId) {
      return (
        <Badge className="bg-blue-500 text-white border-blue-600">
          <UserCheck className={`${isRTL ? 'ml-1' : 'mr-1'} h-3 w-3`} /> {t("trafficFines.assignedTo", "Assigned")}
        </Badge>
      );
    }
    return <Badge variant="outline">{t("trafficFines.unassigned", "Unassigned")}</Badge>;
  };

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading traffic fines</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load traffic fines data"}
        </AlertDescription>
      </Alert>
    );
  }

  const renderDataValidationWarning = () => {
    if (!dataValidation.valid && dataValidation.issues.length > 0) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Data Validation Issues</AlertTitle>
          <AlertDescription>
            <p>Some traffic fines data has validation issues:</p>
            <ul className="list-disc pl-5 mt-2">
              {dataValidation.issues.slice(0, 3).map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
              {dataValidation.issues.length > 3 && (
                <li>...and {dataValidation.issues.length - 3} more issues</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {renderDataValidationWarning()}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title={t("trafficFines.totalFines", "Total Traffic Fines")}
          value={filteredFines?.length.toString() || "0"}
          description={t("trafficFines.totalFinesDesc", "Total number of traffic fines in the system")}
          icon={AlertTriangle}
          iconColor="text-amber-500"
        />
        <StatCard 
          title={t("trafficFines.assignedFines", "Assigned Fines")}
          value={assignedFines?.length.toString() || "0"}
          description={`${t("common.total")}: ${formatCurrency(assignedFinesAmount || 0)}`}
          icon={UserCheck}
          iconColor="text-blue-500"
        />
        <StatCard 
          title={t("trafficFines.unassignedFines", "Unassigned Fines")}
          value={unassignedFines?.length.toString() || "0"}
          description={`${t("common.total")}: ${formatCurrency(unassignedFinesAmount || 0)}`}
          icon={Users}
          iconColor="text-red-500"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{t("trafficFines.title", "Traffic Fines")}</CardTitle>
              <CardDescription>
                {t("trafficFines.description", "Manage and track traffic fines for your vehicles")}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                className="w-full md:w-auto"
                onClick={handleAutoAssignFines}
                disabled={assigningFines || isAutoAssigning}
                variant="secondary"
              >
                {(assigningFines || isAutoAssigning) ? (
                  <>
                    <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} /> 
                    {t("trafficFines.assigning", "Assigning...")}
                  </>
                ) : (
                  <>
                    <UserCheck className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> 
                    {t("trafficFines.autoAssign", "Auto-Assign")}
                  </>
                )}
              </Button>
              <Button 
                className="w-full md:w-auto"
                onClick={onAddFine}
              >
                <Plus className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> 
                {t("trafficFines.addFine", "Add Fine")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-2.5 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={t("trafficFines.searchPlaceholder", "Search by violation number, license plate, or charge...")}
                className={`${isRTL ? 'pr-8' : 'pl-8'}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("trafficFines.violationNumber", "Violation #")}</TableHead>
                  <TableHead>{t("common.licensePlate", "License Plate")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("trafficFines.violationDate", "Violation Date")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("trafficFines.location", "Location")}</TableHead>
                  <TableHead>{t("common.amount", "Amount")}</TableHead>
                  <TableHead>{t("common.status", "Status")}</TableHead>
                  <TableHead>{t("common.customer", "Customer")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || isAutoAssigning ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        {isAutoAssigning 
                          ? t("trafficFines.autoAssigningProgress", "Auto-assigning traffic fines...") 
                          : t("common.loading", "Loading traffic fines...")}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredFines && filteredFines.length > 0 ? (
                  filteredFines.map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <AlertTriangle className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 text-warning`} />
                          {fine.violationNumber}
                        </div>
                      </TableCell>
                      <TableCell>{fine.licensePlate}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(fine.violationDate)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{fine.location || t("common.notProvided", "N/A")}</TableCell>
                      <TableCell>{formatCurrency(fine.fineAmount)}</TableCell>
                      <TableCell>
                        {getStatusBadge(fine.paymentStatus)}
                      </TableCell>
                      <TableCell>
                        {getCustomerAssignmentStatus(fine)}
                        {fine.customerName && (
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
                            {fine.customerName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? "start" : "end"}>
                            <DropdownMenuItem 
                              onClick={() => handlePayFine(fine.id)}
                              disabled={fine.paymentStatus === 'paid'}
                            >
                              <CheckCircle className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t("trafficFines.payFine", "Pay Fine")}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDisputeFine(fine.id)}
                              disabled={fine.paymentStatus === 'disputed'}
                            >
                              <X className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t("trafficFines.disputeFine", "Dispute Fine")}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => assignToCustomer.mutate({ id: fine.id })}
                              disabled={!!fine.customerId}
                            >
                              <UserCheck className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t("trafficFines.assignToCustomer", "Assign to Customer")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      {searchQuery 
                        ? t("trafficFines.noMatchingFines", "No matching traffic fines found.") 
                        : t("trafficFines.noFines", "No traffic fines found.")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFinesList;
