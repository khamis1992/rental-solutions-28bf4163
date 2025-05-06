
import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, 
  Badge, Button, 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Edit, Trash2, Mail, Phone, MapPin, FileText, Clock } from 'lucide-react';
import { CustomerLegalObligations } from '../legal/CustomerLegalObligations';
import { formatDate } from '@/lib/date-utils';

interface CustomerDetailProps {
  customerId?: string;
}

// Function to handle customer data updates
const updateCustomer = (id: string, data: any) => {
  return supabase
    .from('profiles')
    .update(data)
    .eq('id', id)
    .then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
};

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) {
        setError("No customer ID provided");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get customer and their agreements
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            agreements:leases(
              id, 
              agreement_number, 
              start_date, 
              end_date, 
              status
            )
          `)
          .eq('id', customerId)
          .single();

        if (error) {
          console.error("Error fetching customer:", error);
          setError(error.message);
          toast({
            title: "Error fetching customer",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        setCustomer(data);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Unexpected error fetching customer:", error);
        setError(error.message);
        setIsLoading(false);
        toast({
          title: "Unexpected error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId, toast]);

  // Handle customer updates
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await updateCustomer(id, data);
    },
    onSuccess: () => {
      toast({
        title: "Customer updated",
        description: "Customer details have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleUpdateCustomer = async (data: any) => {
    if (!customerId) return;
    updateMutation.mutate({ id: customerId, data });
  };

  const handleDelete = () => {
    toast({
      title: "Delete functionality",
      description: "Delete functionality is not implemented yet.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-destructive">{error || "Customer data not found"}</p>
        </CardContent>
      </Card>
    );
  }

  // Count active agreements
  const activeAgreements = customer.agreements?.filter(
    (agreement: any) => agreement.status === 'active'
  ).length || 0;

  // Get total agreements
  const totalAgreements = customer.agreements?.length || 0;

  return (
    <div className="space-y-6">
      {/* Customer Header Card */}
      <Card className="w-full border rounded-lg overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center text-lg font-bold">
                {customer.full_name?.charAt(0) || "C"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{customer.full_name}</h2>
                  <Badge className="bg-blue-500 hover:bg-blue-600">Active</Badge>
                </div>
                <p className="text-gray-500">Customer since {formatDate(customer.created_at)}</p>
                <div className="mt-2 flex gap-6">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{customer.email || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{customer.phone_number || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{customer.nationality || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 mb-1">Total Agreements</p>
              <p className="text-3xl font-bold">{totalAgreements}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 mb-1">Active Agreements</p>
              <p className="text-3xl font-bold">{activeAgreements}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 mb-1">Last Updated</p>
              <p className="text-3xl font-bold">{formatDate(customer.updated_at || customer.created_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="fines">Traffic Fines</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information Card */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 mb-1">Email Address</p>
                  <p className="font-medium">{customer.email || "N/A"}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">Phone Number</p>
                  <p className="font-medium">{customer.phone_number || "N/A"}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">Address</p>
                  <p className="font-medium">{customer.address || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Customer Details Card */}
          <Card className="w-full">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Customer Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 mb-1">Status</p>
                  <Badge className="bg-blue-500 hover:bg-blue-600">Active</Badge>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">Driver License</p>
                  <p className="font-medium">{customer.driver_license || "N/A"}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">Last Updated</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDate(customer.updated_at || customer.created_at)} 3:25 PM
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional Notes */}
          <Card className="w-full md:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Additional Notes</h3>
              <p className="text-gray-500 italic">
                {customer.notes || "No additional notes for this customer."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="agreements">
          {customer.agreements && customer.agreements.length > 0 ? (
            <div className="bg-white rounded-md shadow">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agreement #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customer.agreements.map((agreement: any) => (
                    <tr key={agreement.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agreement.agreement_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(agreement.start_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(agreement.end_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={
                          agreement.status === 'active' ? 'bg-green-100 text-green-800' : 
                          agreement.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }>
                          {agreement.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="w-full">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No agreements found for this customer.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="fines">
          {customerId && <CustomerLegalObligations customerId={customerId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};
