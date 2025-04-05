
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Vehicle } from '@/types/vehicle';

interface VehicleReportProps {
  vehicles?: Vehicle[];
}

const VehicleReport: React.FC<VehicleReportProps> = ({ vehicles = [] }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Vehicle Report</CardTitle>
        <CardDescription>View statistical data about your vehicle fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Vehicle report content will be implemented here.</p>
        <p>Total vehicles: {vehicles.length}</p>
      </CardContent>
    </Card>
  );
};

export default VehicleReport;
