import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Car, ArrowLeft, Edit, Trash2, AlertOctagon, Loader2, Calendar, AlertCircle, FileText } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import VehicleDetail from '@/components/vehicles/VehicleDetail';
import PageContainer from '@/components/layout/PageContainer';
import { useVehicleDetail } from '@/hooks/use-vehicle-detail';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import DocumentList from '@/components/documents/DocumentList';
import { DocumentEntityType } from '@/types/document.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { asVehicleId } from '@/utils/database-type-helpers';
import { useLanguage } from '@/contexts/LanguageContext';

const VehicleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const {
    vehicle,
    isLoading,
    error,
    deleteVehicle
  } = useVehicleDetail(id);

  const handleDelete = async () => {
    if (!vehicle?.id) return;
    
    try {
      await deleteVehicle.mutateAsync(asVehicleId(vehicle.id));
      toast.success(language === 'ar' ? 'تم حذف المركبة بنجاح' : 'Vehicle deleted successfully');
      navigate('/vehicles');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error(language === 'ar' ? 'فشل في حذف المركبة' : 'Failed to delete vehicle');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className={`text-center py-12 ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'خطأ في تحميل تفاصيل المركبة' : 'Error loading vehicle details'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'ar' ? 'حدث خطأ أثناء تحميل معلومات المركبة.' : 'There was an error loading the vehicle information.'}
          </p>
          <Button 
            onClick={() => navigate('/vehicles')}
            variant="outline"
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'العودة إلى المركبات' : 'Back to Vehicles'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!vehicle) {
    return (
      <PageContainer>
        <div className={`text-center py-12 ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {language === 'ar' ? 'المركبة غير موجودة' : 'Vehicle not found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {language === 'ar' ? 'المركبة المطلوبة غير موجودة أو تم حذفها.' : 'The requested vehicle could not be found or has been deleted.'}
          </p>
          <Button 
            onClick={() => navigate('/vehicles')}
            variant="outline"
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'العودة إلى المركبات' : 'Back to Vehicles'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  
  return (
    <PageContainer>
      <SectionHeader
        title={`${vehicle.make} ${vehicle.model}`}
        description={`${vehicle.year} • ${vehicle.license_plate}`}
        icon={Car}
        actions={
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => navigate('/vehicles')}
            className={language === 'ar' ? 'flex-row-reverse' : ''}
          >
            <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {language === 'ar' ? 'العودة إلى المركبات' : 'Back to Vehicles'}
          </Button>
        }
      />
      
      <div className="section-transition mt-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className={`grid grid-cols-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <TabsTrigger value="details" className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <Car className="h-4 w-4" /> 
              {language === 'ar' ? 'تفاصيل المركبة' : 'Vehicle Details'}
            </TabsTrigger>
            <TabsTrigger value="documents" className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <FileText className="h-4 w-4" /> 
              {language === 'ar' ? 'المستندات' : 'Documents'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            <VehicleDetail 
              vehicle={vehicle} 
              key={`vehicle-detail-${vehicle.id}`} 
            />
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'ar' ? 'المستندات' : 'Documents'}
                </CardTitle>
                <CardDescription className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'ar' ? 'إدارة المستندات المتعلقة بهذه المركبة' : 'Manage documents related to this vehicle'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DocumentList 
                  entityType={DocumentEntityType.VEHICLE} 
                  entityId={vehicle.id} 
                  showUploadButton={true}
                  showSearch={true}
                  showFilters={false}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default VehicleDetailPage;
