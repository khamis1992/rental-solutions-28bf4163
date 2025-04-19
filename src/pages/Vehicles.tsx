
import React, { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Car, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicles } from '@/hooks/use-vehicles';
import { VehicleFilters } from '@/components/vehicles/VehicleFilters';
import VehiclesList from '@/components/vehicles/VehiclesList';
import { VehicleFilterParams, VehicleStatus } from '@/types/vehicle';

// Define the VehicleFilterValues type
export interface VehicleFilterValues {
  status: string;
  make: string;
  category: string;
  year: string;
  location: string;
  searchTerm?: string;
}

const Vehicles = () => {
  const {
    useList,
    useVehicleStats
  } = useVehicles();
  
  const [searchParams, setSearchParams] = useState<VehicleFilterParams>({
    status: '',
    make: '',
    type: '',
    location: '',
    year: undefined,
    query: '',
    page: 1,
    limit: 10
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { data: vehicles = [], isLoading, error, refetch } = useList(searchParams);
  const { data: stats } = useVehicleStats ? useVehicleStats() : { data: { totalCount: 0 } };
  const totalCount = stats?.totalCount || 0;
  
  const handleFilterChange = (newFilters: VehicleFilterValues) => {
    setSearchParams({
      ...searchParams,
      status: newFilters.status !== 'all' ? newFilters.status as VehicleStatus : '',
      make: newFilters.make !== 'all' ? newFilters.make : '',
      type: newFilters.category !== 'all' ? newFilters.category : '',
      year: newFilters.year !== 'all' ? parseInt(newFilters.year) : undefined,
      location: newFilters.location,
      query: newFilters.searchTerm || '',
      page: 1, // Reset to first page when filters change
    });
  };
  
  const setCurrentPage = (page: number) => {
    setSearchParams({
      ...searchParams,
      page
    });
  };
  
  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <SectionHeader
          title="Vehicles"
          description="Manage your fleet of vehicles"
          icon={Car}
        />
        
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/vehicles/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      </div>
      
      <VehicleFilters
        onFilterChange={handleFilterChange}
        className="mb-6"
      />
      
      <VehiclesList
        vehicles={vehicles}
        isLoading={isLoading}
        error={error}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        currentPage={searchParams.page || 1}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        itemsPerPage={searchParams.limit || 10}
      />
    </PageContainer>
  );
};

export default Vehicles;
