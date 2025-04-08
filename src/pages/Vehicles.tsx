
import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { Car, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicles } from '@/hooks/use-vehicles';
import { VehicleFilters, VehicleFilterValues } from '@/components/vehicles/VehicleFilters';
import VehiclesList from '@/components/vehicles/VehiclesList';

const Vehicles = () => {
  const {
    vehicles, 
    isLoading, 
    error, 
    filterOptions, 
    setFilterOptions,
    totalCount,
    currentPage,
    setCurrentPage
  } = useVehicles();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const handleFilterChange = (newFilters: VehicleFilterValues) => {
    setFilterOptions({
      ...filterOptions,
      status: newFilters.status !== 'all' ? newFilters.status : '',
      make: newFilters.make !== 'all' ? newFilters.make : '',
      type: newFilters.category !== 'all' ? newFilters.category : '',
      year: newFilters.year,
      location: newFilters.location,
      query: newFilters.searchTerm || '',
    });
    
    // Reset to first page when filters change
    setCurrentPage(1);
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
        currentPage={currentPage}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        itemsPerPage={filterOptions.limit || 10}
      />
    </PageContainer>
  );
};

export default Vehicles;
