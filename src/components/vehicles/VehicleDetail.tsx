import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/types/vehicle';
import { Calendar, MapPin, Fuel, Activity, Key, CreditCard, Car, Palette, Settings, Info, Shield, Wrench, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isAfter, parseISO } from 'date-fns';
import { useMaintenance } from '@/hooks/use-maintenance';
import { MaintenanceStatus, MaintenanceType } from '@/lib/validation-schemas/maintenance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomButton } from '@/components/ui/custom-button';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { getVehicleImageByPrefix, getModelSpecificImage } from '@/lib/vehicles/vehicle-storage';
import { toast } from 'sonner';

interface VehicleDetailProps {
  vehicle: Vehicle;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle
}) => {
  const navigate = useNavigate();
  const {
    useList: useMaintenanceList
  } = useMaintenance();
  const {
    agreements,
    isLoading: isLoadingAgreements,
    setSearchParams
  } = useAgreements({
    vehicle_id: vehicle.id
  });
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(true);
  const [vehicleImageUrl, setVehicleImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  
  const {
    getByVehicleId
  } = useMaintenance();
  const statusColors = {
    available: 'bg-green-100 text-green-800',
    rented: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-amber-100 text-amber-800',
    retired: 'bg-red-100 text-red-800'
  };

  const defaultCarImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop';
  
  useEffect(() => {
    async function fetchVehicleImage() {
      setImageLoading(true);
      
      try {
        const modelTypes = ['B70', 'T33', 'T99', 'A30', 'TERRITORY', 'GS3', 'MG5', 'Alsvin'];
        const modelToCheck = vehicle.model || '';
        
        const matchedModelType = modelTypes.find(type => 
          modelToCheck.toUpperCase().includes(type) || 
          modelToCheck.toLowerCase().includes(type.toLowerCase())
        );
        
        if (matchedModelType) {
          console.log(`Detail view: Vehicle matched model type: ${matchedModelType}`);
          const modelImage = await getModelSpecificImage(matchedModelType);
          
          if (modelImage) {
            console.log(`Detail view: Using ${matchedModelType} image from storage:`, modelImage);
            setVehicleImageUrl(modelImage);
            setImageLoading(false);
            return;
          }
        }
        
        if (vehicle.imageUrl || vehicle.image_url) {
          setVehicleImageUrl(vehicle.imageUrl || vehicle.image_url);
          setImageLoading(false);
          return;
        }
        
        const imageUrl = await getVehicleImageByPrefix(vehicle.id);
        if (imageUrl) {
          setVehicleImageUrl(imageUrl);
          setImageLoading(false);
          return;
        }

        fallbackToModelImages();
      } catch (error) {
        console.error('Error fetching vehicle image:', error);
        fallbackToModelImages();
      } finally {
        setImageLoading(false);
      }
    }
    
    fetchVehicleImage();
  }, [vehicle.id, vehicle.imageUrl, vehicle.image_url, vehicle.model]);
  
  const fallbackToModelImages = () => {
    const t77Image = '/lovable-uploads/3e327a80-91f9-498d-aa11-cb8ed24eb199.png';
    const gacImage = '/lovable-uploads/e38aaeba-21fd-492e-9f43-2d798fe0edfc.png';
    const mgImage = '/lovable-uploads/5384d3e3-5c1c-4588-b472-64e08eeeac72.png';
    const mg5Image = '/lovable-uploads/355f1572-39eb-4db2-8d1b-0da5b1ce4d00.png';
    const gs3Image = '/lovable-uploads/3a9a07d4-ef18-41ea-ac89-3b22acd724d0.png';
    const b70Image = '/lovable-uploads/977480e0-3193-4751-b9d0-8172d78e42e5.png';
    const t33Image = '/lovable-uploads/a27a9638-2a8b-4f23-b9fb-1c311298b745.png';
    
    try {
      const makeLower = (vehicle.make || '').toString().toLowerCase().trim();
      const modelLower = (vehicle.model || '').toString().toLowerCase().trim();
      
      console.log('Vehicle detail make/model:', makeLower, modelLower);
      
      if (modelLower.includes('b70') || modelLower === 'b70') {
        setVehicleImageUrl(b70Image);
        console.log('Using B70 fallback image in detail');
      }
      else if (modelLower.includes('t33') || modelLower === 't33') {
        setVehicleImageUrl(t33Image);
        console.log('Using T33 fallback image in detail');
      }
      else if (modelLower.includes('t77') || modelLower === 't77') {
        setVehicleImageUrl(t77Image);
        console.log('Using T77 fallback image in detail');
      } 
      else if (makeLower.includes('gac') && modelLower.includes('gs3')) {
        setVehicleImageUrl(gs3Image);
        console.log('Using GAC GS3 fallback image in detail');
      }
      else if (modelLower.includes('gs3') || modelLower === 'gs3') {
        setVehicleImageUrl(gs3Image);
        console.log('Using GS3 fallback image in detail');
      }
      else if (makeLower.includes('gac')) {
        setVehicleImageUrl(gacImage);
        console.log('Using generic GAC fallback image in detail');
      } 
      else if (
        makeLower === 'mg' || 
        makeLower.startsWith('mg ') || 
        modelLower.startsWith('mg')
      ) {
        if (
          modelLower.includes('5') || 
          modelLower.includes('mg5') || 
          makeLower.includes('mg5') ||
          (makeLower === 'mg' && modelLower === '5')
        ) {
          setVehicleImageUrl(mg5Image);
          console.log('Using MG5 specific fallback image in detail:', mg5Image);
        } else {
          setVehicleImageUrl(mgImage);
          console.log('Using generic MG fallback image in detail:', mgImage);
        }
      } else {
        setVehicleImageUrl(defaultCarImage);
      }
    } catch (error) {
      console.error('Error setting vehicle detail image:', error);
      setVehicleImageUrl(defaultCarImage);
    }
  };

  const hasInsurance = !!vehicle.insurance_company;
  const insuranceExpiry = vehicle.insurance_expiry ? parseISO(vehicle.insurance_expiry) : null;
  const isInsuranceValid = insuranceExpiry ? isAfter(insuranceExpiry, new Date()) : false;

  const getInsuranceBadgeStyle = () => {
    if (!hasInsurance) return 'bg-red-100 text-red-800';
    return isInsuranceValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getInsuranceStatusText = () => {
    if (!hasInsurance) return 'No Insurance';
    return isInsuranceValid ? 'Valid' : 'Expired';
  };

  const handleViewMaintenance = (id: string) => {
    navigate(`/maintenance/${id}`);
  };

  const handleAddMaintenance = () => {
    navigate(`/maintenance/add?vehicleId=${vehicle.id}`);
  };

  const handleViewAgreement = (id: string) => {
    if (!id) {
      console.error("Attempted to navigate to agreement with no ID");
      toast.error("Unable to view agreement: Missing ID");
      return;
    }
    
    console.log(`Navigating to agreement: /agreements/${id}`);
    navigate(`/agreements/${id}`);
  };

  const handleCreateAgreement = () => {
    navigate(`/agreements/add?vehicleId=${vehicle.id}`);
  };

  useEffect(() => {
    const fetchMaintenance = async () => {
      setIsLoadingMaintenance(true);
      try {
        const records = await getByVehicleId(vehicle.id);
        setMaintenanceRecords(records);
      } catch (error) {
        console.error("Error fetching maintenance records:", error);
      } finally {
        setIsLoadingMaintenance(false);
      }
    };
    if (vehicle.id) {
      fetchMaintenance();
    }
  }, [vehicle.id, getByVehicleId]);

  const formatMaintenanceType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getMaintenanceStatusColor = (status: string) => {
    switch (status) {
      case MaintenanceStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case MaintenanceStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case MaintenanceStatus.SCHEDULED:
        return 'bg-amber-100 text-amber-800';
      case MaintenanceStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAgreementStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAgreementStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return <Card className="w-full overflow-hidden card-transition">
      <div className="relative h-56 md:h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
        <img 
          src={vehicleImageUrl || defaultCarImage} 
          alt={`${vehicle.make} ${vehicle.model}`} 
          className="w-full h-full object-cover" 
          onError={e => {
            console.log('Detail image failed to load, using fallback');
            e.currentTarget.src = defaultCarImage;
          }} 
        />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{vehicle.make} {vehicle.model}</h1>
            <Badge className={cn(statusColors[vehicle.status])}>
              {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center mt-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{vehicle.year}</span>
            <span className="mx-2">•</span>
            <span className="font-medium">{vehicle.licensePlate}</span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <CardTitle className="mb-4 text-lg">Vehicle Details</CardTitle>
            <ul className="space-y-3">
              <li className="flex items-center text-sm">
                <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">VIN:</span>
                <span>{vehicle.vin || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Location:</span>
                <span>{vehicle.location || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Fuel Level:</span>
                <span>{vehicle.fuelLevel !== undefined ? `${vehicle.fuelLevel}%` : 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Mileage:</span>
                <span>
                  {vehicle.mileage !== undefined && vehicle.mileage !== null ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}
                </span>
              </li>
              <li className="flex items-center text-sm">
                <Palette className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Color:</span>
                <span>{vehicle.color || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Category:</span>
                <span className="capitalize">{vehicle.category || 'N/A'}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <CardTitle className="mb-4 text-lg">Additional Information</CardTitle>
            <ul className="space-y-3">
              <li className="flex items-center text-sm">
                <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Insurance:</span>
                <div>
                  <Badge className={getInsuranceBadgeStyle()}>
                    {getInsuranceStatusText()}
                  </Badge>
                  {hasInsurance && <div className="mt-1">
                      <div>{vehicle.insurance_company}</div>
                      {insuranceExpiry && <div className="text-xs text-muted-foreground">
                          {isInsuranceValid ? 'Expires' : 'Expired'}: {format(insuranceExpiry, 'MMM d, yyyy')}
                        </div>}
                    </div>}
                </div>
              </li>
              <li className="flex items-center text-sm">
                <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Transmission:</span>
                <span className="capitalize">{vehicle.transmission || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Fuel Type:</span>
                <span className="capitalize">{vehicle.fuelType || 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Daily Rate:</span>
                <span>{vehicle.dailyRate ? `$${vehicle.dailyRate.toFixed(2)}` : 'N/A'}</span>
              </li>
              <li className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Last Serviced:</span>
                <span>
                  {vehicle.lastServiced ? format(new Date(vehicle.lastServiced), 'MMM d, yyyy') : 'N/A'}
                </span>
              </li>
              <li className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground w-28">Next Service:</span>
                <span>
                  {vehicle.nextServiceDue ? format(new Date(vehicle.nextServiceDue), 'MMM d, yyyy') : 'N/A'}
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        {vehicle.features && vehicle.features.length > 0 && <div className="mt-6">
            <CardTitle className="mb-4 text-lg">Features</CardTitle>
            <div className="flex flex-wrap gap-2">
              {vehicle.features.map((feature, index) => <Badge key={index} variant="secondary" className="rounded-md">
                  {feature}
                </Badge>)}
            </div>
          </div>}
        
        {vehicle.notes && <div className="mt-6">
            <CardTitle className="mb-4 text-lg">Notes</CardTitle>
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <div className="flex items-start">
                <Info className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                <p>{vehicle.notes}</p>
              </div>
            </div>
          </div>}
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg">Rental Agreements</CardTitle>
            <CustomButton size="sm" variant="outline" onClick={handleCreateAgreement}>
              <FileText className="h-4 w-4 mr-2" />
              New Agreement
            </CustomButton>
          </div>
          
          {isLoadingAgreements ? <div className="text-center py-8 text-muted-foreground">
              Loading agreements...
            </div> : agreements && agreements.length > 0 ? <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agreement #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.map((agreement: Agreement) => <TableRow key={agreement.id}>
                      <TableCell className="font-medium">
                        {agreement.agreement_number}
                      </TableCell>
                      <TableCell>
                        {agreement.customers?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {agreement.start_date ? format(new Date(agreement.start_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {agreement.end_date ? format(new Date(agreement.end_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getAgreementStatusColor(agreement.status)}>
                          {formatAgreementStatus(agreement.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>${agreement.total_amount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right">
                        <CustomButton size="sm" variant="ghost" onClick={() => handleViewAgreement(agreement.id)}>
                          View
                        </CustomButton>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div> : <div className="text-center py-8 border rounded-md text-muted-foreground">
              No rental agreements found for this vehicle.
            </div>}
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg">Maintenance History</CardTitle>
            <CustomButton size="sm" variant="outline" onClick={handleAddMaintenance}>
              <Wrench className="h-4 w-4 mr-2" />
              Add Maintenance
            </CustomButton>
          </div>
          
          {isLoadingMaintenance ? <div className="text-center py-8 text-muted-foreground">
              Loading maintenance records...
            </div> : maintenanceRecords && maintenanceRecords.length > 0 ? <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords.map(record => <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {formatMaintenanceType(record.maintenance_type)}
                      </TableCell>
                      <TableCell>
                        {record.scheduled_date ? format(new Date(record.scheduled_date), 'MMM d, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getMaintenanceStatusColor(record.status)}>
                          {record.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>${record.cost?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{record.service_provider || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <CustomButton size="sm" variant="ghost" onClick={() => handleViewMaintenance(record.id)}>
                          View
                        </CustomButton>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div> : <div className="text-center py-8 border rounded-md text-muted-foreground">
              No maintenance records found for this vehicle.
            </div>}
        </div>
      </CardContent>
    </Card>;
};
