import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils";
import { Spinner } from '@/components/ui/spinner';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface CustomerSectionProps {
  selectedCustomer: string | null;
  onCustomerSelect: (customerId: string) => void;
  isLoading?: boolean;
  error?: string | null;
  searchTerm?: string;
  onSearchChange: (term: string) => void;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({
  selectedCustomer,
  onCustomerSelect,
  isLoading = false,
  error = null,
  searchTerm = '',
  onSearchChange
}) => {
  const mockCustomers: Customer[] = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone_number: '123-456-7890',
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone_number: '987-654-3210',
    },
    {
      id: '3',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@example.com',
      phone_number: '555-123-4567',
    },
  ];

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.first_name.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
    customer.last_name.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
    customer.email.toLowerCase().includes(searchTerm?.toLowerCase() || '')
  );

  const handleSelectCustomer = (customer: any) => {
    onCustomerSelect(customer.id || '');
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Customer</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="search">Search Customer</Label>
          <Input
            id="search"
            placeholder="Enter customer name or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Select Customer</Label>
          {isLoading ? (
            <div className="flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <ScrollArea className="h-[200px] rounded-md border">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className={cn(
                    "flex items-center space-x-4 p-4 hover:bg-secondary rounded-md cursor-pointer",
                    selectedCustomer === customer.id && "bg-accent",
                  )}
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${customer.email}.png`} />
                    <AvatarFallback>{customer.first_name[0]}{customer.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.email}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSection;
