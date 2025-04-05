
import React from 'react';
import { Customer } from '@/lib/validation-schemas/customer';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CustomerProfileProps {
  customer: Customer;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customer }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Customer profile information will be displayed here</p>
      </CardContent>
    </Card>
  );
};

export default CustomerProfile;
