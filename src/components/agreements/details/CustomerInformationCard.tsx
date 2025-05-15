
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mail, Phone, User } from 'lucide-react';

interface CustomerType {
  id?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  driver_license?: string;
  nationality?: string;
  address?: string;
}

export interface CustomerInformationCardProps {
  customer: CustomerType;
}

export function CustomerInformationCard({ customer }: CustomerInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Information</CardTitle>
        <CardDescription>Details about the renter</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 rounded-full p-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{customer?.full_name || 'Unknown Customer'}</p>
              <p className="text-sm text-muted-foreground">{customer?.nationality || 'No nationality'}</p>
            </div>
          </div>
          
          {customer?.email && (
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
          )}
          
          {customer?.phone_number && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.phone_number}</span>
            </div>
          )}
          
          <div>
            <p className="font-medium">Driver License</p>
            <p>{customer?.driver_license || 'Not provided'}</p>
          </div>
          
          <div>
            <p className="font-medium">Address</p>
            <p>{customer?.address || 'Not provided'}</p>
          </div>
          
          {customer?.id && (
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link to={`/customers/${customer.id}`}>View Full Profile</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
