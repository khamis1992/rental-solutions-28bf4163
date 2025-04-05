
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const VehicleReport = () => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Vehicle Report</CardTitle>
        <CardDescription>View statistical data about your vehicle fleet</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Vehicle report content will be implemented here.</p>
      </CardContent>
    </Card>
  );
};

export default VehicleReport;
