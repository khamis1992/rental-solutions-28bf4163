import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SelectFilter } from '@/components/ui/select-filter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Filter, Car, Loader2 } from 'lucide-react';
import { useVehicles } from '@/hooks/use-vehicles';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import { VehicleTable } from '@/components/vehicles/VehicleTable';
import { VehicleFilters } from '@/components/vehicles/VehicleFilters';

// Update the VehicleFilterParams interface to include minYear and maxYear
interface VehicleFilterParams {
  status?: string;
  make?: string;
  model?: string;
  color?: string;
  minYear?: number;
  maxYear?: number;
  // other properties as needed
}

const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Ensure the filter values are stored as numbers when they should be
  const [filters, setFilters] = useState<VehicleFilterParams>({
    status: 'all',
    make: 'all',
    model: 'all',
    color: 'all',
    minYear: undefined,
    maxYear: undefined
  });

  const { vehicles, isLoading, error } = useVehicles();

  // When setting the year, parse string inputs into numbers
  const handleFilterChange = (key: keyof VehicleFilterParams, value: string) => {
    if (key === 'minYear' || key === 'maxYear') {
      setFilters(prev => ({
        ...prev,
        [key]: value ? parseInt(value, 10) : undefined
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const filteredVehicles = vehicles
    ? vehicles.filter(vehicle => {
        // Search query filter
        const matchesSearch = 
          vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vehicle.vin?.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Status filter
        const matchesStatus = 
          filters.status === 'all' || 
          vehicle.status === filters.status;
        
        // Make filter
        const matchesMake = 
          filters.make === 'all' || 
          vehicle.make === filters.make;
        
        // Model filter
        const matchesModel = 
          filters.model === 'all' || 
          vehicle.model === filters.model;
        
        // Color filter
        const matchesColor = 
          filters.color === 'all' || 
          vehicle.color === filters.color;
        
        // Year filter
        const matchesMinYear = 
          !filters.minYear || 
          (vehicle.year && vehicle.year >= filters.minYear);
        
        const matchesMaxYear = 
          !filters.maxYear || 
          (vehicle.year && vehicle.year <= filters.maxYear);
        
        return matchesSearch && matchesStatus && matchesMake && 
               matchesModel && matchesColor && matchesMinYear && matchesMaxYear;
      })
    : [];

  const availableVehicles = filteredVehicles.filter(v => v.status === 'available');
  const rentedVehicles = filteredVehicles.filter(v => v.status === 'rented');
  const maintenanceVehicles = filteredVehicles.filter(v => v.status === 'maintenance');

  const handleAddVehicle = () => {
    navigate('/vehicles/add');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      make: 'all',
      model: 'all',
      color: 'all',
      minYear: undefined,
      maxYear: undefined
    });
    setSearchQuery('');
  };

  return (
    <PageContainer title="Vehicle Management">
      <SectionHeader
        title="Vehicles"
        description="Manage your fleet of vehicles"
        icon={Car}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              className="pl-8 w-full sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={toggleFilters}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {showFilters && (
            <Button variant="ghost" onClick={resetFilters}>
              Reset Filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleAddVehicle}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter vehicles by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleFilters filters={filters} onFilterChange={handleFilterChange} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Available Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Badge className="bg-green-500 text-white mr-2">{availableVehicles.length}</Badge>
              <span className="text-sm text-muted-foreground">Ready for rental</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Rented Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Badge className="bg-blue-500 text-white mr-2">{rentedVehicles.length}</Badge>
              <span className="text-sm text-muted-foreground">Currently with customers</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">In Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Badge className="bg-amber-500 text-white mr-2">{maintenanceVehicles.length}</Badge>
              <span className="text-sm text-muted-foreground">Under repair or service</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading vehicles...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              Error loading vehicles: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </CardContent>
        </Card>
      ) : filteredVehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              No vehicles found matching your criteria.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <VehicleTable vehicles={filteredVehicles} />
          )}
        </div>
      )}
    </PageContainer>
  );
};

export default Vehicles;
