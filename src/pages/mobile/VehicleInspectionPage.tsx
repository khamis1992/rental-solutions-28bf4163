import { useParams } from 'react-router-dom';
import { useVehicleDetail } from '@/hooks/use-vehicle-detail';
import { VehicleInspection } from '@/components/mobile/VehicleInspection';

export default function VehicleInspectionPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { vehicle, isLoading } = useVehicleDetail(vehicleId);

  if (isLoading) return <p className="p-4">Loading...</p>;
  if (!vehicle) return <p className="p-4">Vehicle not found</p>;

  return <VehicleInspection vehicle={vehicle} />;
}
