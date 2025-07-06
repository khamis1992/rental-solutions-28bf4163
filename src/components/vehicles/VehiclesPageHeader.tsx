import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '@/components/ui/section-header';
import { CustomButton } from '@/components/ui/custom-button';
import { Car, Plus, RefreshCw } from 'lucide-react';

interface VehiclesPageHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export const VehiclesPageHeader = ({ isLoading, onRefresh }: VehiclesPageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <SectionHeader
        title="Vehicle Management"
        description="Manage your fleet inventory"
        icon={Car}
        className="md:mb-0"
      />
      <div className="flex flex-wrap gap-2">
        <CustomButton 
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </CustomButton>
        <CustomButton 
          size="sm"
          variant="outline"
          onClick={() => navigate('/vehicles/status-update')}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Status Update
        </CustomButton>
        <CustomButton size="sm" glossy onClick={() => navigate('/vehicles/add')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vehicle
        </CustomButton>
      </div>
    </div>
  );
};