import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Vehicle } from '@/types/vehicle';
import { VehicleStats } from './VehicleStats';
import { OptimizedVehicleGrid } from './OptimizedVehicleGrid';

type ViewMode = 'grid' | 'list';

interface VehiclesPageContentProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: any;
  viewMode: ViewMode;
  onSelectVehicle: (id: string) => void;
}

export const VehiclesPageContent = ({ 
  vehicles, 
  isLoading, 
  error, 
  viewMode, 
  onSelectVehicle 
}: VehiclesPageContentProps) => {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load vehicles. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
        <span className="ml-2 text-muted-foreground">Loading vehicles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {vehicles.length > 0 && <VehicleStats vehicles={vehicles} />}
      
      {/* Vehicle Grid/List */}
      <OptimizedVehicleGrid
        vehicles={vehicles}
        onSelectVehicle={onSelectVehicle}
        viewMode={viewMode}
      />
    </div>
  );
};