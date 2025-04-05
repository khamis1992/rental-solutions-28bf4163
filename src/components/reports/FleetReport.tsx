
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Vehicle } from '@/types/vehicle';

interface FleetReportProps {
  vehicles: Vehicle[];
}

const FleetReport: React.FC<FleetReportProps> = ({ vehicles }) => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Fleet Report</CardTitle>
        <CardDescription>Analysis of your vehicle fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Fleet report content will go here</p>
      </CardContent>
    </Card>
  );
};

export default FleetReport;
