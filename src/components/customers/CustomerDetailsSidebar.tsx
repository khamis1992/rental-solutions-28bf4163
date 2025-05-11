
import React from 'react';
import { CustomerInfo } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Sheet, 
  SheetClose, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  User,
  Calendar,
  CreditCard,
  Car,
  AlertTriangle,
  Pencil,
  ArrowUpRight
} from 'lucide-react';

interface CustomerDetailsSidebarProps {
  customer: CustomerInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerDetailsSidebar: React.FC<CustomerDetailsSidebarProps> = ({
  customer,
  open,
  onOpenChange
}) => {
  if (!customer) {
    return null;
  }

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 space-y-2">
          <SheetTitle className="text-xl font-bold">Customer Details</SheetTitle>
          <SheetDescription>
            View and manage customer information
          </SheetDescription>
        </SheetHeader>
        
        {/* Customer Profile Card */}
        <div className="py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {customer.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{customer.full_name}</h2>
              <p className="text-sm text-muted-foreground">Customer ID: {customer.id.substring(0, 8)}</p>
              <div className="flex gap-2 mt-1">
                {customer.status && (
                  <div className={`px-2 py-1 text-xs rounded 
                    ${customer.status === 'active' ? 'bg-green-100 text-green-800' : 
                      customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' : 
                      customer.status === 'blacklisted' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`
                  }>
                    {customer.status.replace('_', ' ')}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <Tabs defaultValue="contact">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="agreements">Agreements</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contact" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(customer.email)}>
                    <span className="sr-only">Copy email</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone_number}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(customer.phone_number || '')}>
                    <span className="sr-only">Copy phone</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </div>
                
                {customer.address && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{customer.address}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(customer.address || '')}>
                      <span className="sr-only">Copy address</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Nationality: {customer.nationality || 'Not specified'}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Driver License: {customer.driver_license || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4 pt-4">
              <div className="rounded-md border p-4 flex flex-col items-center justify-center text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium">Documents</h3>
                <p className="text-muted-foreground text-sm mb-4">View and manage customer documents.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="agreements" className="space-y-4 pt-4">
              <div className="rounded-md border p-4 flex flex-col items-center justify-center text-center">
                <Car className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium">Vehicle Agreements</h3>
                <p className="text-muted-foreground text-sm mb-4">View active and past agreements.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4 pt-4">
              <div className="rounded-md border p-4 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium">No Notes</h3>
                <p className="text-muted-foreground text-sm mb-4">No notes have been added for this customer.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <SheetFooter className="flex flex-col sm:flex-row gap-2">
          <Button asChild variant="outline">
            <Link to={`/customers/edit/${customer.id}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Customer
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/customers/${customer.id}`}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Full Profile
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
