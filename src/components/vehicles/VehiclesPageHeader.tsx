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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6" dir="rtl">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المركبات</h1>
        </div>
        <p className="text-muted-foreground text-lg">إدارة أسطول المركبات والحالات</p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <CustomButton 
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-10 px-4"
        >
          <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث
        </CustomButton>
        <CustomButton 
          size="sm"
          variant="outline"
          onClick={() => navigate('/vehicles/status-update')}
          className="h-10 px-4"
        >
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث الحالة
        </CustomButton>
        <CustomButton 
          size="sm" 
          glossy 
          onClick={() => navigate('/vehicles/add')}
          className="h-10 px-6"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة مركبة
        </CustomButton>
      </div>
    </div>
  );
};