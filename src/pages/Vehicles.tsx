
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { useTranslation } from "react-i18next";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";

const VehiclesPage = () => {
  const { t } = useTranslation();
  
  return (
    <PageContainer
      title={t('vehicles.title', 'Vehicles')}
      description={t('vehicles.description', 'Manage your vehicle fleet')}
    >
      <VehicleGrid />
    </PageContainer>
  );
};

export default VehiclesPage;
