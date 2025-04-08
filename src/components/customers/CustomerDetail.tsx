
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Edit, Phone, Mail, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { useAgreements } from '@/hooks/use-agreements';
import { Badge } from '@/components/ui/badge';
import CustomerAgreements from '@/components/customers/CustomerAgreements';
import CustomerPayments from '@/components/customers/CustomerPayments';
import CustomerDocuments from '@/components/customers/CustomerDocuments';
import CustomerDrivingHistory from '@/components/customers/CustomerDrivingHistory';

interface CustomerDetailProps {
  customer: any;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const { agreements, isLoading } = useAgreements();
  const [customerAgreements, setCustomerAgreements] = useState([]);

  useEffect(() => {
    if (agreements && customer) {
      const filtered = agreements.filter(
        (agreement) => agreement.customer_id === customer.id
      );
      setCustomerAgreements(filtered);
    }
  }, [agreements, customer]);

  if (!customer) {
    return <div>No customer data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{customer.full_name}</h1>
          <p className="text-muted-foreground">Customer since {customer.created_at ? formatDate(new Date(customer.created_at)) : 'N/A'}</p>
        </div>
        <Button asChild>
          <Link to={`/customers/${customer.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Edit Customer
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="driving-history">Driving History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact Information</h3>
                <div className="space-y-2">
                  {customer.phone_number && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{customer.phone_number}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                      <span className="whitespace-pre-line">{customer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Documents</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">ID Document:</span>{" "}
                    {customer.id_document_url ? (
                      <Badge variant="outline">Uploaded</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                        Missing
                      </Badge>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Driver License:</span>{" "}
                    {customer.license_document_url ? (
                      <Badge variant="outline">Uploaded</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
                        Missing
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional customer info can be added here */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agreements" className="mt-6">
          <CustomerAgreements 
            agreements={customerAgreements} 
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <CustomerPayments 
            payments={[]} 
            isLoading={false}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <CustomerDocuments 
            customerId={customer.id}
            documents={[]}
            isLoading={false}
          />
        </TabsContent>

        <TabsContent value="driving-history" className="mt-6">
          <CustomerDrivingHistory 
            customerId={customer.id}
            records={[]}
            isLoading={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetail;
