
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgreements, AgreementStatus, AgreementWithDetails } from '@/hooks/use-agreements';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, FileText, PenSquare, Trash2, MoreVertical } from 'lucide-react';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { AgreementPayments } from '@/components/agreements/AgreementPayments';
import { AgreementDocuments } from '@/components/agreements/AgreementDocuments';
import { AgreementVehicleDetails } from '@/components/agreements/AgreementVehicleDetails';
import PageContainer from '@/components/layout/PageContainer';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, updateAgreementStatus, deleteAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<AgreementWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  useEffect(() => {
    // Guard against multiple fetches in rapid succession
    if (hasAttemptedFetch) return;
    
    const fetchAgreement = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await getAgreement(id);
        if (data) {
          setAgreement(data);
        } else {
          toast.error("Agreement not found");
          navigate("/agreements");
        }
      } catch (error) {
        console.error("Error fetching agreement:", error);
        toast.error("Failed to load agreement details");
      } finally {
        setIsLoading(false);
        setHasAttemptedFetch(true);
      }
    };

    fetchAgreement();
  }, [id, getAgreement, navigate, hasAttemptedFetch]);

  const handleStatusChange = async (newStatus: string) => {
    if (!agreement) return;
    
    setIsUpdating(true);
    try {
      await updateAgreementStatus.mutateAsync({
        id: agreement.id,
        status: newStatus as any
      });
      
      // Update local state
      setAgreement(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error("Error updating agreement status:", error);
      toast.error("Failed to update agreement status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!agreement) return;
    
    setIsDeleting(true);
    try {
      await deleteAgreement.mutateAsync(agreement.id);
      toast.success("Agreement deleted successfully");
      navigate("/agreements");
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error("Failed to delete agreement");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer
        title="Loading Agreement..."
        description="Please wait while we fetch the agreement details"
        backLink="/agreements"
      >
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  if (!agreement) {
    return (
      <PageContainer
        title="Agreement Not Found"
        description="The agreement you're looking for doesn't exist"
        backLink="/agreements"
      >
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Agreement Not Found</AlertTitle>
          <AlertDescription>
            The agreement you're looking for could not be found. It may have been deleted or the ID is incorrect.
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const agreementDate = agreement.start_date 
    ? new Date(agreement.start_date) 
    : new Date();
  
  const endDate = agreement.end_date 
    ? new Date(agreement.end_date) 
    : new Date();

  return (
    <PageContainer
      title={`Agreement #${agreement.agreement_number || "N/A"}`}
      description="View and manage rental agreement details"
      backLink="/agreements"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Badge 
            className={agreement.status === AgreementStatus.ACTIVE ? 'bg-green-100 text-green-800' : 
                       agreement.status === AgreementStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 
                       agreement.status === AgreementStatus.CANCELLED ? 'bg-red-100 text-red-800' : 
                       agreement.status === AgreementStatus.EXPIRED ? 'bg-gray-100 text-gray-800' : 
                       'bg-blue-100 text-blue-800'}
          >
            {agreement.status?.toUpperCase() || "UNKNOWN"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Created on {formatDate(new Date(agreement.created_at || Date.now()))}
          </span>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/agreements/${id}/edit`)}
          >
            <PenSquare className="mr-2 h-4 w-4" /> Edit
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Agreement Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleStatusChange(AgreementStatus.ACTIVE)}
                disabled={agreement.status === AgreementStatus.ACTIVE || isUpdating}
              >
                Mark as Active
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange(AgreementStatus.PENDING)}
                disabled={agreement.status === AgreementStatus.PENDING || isUpdating}
              >
                Mark as Pending
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange(AgreementStatus.EXPIRED)}
                disabled={agreement.status === AgreementStatus.EXPIRED || isUpdating}
              >
                Mark as Expired
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleStatusChange(AgreementStatus.CANCELLED)}
                disabled={agreement.status === AgreementStatus.CANCELLED || isUpdating}
              >
                Mark as Cancelled
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)} 
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Agreement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agreement Details</CardTitle>
            <CardDescription>General information about this rental agreement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium mb-1">Agreement Number</h4>
                <p className="text-lg font-semibold">{agreement.agreement_number}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Start Date</h4>
                <p>{formatDate(agreementDate)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">End Date</h4>
                <p>{formatDate(endDate)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Monthly Rent</h4>
                <p className="text-lg font-semibold">{formatCurrency(agreement.rent_amount || 0)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Total Amount</h4>
                <p>{formatCurrency(agreement.total_amount || 0)}</p>
              </div>
            </div>

            {agreement.notes && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">{agreement.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold mb-1">Name</h4>
                <p>{agreement.customer?.full_name || "Not assigned"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Email</h4>
                <p className="text-sm">{agreement.customer?.email || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Phone</h4>
                <p>{agreement.customer?.phone_number || "N/A"}</p>
              </div>
              <div className="pt-2">
                {agreement.customer?.id && (
                  <Button asChild variant="link" className="p-0 h-auto font-normal">
                    <Link to={`/customers/${agreement.customer.id}`}>
                      View Customer Profile
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="vehicle">
          <TabsList className="mb-6">
            <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="vehicle">
            <AgreementVehicleDetails agreement={agreement} />
          </TabsContent>
          <TabsContent value="payments">
            <AgreementPayments agreementId={agreement.id} />
          </TabsContent>
          <TabsContent value="documents">
            <AgreementDocuments agreementId={agreement.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agreement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agreement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)} 
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default AgreementDetailPage;
