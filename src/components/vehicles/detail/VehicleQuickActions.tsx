
import React from 'react';
import { Wrench, FileText, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Vehicle } from '@/types/vehicle';

interface VehicleQuickActionsProps {
  vehicle: Vehicle;
}

export const VehicleQuickActions: React.FC<VehicleQuickActionsProps> = ({ vehicle }) => {
  const navigate = useNavigate();
  const isAvailable = vehicle.status === 'available';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => navigate(`/maintenance/add?vehicle_id=${vehicle.id}`)}
        >
          <Wrench className="mr-2 h-4 w-4" />
          Add Maintenance Record
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => navigate(`/agreements/add?vehicle_id=${vehicle.id}`)}
          disabled={!isAvailable}
        >
          <FileText className="mr-2 h-4 w-4" />
          Create New Agreement
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Vehicle Details
        </Button>
      </CardContent>
    </Card>
  );
};
