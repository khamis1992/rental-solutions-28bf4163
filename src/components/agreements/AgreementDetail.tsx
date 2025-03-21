
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/custom-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Car, CreditCard, FileEdit, Loader2, MapPin, PhoneCall, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAgreements } from '@/hooks/use-agreements';
import { AgreementStatus } from '@/types/agreement';

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch (e) {
    return dateString;
  }
};

// Status badge styles by status type
const getStatusStyles = (status: AgreementStatus) => {
  switch (status) {
    case 'active':
      return { variant: 'default', className: 'bg-green-500 hover:bg-green-600' };
    case 'completed':
      return { variant: 'secondary' };
    case 'pending':
      return { variant: 'outline', className: 'border-blue-500 text-blue-500' };
    case 'cancelled':
      return { variant: 'destructive' };
    case 'overdue':
      return { variant: 'destructive', className: 'bg-orange-500 hover:bg-orange-600' };
    default:
      return { variant: 'outline' };
  }
};

const AgreementDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const { useAgreement, useUpdate } = useAgreements();
  const { data: agreement, isLoading, isError } = useAgreement(id || '');
  const updateMutation = useUpdate();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading agreement...</span>
      </div>
    );
  }
  
  if (isError || !agreement) {
    return (
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-10">
            <h3 className="text-xl font-semibold mb-2">Agreement Not Found</h3>
            <p className="text-muted-foreground mb-4">The requested agreement could not be found or has been deleted.</p>
            <Button onClick={() => navigate('/agreements')}>Back to Agreements</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const status = agreement.status as AgreementStatus;
  const statusStyle = getStatusStyles(status);
  
  // Handler for quick status updates
  const handleStatusUpdate = async (newStatus: AgreementStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: agreement.id,
        data: { status: newStatus }
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl font-bold">
                Rental Agreement
              </CardTitle>
              <Badge variant={statusStyle.variant as any} className={statusStyle.className}>
                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
              </Badge>
            </div>
            <CardDescription>
              Created on {formatDate(agreement.created_at)}
            </CardDescription>
          </div>
          
          <CustomButton 
            onClick={() => navigate(`/agreements/edit/${agreement.id}`)} 
            className="flex items-center gap-1"
            glossy
          >
            <FileEdit className="h-4 w-4" /> Edit Agreement
          </CustomButton>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Customer Information
              </h3>
              
              {agreement.customer ? (
                <div className="space-y-2">
                  <div className="font-medium text-xl">
                    {agreement.customer.first_name} {agreement.customer.last_name}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <PhoneCall className="h-4 w-4" /> {agreement.customer?.phone || 'No phone number'}
                  </div>
                  <div className="text-muted-foreground">
                    {agreement.customer.email}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Customer information not available</div>
              )}
            </div>
            
            {/* Vehicle Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" /> Vehicle Information
              </h3>
              
              {agreement.vehicle ? (
                <div className="space-y-2">
                  <div className="font-medium text-xl">
                    {agreement.vehicle.make} {agreement.vehicle.model} ({agreement.vehicle.year})
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> License Plate: {agreement.vehicle.license_plate}
                  </div>
                  
                  {agreement.vehicle.image_url && (
                    <img 
                      src={agreement.vehicle.image_url} 
                      alt={`${agreement.vehicle.make} ${agreement.vehicle.model}`} 
                      className="h-24 object-cover rounded-md mt-2"
                    />
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">Vehicle information not available</div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {/* Rental Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Rental Period
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="text-sm font-medium text-muted-foreground mb-1">Start Date</div>
                <div className="font-semibold">{formatDate(agreement.start_date)}</div>
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <div className="text-sm font-medium text-muted-foreground mb-1">End Date</div>
                <div className="font-semibold">{formatDate(agreement.end_date)}</div>
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <div className="text-sm font-medium text-muted-foreground mb-1">Duration</div>
                <div className="font-semibold">
                  {Math.ceil(Math.abs(new Date(agreement.end_date).getTime() - new Date(agreement.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="text-sm font-medium text-muted-foreground mb-1">Total Cost</div>
                <div className="font-semibold text-xl">${agreement.total_cost.toFixed(2)}</div>
              </div>
              
              {agreement.deposit_amount && (
                <div className="bg-muted p-4 rounded-md">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Deposit</div>
                  <div className="font-semibold text-xl">${agreement.deposit_amount.toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Notes */}
          {agreement.notes && (
            <>
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Notes</h3>
                <div className="bg-muted p-4 rounded-md">
                  {agreement.notes}
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="text-sm font-medium mb-1">Quick Status Update</div>
            <div className="flex flex-wrap gap-2">
              {status !== 'active' && (
                <Button 
                  variant="default" 
                  className="bg-green-500 hover:bg-green-600"
                  size="sm"
                  onClick={() => handleStatusUpdate('active')}
                  disabled={updateMutation.isPending}
                >
                  Mark as Active
                </Button>
              )}
              
              {status !== 'completed' && (
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updateMutation.isPending}
                >
                  Mark as Completed
                </Button>
              )}
              
              {status !== 'cancelled' && (
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateMutation.isPending}
                >
                  Cancel Agreement
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex-1"></div>
          
          <Button
            variant="outline"
            onClick={() => navigate('/agreements')}
          >
            Back to Agreements
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AgreementDetail;
