import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SelectFilter } from '@/components/ui/select-filter';
import { Plus, Search, Car, Filter, X } from 'lucide-react';
import { useVehicles } from '@/hooks/use-vehicles';
import { formatCurrency } from '@/lib/utils';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';

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

const VehiclesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Ensure the filter values are stored as numbers when they should be
  const [filters, setFilters] = useState<VehicleFilterParams>({
    status: 'all',
    make: 'all',
    model: 'all',
    color: 'all',
    minYear: undefined,
    maxYear: undefined
  });
  
  const { vehicles, isLoading, error, makes, models, colors, years } = useVehicles();
  
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
  
  const resetFilters = () => {
    setFilters({
      status: 'all',
      make: 'all',
      model: 'all',
      color: 'all',
      minYear: undefined,
      maxYear: undefined
    });
  };
  
  const filteredVehicles = vehicles
    ? vehicles.filter(vehicle => {
        // Filter by search query
        const matchesSearch = 
          (vehicle.make?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (vehicle.model?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (vehicle.license_plate?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
          (vehicle.vin?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        
        // Filter by tab
        const matchesTab = 
          currentTab === 'all' || 
          (currentTab === 'available' && vehicle.status === 'available') ||
          (currentTab === 'rented' && vehicle.status === 'rented') ||
          (currentTab === 'maintenance' && vehicle.status === 'maintenance') ||
          (currentTab === 'inactive' && vehicle.status === 'inactive');
        
        // Filter by selected filters
        const matchesMake = filters.make === 'all' || vehicle.make === filters.make;
        const matchesModel = filters.model === 'all' || vehicle.model === filters.model;
        const matchesColor = filters.color === 'all' || vehicle.color === filters.color;
        const matchesMinYear = !filters.minYear || (vehicle.year && vehicle.year >= filters.minYear);
        const matchesMaxYear = !filters.maxYear || (vehicle.year && vehicle.year <= filters.maxYear);
        
        return matchesSearch && matchesTab && matchesMake && matchesModel && matchesColor && matchesMinYear && matchesMaxYear;
      })
    : [];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500 text-white">Available</Badge>;
      case 'rented':
        return <Badge className="bg-blue-500 text-white">Rented</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-500 text-white">Maintenance</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500 text-white">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  return (
    <PageContainer title="Vehicle Management">
      <SectionHeader
        title="Vehicles"
        description="Manage your fleet of vehicles"
        icon={Car}
        actions={
          <Button onClick={() => navigate('/vehicles/add')}>
            <Plus className="mr-2 h-4 w-4" /> Add Vehicle
          </Button>
        }
      />
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <TabsList>
            <TabsTrigger value="all">All Vehicles</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="rented">Rented</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Vehicles</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <SelectFilter
                      value={filters.make || 'all'}
                      onValueChange={(value) => handleFilterChange('make', value)}
                      options={[
                        { label: 'All Makes', value: 'all' },
                        ...makes.map(make => ({ label: make, value: make }))
                      ]}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <SelectFilter
                      value={filters.model || 'all'}
                      onValueChange={(value) => handleFilterChange('model', value)}
                      options={[
                        { label: 'All Models', value: 'all' },
                        ...models.map(model => ({ label: model, value: model }))
                      ]}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <SelectFilter
                      value={filters.color || 'all'}
                      onValueChange={(value) => handleFilterChange('color', value)}
                      options={[
                        { label: 'All Colors', value: 'all' },
                        ...colors.map(color => ({ label: color, value: color }))
                      ]}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Year</Label>
                      <SelectFilter
                        value={filters.minYear ? `${filters.minYear}` : ''}
                        onValueChange={(value) => handleFilterChange('minYear', value)}
                        options={[
                          { label: 'Any', value: '' },
                          ...years.map(year => ({ label: `${year}`, value: `${year}` }))
                        ]}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Max Year</Label>
                      <SelectFilter
                        value={filters.maxYear ? `${filters.maxYear}` : ''}
                        onValueChange={(value) => handleFilterChange('maxYear', value)}
                        options={[
                          { label: 'Any', value: '' },
                          ...years.map(year => ({ label: `${year}`, value: `${year}` }))
                        ]}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={resetFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reset Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <TabsContent value={currentTab} className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-5 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-red-500">Error loading vehicles: {error.message}</p>
              </CardContent>
            </Card>
          ) : filteredVehicles.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No vehicles found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles.map((vehicle) => (
                <Card 
                  key={vehicle.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                >
                  <div className="h-48 bg-muted relative">
                    {vehicle.image_url ? (
                      <img 
                        src={vehicle.image_url} 
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Car className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      {getStatusBadge(vehicle.status)}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {vehicle.license_plate} • <span className="text-sm text-muted-foreground">{vehicle.year ? `${vehicle.year}` : 'N/A'}</span>
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {vehicle.color || 'N/A'}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(vehicle.daily_rate || 0)}/day
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default VehiclesPage;
