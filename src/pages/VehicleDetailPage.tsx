
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicles } from '@/hooks/use-vehicles';
import { VehicleDetail } from '@/components/vehicles/VehicleDetail';
import PageContainer from '@/components/layout/PageContainer';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';

const VehicleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useVehicle } = useVehicles();
  const { data: vehicle, isLoading, error } = useVehicle(id || '');
  const [isRTL, setIsRTL] = useState(false);
  const { t } = useTranslation();
  const { isRTL: contextIsRTL } = useContextTranslation();

  useEffect(() => {
    setIsRTL(contextIsRTL);
  }, [contextIsRTL]);

  useEffect(() => {
    if (error) {
      console.error('Error fetching vehicle:', error);
      toast.error(t('vehicles.loadError'));
    }
  }, [error, t]);

  return (
    <PageContainer
      title={t('vehicles.details')}
      description={t('vehicles.viewDetails')}
      backLink="/vehicles"
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      ) : vehicle ? (
        <VehicleDetail vehicle={vehicle} />
      ) : (
        <div className="text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('vehicles.notFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('vehicles.notFoundDesc')}
          </p>
          <Button variant="outline" onClick={() => navigate("/vehicles")}>
            {t('vehicles.returnToVehicles')}
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default VehicleDetailPage;
