
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Vehicle } from '@/types/vehicle';
import {
  Car,
  Calendar,
  CreditCard,
  MapPin,
  Shield,
  Clipboard,
  Info,
  Gauge,
  Palette,
  BarChart3
} from 'lucide-react';

interface VehicleDetailProps {
  vehicle: Vehicle;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle }) => {
  if (!vehicle) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'police_station':
        return 'bg-purple-100 text-purple-800';
      case 'accident':
        return 'bg-red-100 text-red-800';
      case 'stolen':
        return 'bg-red-200 text-red-900';
      case 'retired':
        return 'bg-gray-100 text-gray-800';
      case 'reserved':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Vehicle Header with Image */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-1/3 rounded-lg overflow-hidden h-64 bg-gray-100 border border-gray-200 shadow-sm">
          {vehicle?.image_url ? (
            <img 
              src={vehicle.image_url} 
              alt={`${vehicle.make} ${vehicle.model}`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car size={64} className="text-gray-300" />
              <span className="ml-2 text-gray-400">No image available</span>
            </div>
          )}
        </div>
        
        <div className="w-full lg:w-2/3 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h1>
              <p className="text-muted-foreground">{vehicle.year} • {vehicle.license_plate}</p>
            </div>
            <Badge className={`mt-2 md:mt-0 ${getStatusColor(vehicle.status || '')}`}>
              {formatStatus(vehicle.status || '')}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-100">
              <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Rent Amount</p>
                <p className="text-lg font-semibold">{formatCurrency(vehicle.rent_amount || 0)}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-100">
              <Palette className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Color</p>
                <p className="text-lg font-semibold">{vehicle.color || 'Not specified'}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-100">
              <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-lg font-semibold">{vehicle.location || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabbed Content */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="additional">Additional Info</TabsTrigger>
        </TabsList>
        
        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">VIN</span>
                    <span className="font-medium">{vehicle.vin}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">License Plate</span>
                    <span className="font-medium">{vehicle.license_plate}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Make</span>
                    <span className="font-medium">{vehicle.make}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-medium">{vehicle.model}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Year</span>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Mileage</span>
                    <span className="font-medium">{vehicle.mileage !== undefined ? `${vehicle.mileage}km` : 'Not Available'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Color</span>
                    <span className="font-medium">{vehicle.color || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">
                      <Badge className={getStatusColor(vehicle.status || '')}>
                        {formatStatus(vehicle.status || '')}
                      </Badge>
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-medium">
                      {vehicle.updated_at ? format(new Date(vehicle.updated_at), 'dd MMM yyyy, HH:mm') : 'Not available'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Created On</span>
                    <span className="font-medium">
                      {vehicle.created_at ? format(new Date(vehicle.created_at), 'dd MMM yyyy') : 'Not available'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Daily Rate</span>
                    <span className="font-medium">{formatCurrency(vehicle.dailyRate || 0)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Monthly Rate</span>
                    <span className="font-medium">{formatCurrency((vehicle.rent_amount || 0))}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Current Customer</span>
                    <span className="font-medium">{vehicle.currentCustomer || 'None'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Insurance Tab */}
        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Insurance Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Insurance Company</span>
                      <span className="font-medium">{vehicle.insurance_company || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Insurance Expiry</span>
                      <span className="font-medium">
                        {vehicle.insurance_expiry 
                          ? format(new Date(vehicle.insurance_expiry), 'dd/MM/yyyy') 
                          : 'Not specified'}
                      </span>
                    </div>
                    {vehicle.insurance_expiry && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Days Until Expiry</span>
                        <span className="font-medium">
                          {Math.max(0, Math.ceil((new Date(vehicle.insurance_expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Additional Info Tab */}
        <TabsContent value="additional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clipboard className="h-5 w-5 mr-2" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground p-3 bg-gray-50 rounded-md">
                    {vehicle.description || 'No description available for this vehicle.'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Maintenance Schedule</h3>
                  <div className="text-muted-foreground p-3 bg-gray-50 rounded-md">
                    <p>Last serviced: Not recorded</p>
                    <p>Next service due: Not scheduled</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Features</h3>
                  <p className="text-muted-foreground p-3 bg-gray-50 rounded-md">
                    {vehicle.vehicleType?.features?.length > 0 
                      ? vehicle.vehicleType.features.join(', ') 
                      : 'No features listed'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleDetail;
