import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/types/vehicle';
import { Calendar, MapPin, Fuel, Activity, Key, CreditCard, Car, Palette, Settings, Info, Shield, Wrench, FileText, AlertCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { useTranslation } from '@/contexts/TranslationContext';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useDateFormatter } from '@/lib/date-utils';

interface VehicleDetailProps {
  vehicle: Vehicle;
}

export const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicle
}) => {
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  const { isRTL, language } = useTranslation();
  const { formatDate: formatDateWithLocale } = useDateFormatter();
  
  const {
    useList: useMaintenanceList
  } = useMaintenance();
  const {
    agreements,
    isLoading: isLoadingAgreements,
    setSearchParams
  } = useAgreements({
    vehicleId: vehicle.id
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

  const [multipleActiveAgreements, setMultipleActiveAgreements] = useState(false);

  useEffect(() => {
    async function fetchVehicleImage() {
      setImageLoading(true);
      try {
        const modelTypes = ['B70', 'T33', 'T99', 'A30', 'TERRITORY', 'GS3', 'MG5', 'Alsvin'];
        const modelToCheck = vehicle.model || '';
        const matchedModelType = modelTypes.find(type => modelToCheck.toUpperCase().includes(type) || modelToCheck.toLowerCase().includes(type.toLowerCase()));
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
      } else if (modelLower.includes('t33') || modelLower === 't33') {
        setVehicleImageUrl(t33Image);
        console.log('Using T33 fallback image in detail');
      } else if (modelLower.includes('t77') || modelLower === 't77') {
        setVehicleImageUrl(t77Image);
        console.log('Using T77 fallback image in detail');
      } else if (makeLower.includes('gac') && modelLower.includes('gs3')) {
        setVehicleImageUrl(gs3Image);
        console.log('Using GAC GS3 fallback image in detail');
      } else if (modelLower.includes('gs3') || modelLower === 'gs3') {
        setVehicleImageUrl(gs3Image);
        console.log('Using GS3 fallback image in detail');
      } else if (makeLower.includes('gac')) {
        setVehicleImageUrl(gacImage);
        console.log('Using generic GAC fallback image in detail');
      } else if (makeLower === 'mg' || makeLower.startsWith('mg ') || modelLower.startsWith('mg')) {
        if (modelLower.includes('5') || modelLower.includes('mg5') || makeLower.includes('mg5') || makeLower === 'mg' && modelLower === '5') {
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
    if (!hasInsurance) return t('vehicles.noInsurance');
    return isInsuranceValid ? t('vehicles.valid') : t('vehicles.expired');
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

  useEffect(() => {
    if (agreements && agreements.length > 0) {
      const activeCount = agreements.filter(a => a.status === 'active').length;
      setMultipleActiveAgreements(activeCount > 1);
    }
  }, [agreements]);

  const formatDateDisplay = (dateString: string | undefined) => {
    if (!dateString) return t('common.notProvided');
    try {
      return formatDateWithLocale(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return t('common.notProvided');
    }
  };

  return <Card className="w-full overflow-hidden card-transition">
      <div className="relative h-56 md:h-72 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
        <img src={vehicleImageUrl || defaultCarImage} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" onError={e => {
        console.log('Detail image failed to load, using fallback');
        e.currentTarget.src = defaultCarImage;
      }} />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-20">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{vehicle.make} {vehicle.model}</h1>
            <Badge className={cn(statusColors[vehicle.status])}>
              {t(`vehicles.status.${vehicle.status}`) || vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
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
        {multipleActiveAgreements && (
          <Alert variant="warning" className="mb-6 border-amber-500 bg-amber-50">
            <AlertCircle className={`h-4 w-4 text-amber-500 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <AlertTitle className="text-amber-700">{t('vehicles.multipleActiveAgreements')}</AlertTitle>
            <AlertDescription className={`text-amber-700 ${isRTL ? 'text-right' : ''}`}>
              {t('vehicles.multipleActiveAgreementsDesc')}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={isRTL ? 'text-right' : ''}>
            <CardTitle className="mb-4 text-lg">{t('vehicles.vehicleDetails')}</CardTitle>
            <ul className="space-y-3">
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Key className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('common.vin')}:</span>
                <span>{vehicle.vin || t('common.notProvided')}</span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <MapPin className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('common.location')}:</span>
                <span>{vehicle.location || t('common.notProvided')}</span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Fuel className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.fuelLevel')}:</span>
                <span>{vehicle.fuelLevel !== undefined ? `${vehicle.fuelLevel}%` : t('common.notProvided')}</span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Activity className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.mileage')}:</span>
                <span>
                  {vehicle.mileage !== undefined && vehicle.mileage !== null ? `${vehicle.mileage.toLocaleString()} km` : t('common.notProvided')}
                </span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Palette className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('common.color')}:</span>
                <span>{vehicle.color || t('common.notProvided')}</span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Car className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.category')}:</span>
                <span className="capitalize">{vehicle.category || t('common.notProvided')}</span>
              </li>
            </ul>
          </div>
          
          <div className={isRTL ? 'text-right' : ''}>
            <CardTitle className="mb-4 text-lg">{t('vehicles.additionalInformation')}</CardTitle>
            <ul className="space-y-3">
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Shield className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.insurance')}:</span>
                <div>
                  <Badge className={getInsuranceBadgeStyle()}>
                    {getInsuranceStatusText()}
                  </Badge>
                  {hasInsurance && <div className="mt-1">
                      <div>{vehicle.insurance_company}</div>
                      {insuranceExpiry && <div className="text-xs text-muted-foreground">
                          {isInsuranceValid ? t('vehicles.expires') : t('vehicles.expired')}: {formatDateWithLocale(insuranceExpiry, 'MMM d, yyyy')}
                        </div>}
                    </div>}
                </div>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Settings className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.transmission')}:</span>
                <span className="capitalize">{vehicle.transmission || t('common.notProvided')}</span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Fuel className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.fuelType')}:</span>
                <span className="capitalize">{vehicle.fuelType || t('common.notProvided')}</span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CreditCard className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.dailyRate')}:</span>
                <span>{vehicle.dailyRate ? formatCurrency(vehicle.dailyRate) : t('common.notProvided')}</span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.lastServiced')}:</span>
                <span>
                  {vehicle.lastServiced ? formatDateDisplay(vehicle.lastServiced) : t('common.notProvided')}
                </span>
              </li>
              <li className={`flex items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Calendar className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className={`text-muted-foreground w-28 ${isRTL ? 'text-right' : ''}`}>{t('vehicles.nextServiceDue')}:</span>
                <span>
                  {vehicle.nextServiceDue ? formatDateDisplay(vehicle.nextServiceDue) : t('common.notProvided')}
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        {vehicle.features && vehicle.features.length > 0 && <div className="mt-6">
            <CardTitle className="mb-4 text-lg">{t('vehicles.features')}</CardTitle>
            <div className="flex flex-wrap gap-2">
              {vehicle.features.map((feature, index) => <Badge key={index} variant="secondary" className="rounded-md">
                  {feature}
                </Badge>)}
            </div>
          </div>}
        
        {vehicle.notes && <div className="mt-6">
            <CardTitle className="mb-4 text-lg">{t('common.notes')}</CardTitle>
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <div className="flex items-start">
                <Info className={`h-4 w-4 mt-0.5 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <p className={isRTL ? 'text-right w-full' : ''}>{vehicle.notes}</p>
              </div>
            </div>
          </div>}
        
        <div className="mt-6">
          <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-lg">{t('agreements.rentalAgreements')}</CardTitle>
            <CustomButton
              size="sm"
              onClick={() => handleCreateAgreement()}>
              {t('agreements.addAgreement')}
            </CustomButton>
          </div>
          
          {isLoadingAgreements ? <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div> : agreements && agreements.length > 0 ? <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('agreements.agreementNumber')}</TableHead>
                    <TableHead>{t('agreements.customer')}</TableHead>
                    <TableHead>{t('agreements.startDate')}</TableHead>
                    <TableHead>{t('agreements.endDate')}</TableHead>
                    <TableHead>{t('agreements.status')}</TableHead>
                    <TableHead>{t('agreements.amount')}</TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('agreements.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.map((agreement) => {
                    const adaptedAgreement = adaptSimpleToFullAgreement(agreement);
                    return (
                      <TableRow key={adaptedAgreement.id}>
                        <TableCell className="font-medium">
                          {adaptedAgreement.agreement_number}
                        </TableCell>
                        <TableCell>
                          {adaptedAgreement.customers?.full_name || t('common.notProvided')}
                        </TableCell>
                        <TableCell>
                          {adaptedAgreement.start_date ? formatDateWithLocale(new Date(adaptedAgreement.start_date), 'MMM d, yyyy') : t('common.notProvided')}
                        </TableCell>
                        <TableCell>
                          {adaptedAgreement.end_date ? formatDateWithLocale(new Date(adaptedAgreement.end_date), 'MMM d, yyyy') : t('common.notProvided')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getAgreementStatusColor(adaptedAgreement.status)}>
                            {t(`agreements.status.${adaptedAgreement.status}`) || formatAgreementStatus(adaptedAgreement.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(adaptedAgreement.total_amount)}</TableCell>
                        <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                          <CustomButton size="sm" variant="ghost" onClick={() => handleViewAgreement(adaptedAgreement.id)}>
                            {t('common.view')}
                          </CustomButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div> : <div className="text-center py-8 border rounded-md text-muted-foreground">
              {t('agreements.noAgreements')}
            </div>}
        </div>
        
        <div className="mt-6">
          <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CardTitle className="text-lg">{t('maintenance.history')}</CardTitle>
            <CustomButton
              size="sm"
              onClick={handleAddMaintenance}>
              {t('maintenance.add')}
            </CustomButton>
          </div>
          
          {isLoadingMaintenance ? <div className="text-center py-8 text-muted-foreground">
              {t('common.loading')}
            </div> : maintenanceRecords && maintenanceRecords.length > 0 ? <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('maintenance.type')}</TableHead>
                    <TableHead>{t('maintenance.date')}</TableHead>
                    <TableHead>{t('maintenance.status')}</TableHead>
                    <TableHead>{t('maintenance.cost')}</TableHead>
                    <TableHead>{t('maintenance.provider')}</TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('maintenance.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords.map(record => <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {t(`maintenance.types.${record.maintenance_type.toLowerCase()}`) || formatMaintenanceType(record.maintenance_type)}
                      </TableCell>
                      <TableCell>
                        {record.scheduled_date ? formatDateWithLocale(new Date(record.scheduled_date), 'MMM d, yyyy') : t('common.notProvided')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getMaintenanceStatusColor(record.status)}>
                          {t(`maintenance.status.${record.status.toLowerCase()}`) || record.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(record.cost)}</TableCell>
                      <TableCell>{record.service_provider || t('common.notProvided')}</TableCell>
                      <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                        <CustomButton size="sm" variant="ghost" onClick={() => handleViewMaintenance(record.id)}>
                          {t('common.view')}
                        </CustomButton>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div> : <div className="text-center py-8 border rounded-md text-muted-foreground">
              {t('maintenance.noRecords')}
            </div>}
        </div>
      </CardContent>
    </Card>;
};
