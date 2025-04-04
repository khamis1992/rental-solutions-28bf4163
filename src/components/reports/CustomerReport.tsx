
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CustomerReport = () => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Customer Report</CardTitle>
        <CardDescription>View statistical data about your customers</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Customer report content will be implemented here.</p>
      </CardContent>
    </Card>
  );
};

export default CustomerReport;
