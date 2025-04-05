
import React from "react";
import { Metadata } from "next";
import PageContainer from "@/components/layout/PageContainer";
import { useTranslation } from "react-i18next";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Manage your vehicle fleet",
};

export default function VehiclesPage() {
  const { t } = useTranslation();
  
  return (
    <PageContainer
      title={t('vehicles.title', 'Vehicles')}
      description={t('vehicles.description', 'Manage your vehicle fleet')}
    >
      <VehicleGrid />
    </PageContainer>
  );
}
