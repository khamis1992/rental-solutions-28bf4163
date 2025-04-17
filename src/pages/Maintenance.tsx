import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Calendar, AlertTriangle, CheckCircle, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { fetchVehicles } from '@/lib/vehicles/vehicle-api';
import { Vehicle } from '@/types/vehicle';
import { useVehicles } from '@/hooks/use-vehicles';

export default function Maintenance() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('current');
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<any[]>([]);
  const [filterMake, setFilterMake] = useState('all');
  const { useRealtimeUpdates } = useVehicles();

  // Enable realtime updates for vehicles
  useRealtimeUpdates();

  // Fetch vehicles in maintenance status
  const fetchVehiclesForMaintenance = async () => {
    try {
      setLoading(true);
      const vehicleData = await fetchVehicles({ 
        status: 'maintenance' // Use 'status' instead of 'statuses'
      });
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error fetching vehicles for maintenance:', error);
      toast.error('Failed to load vehicles in maintenance');
    } finally {
      setLoading(false);
    }
  };

  // Fetch maintenance records
  const fetchMaintenanceRecords = async () => {
    try {
      // This would be replaced with an actual API call in a real application
      // Simulating maintenance records for now
      const mockRecords = [
        {
          id: '1',
          vehicle_id: '1',
          vehicle: { make: 'Toyota', model: 'Camry', license_plate: 'ABC123' },
          description: 'Regular oil change and filter replacement',
          status: 'completed',
          start_date: '2023-05-15',
          end_date: '2023-05-15',
          cost: 150,
          technician: 'John Smith'
        },
        {
          id: '2',
          vehicle_id: '2',
          vehicle: { make: 'Honda', model: 'Accord', license_plate: 'XYZ789' },
          description: 'Brake pad replacement',
          status: 'in_progress',
          start_date: '2023-05-20',
          end_date: null,
          cost: 300,
          technician: 'Mike Johnson'
        }
      ];
      
      setMaintenanceRecords(mockRecords);
      
      // Generate upcoming maintenance based on vehicle service schedules
      const upcoming = vehicles.map(vehicle => ({
        id: `upcoming-${vehicle.id}`,
        vehicle_id: vehicle.id,
        vehicle: {
          make: vehicle.make,
          model: vehicle.model,
          license_plate: vehicle.license_plate
        },
        description: 'Scheduled maintenance check',
        status: 'scheduled',
        start_date: format(addDays(new Date(), Math.floor(Math.random() * 30)), 'yyyy-MM-dd'),
        end_date: null,
        estimated_cost: 100 + Math.floor(Math.random() * 200)
      }));
      
      setUpcomingMaintenance(upcoming);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      toast.error('Failed to load maintenance records');
    }
  };

  useEffect(() => {
    fetchVehiclesForMaintenance();
  }, []);

  useEffect(() => {
    if (vehicles.length > 0) {
      fetchMaintenanceRecords();
    }
  }, [vehicles]);

  // Filter vehicles based on search query and make filter
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMake = filterMake === 'all' || vehicle.make === filterMake;
    
    return matchesSearch && matchesMake;
  });

  // Get unique makes for filter dropdown
  const uniqueMakes = Array.from(new Set(vehicles.map(v => v.make))).filter(Boolean);

  // Filter maintenance records based on selected tab and search query
  const filteredRecords = selectedTab === 'current' 
    ? maintenanceRecords.filter(record => 
        record.vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : upcomingMaintenance.filter(record => 
        record.vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.vehicle.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Maintenance</h1>
          <p className="text-muted-foreground">
            Manage and track maintenance for your fleet
          </p>
        </div>
        <Button onClick={() => navigate('/maintenance/schedule')}>
          <Plus className="mr-2 h-4 w-4" /> Schedule Maintenance
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles or maintenance records..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterMake} onValueChange={setFilterMake}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by make" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Makes</SelectItem>
            {uniqueMakes.map((make) => (
              <SelectItem key={make} value={make}>
                {make}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{vehicles.length}</CardTitle>
            <CardDescription>Vehicles in Maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Currently undergoing repairs or service
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{maintenanceRecords.filter(r => r.status === 'completed').length}</CardTitle>
            <CardDescription>Completed This Month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Maintenance tasks completed in the last 30 days
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{upcomingMaintenance.length}</CardTitle>
            <CardDescription>Upcoming Maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Scheduled maintenance in the next 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="current">
            <Car className="mr-2 h-4 w-4" />
            Current Maintenance
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <Calendar className="mr-2 h-4 w-4" />
            Upcoming Maintenance
          </TabsTrigger>
          <TabsTrigger value="vehicles">
            <Car className="mr-2 h-4 w-4" />
            Vehicles in Maintenance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="current">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading maintenance records...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{record.vehicle.make} {record.vehicle.model}</CardTitle>
                        <CardDescription>{record.vehicle.license_plate}</CardDescription>
                      </div>
                      <Badge 
                        variant={record.status === 'completed' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {record.status === 'completed' ? (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        ) : (
                          <AlertTriangle className="mr-1 h-3 w-3" />
                        )}
                        {record.status === 'completed' ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{record.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Start Date:</div>
                      <div>{format(new Date(record.start_date), 'MMM d, yyyy')}</div>
                      {record.end_date && (
                        <>
                          <div className="text-muted-foreground">End Date:</div>
                          <div>{format(new Date(record.end_date), 'MMM d, yyyy')}</div>
                        </>
                      )}
                      <div className="text-muted-foreground">Cost:</div>
                      <div>${record.cost}</div>
                      <div className="text-muted-foreground">Technician:</div>
                      <div>{record.technician}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/maintenance/${record.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No maintenance records found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query' : 'No vehicles are currently in maintenance'}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="upcoming">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading upcoming maintenance...</p>
            </div>
          ) : upcomingMaintenance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecords.map((record) => (
                <Card key={record.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{record.vehicle.make} {record.vehicle.model}</CardTitle>
                        <CardDescription>{record.vehicle.license_plate}</CardDescription>
                      </div>
                      <Badge 
                        variant={
                          isBefore(new Date(record.start_date), addDays(new Date(), 7)) 
                            ? 'destructive' 
                            : 'outline'
                        }
                        className="ml-2"
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        {isBefore(new Date(record.start_date), addDays(new Date(), 7)) 
                          ? 'Due Soon' 
                          : 'Scheduled'
                        }
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{record.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Scheduled Date:</div>
                      <div>{format(new Date(record.start_date), 'MMM d, yyyy')}</div>
                      <div className="text-muted-foreground">Estimated Cost:</div>
                      <div>${record.estimated_cost}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/maintenance/schedule/${record.id}`)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No upcoming maintenance</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query' : 'No maintenance is currently scheduled'}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="vehicles">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>Loading vehicles in maintenance...</p>
            </div>
          ) : filteredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
                        <CardDescription>{vehicle.license_plate}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        <Car className="mr-1 h-3 w-3" />
                        Maintenance
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Year:</div>
                      <div>{vehicle.year}</div>
                      <div className="text-muted-foreground">Color:</div>
                      <div>{vehicle.color || 'N/A'}</div>
                      <div className="text-muted-foreground">Mileage:</div>
                      <div>{vehicle.mileage ? `${vehicle.mileage} miles` : 'N/A'}</div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      View Vehicle
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Car className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No vehicles in maintenance</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search query' : 'All vehicles are currently operational'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
