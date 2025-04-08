
import React from 'react';
import { Vehicle } from '@/types/vehicle';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Grid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';

interface VehiclesListProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: Error | null;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  currentPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

const VehiclesList: React.FC<VehiclesListProps> = ({
  vehicles = [],
  isLoading = false,
  error = null,
  viewMode = 'grid',
  onViewModeChange,
  currentPage,
  totalCount,
  onPageChange,
  itemsPerPage
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
        <p>Error loading vehicles: {error.message}</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No vehicles found. Try changing your filters or add a new vehicle.</p>
      </div>
    );
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { color: string; label: string }> = {
      available: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Available' },
      rented: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Rented' },
      reserved: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Reserved' },
      maintenance: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Maintenance' },
      police_station: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Police Station' },
      accident: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Accident' },
      stolen: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Stolen' },
      retired: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Retired' }
    };

    const statusInfo = statusMap[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', label: status };
    
    return (
      <Badge variant="outline" className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div>
      <div className="flex justify-end mb-4 space-x-2">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('list')}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {vehicle.imageUrl ? (
                  <img 
                    src={vehicle.imageUrl} 
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400">No image</div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{vehicle.make} {vehicle.model}</h3>
                  {getStatusBadge(vehicle.status)}
                </div>
                <div className="text-sm text-muted-foreground mb-4">
                  <div>{vehicle.year} • {vehicle.license_plate}</div>
                  <div>{vehicle.mileage?.toLocaleString() || 0} km</div>
                </div>
                <div className="flex space-x-2">
                  <Button asChild variant="outline" size="sm" className="w-1/2">
                    <Link to={`/vehicles/${vehicle.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-1/2">
                    <Link to={`/vehicles/${vehicle.id}/edit`}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Vehicle</th>
                <th className="text-left p-2">License</th>
                <th className="text-left p-2">Year</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Mileage</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.color}</div>
                  </td>
                  <td className="p-2">{vehicle.license_plate}</td>
                  <td className="p-2">{vehicle.year}</td>
                  <td className="p-2">{getStatusBadge(vehicle.status)}</td>
                  <td className="p-2">{vehicle.mileage?.toLocaleString() || 0} km</td>
                  <td className="p-2">
                    <div className="flex space-x-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/vehicles/${vehicle.id}`}>
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/vehicles/${vehicle.id}/edit`}>
                          <Edit className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalCount > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default VehiclesList;
