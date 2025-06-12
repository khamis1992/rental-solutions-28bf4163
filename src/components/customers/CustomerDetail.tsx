import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Car, 
  DollarSign,
  Edit,
  FileText,
  CreditCard
} from 'lucide-react';
import { Customer } from '@/types/customer';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface CustomerDetailProps {
  id?: string;
}

export function CustomerDetail() {
  const { id } = useParams<CustomerDetailProps>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) {
        console.error("No customer ID provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select(`
            *,
            leases (
              id,
              start_date,
              end_date,
              status,
              rent_amount,
              vehicles (make, model, license_plate)
            )
          `)
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        // Map the leases data to the agreements property
        const customerWithAgreements = {
          ...data,
          agreements: data.leases?.map(lease => ({
            id: lease.id,
            start_date: lease.start_date,
            end_date: lease.end_date,
            status: lease.status,
            rent_amount: lease.rent_amount,
            vehicle_make: lease.vehicles?.make,
            vehicle_model: lease.vehicles?.model,
            license_plate: lease.vehicles?.license_plate
          })) || []
        } as Customer;

        setCustomer(customerWithAgreements);
      } catch (error: any) {
        console.error("Error fetching customer:", error);
        toast.error(`Failed to fetch customer: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  if (isLoading) {
    return <p>Loading customer details...</p>;
  }

  if (!customer) {
    return <p>Customer not found.</p>;
  }

  const activeAgreements = customer?.agreements?.filter(agreement => 
    agreement.status === 'active'
  ) || [];

  const totalAgreements = customer?.agreements?.length || 0;

  return (
    <div className="space-y-6">
      {/* Customer Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>{customer.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold">{customer.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  Customer ID: {customer.id}
                </p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone_number}</span>
              </div>
              {customer.driver_license && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Driver's License: {customer.driver_license}</span>
                </div>
              )}
              {customer.nationality && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Nationality: {customer.nationality}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Current Agreements ({customer?.agreements?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer?.agreements && customer.agreements.length > 0 ? (
            <div className="space-y-4">
              {customer.agreements.map((agreement) => (
                <div key={agreement.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-md font-semibold">Agreement ID: {agreement.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        Start Date: {new Date(agreement.start_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        End Date: {new Date(agreement.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {agreement.status}
                      </p>
                      {agreement.rent_amount && (
                        <p className="text-sm text-muted-foreground">
                          Rent Amount: {formatCurrency(agreement.rent_amount)}
                        </p>
                      )}
                      {agreement.vehicle_make && agreement.vehicle_model && (
                        <p className="text-sm text-muted-foreground">
                          Vehicle: {agreement.vehicle_make} {agreement.vehicle_model} ({agreement.license_plate})
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{agreement.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No agreements found for this customer.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
