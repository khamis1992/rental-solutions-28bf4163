import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, MapPinIcon, PhoneIcon, MailIcon, FileTextIcon, CarIcon, CreditCardIcon } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  // ... other properties
}

export function CustomerDetailsSidebar() {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    // Fetch customer details
    const fetchCustomerDetails = async () => {
      try {
        // Mock data for demonstration
        setCustomer({
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          address: '123 Main St, Anytown, USA',
          status: 'active',
          joinDate: '2023-01-15',
          licenseNumber: 'DL12345678',
          nationality: 'United States',
          passportNumber: 'P12345678',
        });

        setAgreements([
          {
            id: '1',
            number: 'AGR-2023-001',
            startDate: '2023-02-01',
            endDate: '2023-08-01',
            status: 'active',
            vehicle: 'Toyota Camry (2022)',
          },
          {
            id: '2',
            number: 'AGR-2022-045',
            startDate: '2022-05-15',
            endDate: '2022-11-15',
            status: 'completed',
            vehicle: 'Honda Civic (2021)',
          },
        ]);

        setPayments([
          {
            id: '1',
            date: '2023-02-01',
            amount: 1200,
            status: 'paid',
            method: 'Credit Card',
          },
          {
            id: '2',
            date: '2023-03-01',
            amount: 1200,
            status: 'paid',
            method: 'Bank Transfer',
          },
          {
            id: '3',
            date: '2023-04-01',
            amount: 1200,
            status: 'pending',
            method: 'Credit Card',
          },
        ]);
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
    };

    fetchCustomerDetails();
  }, []);

  if (!customer) {
    return (
      <div className="p-4">
        <p>Loading customer details...</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${customer.name}`} />
            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={customer.status === 'active' ? 'success' : 'secondary'}>
                {customer.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Customer since {formatDate(customer.joinDate)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MailIcon className="h-4 w-4 text-muted-foreground" />
            <span>{customer.email}</span>
          </div>
          <div className="flex items-center space-x-2">
            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-4 w-4 text-muted-foreground" />
            <span>{customer.address}</span>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">License Number</p>
              <p className="font-medium">{customer.licenseNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nationality</p>
              <p className="font-medium">{customer.nationality}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Passport Number</p>
              <p className="font-medium">{customer.passportNumber}</p>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <Tabs defaultValue="agreements">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="agreements" className="space-y-4 mt-4">
            {agreements.map((agreement) => (
              <Card key={agreement.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{agreement.number}</div>
                    <Badge variant={agreement.status === 'active' ? 'success' : 'secondary'}>
                      {agreement.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {formatDate(agreement.startDate)} - {formatDate(agreement.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <CarIcon className="h-4 w-4" />
                      <span>{agreement.vehicle}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="payments" className="space-y-4 mt-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{formatDate(payment.date)}</div>
                    <Badge variant={payment.status === 'paid' ? 'success' : 'warning'}>
                      {payment.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <div className="flex items-center space-x-2">
                      <CreditCardIcon className="h-4 w-4" />
                      <span>{payment.method}</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold">{formatCurrency(payment.amount)}</div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Button variant="outline" className="w-full">
            View Full Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
