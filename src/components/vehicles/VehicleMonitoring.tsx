import React, { memo, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { CustomButton } from "@/components/ui/custom-button";
import { AlertTriangle, Battery, Gauge, ThermometerSun } from 'lucide-react';

interface VehicleMetrics {
  fuelLevel: number;
  batteryHealth: number;
  engineTemp: number;
  mileage: number;
}

const MetricCard = memo(({ icon: Icon, label, value, unit }: { 
  icon: React.ElementType, 
  label: string, 
  value: number | string,
  unit?: string 
}) => (
  <Card className="p-4">
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </div>
    <p className="text-2xl font-bold mt-2">{value}{unit}</p>
  </Card>
));

export const VehicleMonitoring = memo(({ vehicleId }: { vehicleId: string }) => {
  const metrics = useMemo<VehicleMetrics>(() => ({
    fuelLevel: 75,
    batteryHealth: 90,
    engineTemp: 82,
    mileage: 45000
  }), []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard icon={Gauge} label="Fuel Level" value={metrics.fuelLevel} unit="%" />
      <MetricCard icon={Battery} label="Battery" value={metrics.batteryHealth} unit="%" />
      <MetricCard icon={ThermometerSun} label="Engine Temp" value={metrics.engineTemp} unit="°C" />
      <MetricCard icon={AlertTriangle} label="Service Due" value="In 2,000 km" />
    </div>
  );
});

VehicleMonitoring.displayName = 'VehicleMonitoring';