
import React from 'react';
import { Card } from "@/components/ui/card";
import { CustomButton } from "@/components/ui/custom-button";
import { AlertTriangle, Battery, Gauge, ThermometerSun } from 'lucide-react';

interface VehicleMetrics {
  fuelLevel: number;
  batteryHealth: number;
  engineTemp: number;
  mileage: number;
}

export const VehicleMonitoring = ({ vehicleId }: { vehicleId: string }) => {
  const [metrics, setMetrics] = React.useState<VehicleMetrics>({
    fuelLevel: 75,
    batteryHealth: 90,
    engineTemp: 82,
    mileage: 45000
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          <span>Fuel Level</span>
        </div>
        <p className="text-2xl font-bold mt-2">{metrics.fuelLevel}%</p>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Battery className="h-5 w-5" />
          <span>Battery</span>
        </div>
        <p className="text-2xl font-bold mt-2">{metrics.batteryHealth}%</p>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <ThermometerSun className="h-5 w-5" />
          <span>Engine Temp</span>
        </div>
        <p className="text-2xl font-bold mt-2">{metrics.engineTemp}°C</p>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>Service Due</span>
        </div>
        <p className="text-sm mt-2">In 2,000 km</p>
      </Card>
    </div>
  );
};
