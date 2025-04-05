
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerNotesProps {
  customerId: string;
}

const CustomerNotes: React.FC<CustomerNotesProps> = ({ customerId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Customer notes will be displayed here</p>
      </CardContent>
    </Card>
  );
};

export default CustomerNotes;
