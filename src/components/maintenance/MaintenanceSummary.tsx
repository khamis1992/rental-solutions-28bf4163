
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Vehicle } from '@/types/vehicle';
import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';

interface MaintenanceSummaryProps {
  data: {
    vehicle_id: string;
    maintenance_type: string;
    status: string;
    scheduled_date: Date;
    completion_date?: Date;
    description: string;
    cost: number;
    service_provider: string;
    invoice_number: string;
    odometer_reading: number;
    notes: string;
  };
  vehicle?: Vehicle;
}

const MaintenanceSummary: React.FC<MaintenanceSummaryProps> = ({ data, vehicle }) => {
  const formatMaintenanceType = (type: string) => {
    if (!type) return 'Unknown';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-green-50 p-4 rounded-md border border-green-100 flex items-center">
        <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
        <p className="text-green-800">Please review your maintenance record details before submitting</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4 border-b pb-2">Vehicle Information</h3>
            {vehicle ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Make</span>
                  <span className="font-medium">{vehicle.make}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{vehicle.model}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">License Plate</span>
                  <span className="font-medium">{vehicle.license_plate}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Vehicle information not available</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4 border-b pb-2">Maintenance Details</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{formatMaintenanceType(data.maintenance_type)}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{data.status}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Scheduled Date</span>
                <span className="font-medium">{format(data.scheduled_date, 'PPP')}</span>
              </div>
              {data.completion_date && (
                <div className="grid grid-cols-2">
                  <span className="text-muted-foreground">
                    {data.status === 'completed' ? 'Completion Date' : 'Start Date'}
                  </span>
                  <span className="font-medium">{format(data.completion_date, 'PPP')}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-medium mb-4 border-b pb-2">Service Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Cost</span>
                <span className="font-medium">${data.cost.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Odometer</span>
                <span className="font-medium">{data.odometer_reading.toLocaleString()} km</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Service Provider</span>
                <span className="font-medium">{data.service_provider || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Invoice Number</span>
                <span className="font-medium">{data.invoice_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {(data.description || data.notes) && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-medium mb-4 border-b pb-2">Notes & Description</h3>
            {data.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm">{data.description}</p>
              </div>
            )}
            {data.notes && (
              <div>
                <h4 className="text-sm font-medium mb-1">Additional Notes</h4>
                <p className="text-sm">{data.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MaintenanceSummary;
