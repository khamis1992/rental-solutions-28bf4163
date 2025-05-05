
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Edit, Check, User, Loader2 } from 'lucide-react';
import { CustomerLegalObligations } from '../legal/CustomerLegalObligations';

// Defining the props interface
interface CustomerDetailProps {
  customerId?: string;
}

// Assuming there's a hook that handles customer data updates
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

// Modify the component to correctly use mutations and handle the customerId prop
export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
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

  // Use the useMutation hook correctly
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await updateCustomer(id, data);
    },
    onSuccess: () => {
      // ... handle success
      toast({
        title: "Customer updated",
        description: "Customer details have been updated successfully.",
      });
    },
    onError: (error: any) => {
      // ... handle error
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handler for form submission
  const handleUpdateCustomer = async (data: any) => {
    if (!customerId) return;
    // Use the mutate method
    updateMutation.mutate({ id: customerId, data });
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value,
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !customer) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Customer data not found"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Customer Details
          </CardTitle>
          <CardDescription>View and manage customer information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                type="text"
                id="full_name"
                name="full_name"
                value={customer.full_name || ''}
                disabled={!isEditing}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={customer.email || ''}
                disabled={!isEditing}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={customer.phone_number || ''}
                disabled={!isEditing}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={customer.address || ''}
                disabled={!isEditing}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="driver_license">Driver License</Label>
              <Input
                type="text"
                id="driver_license"
                name="driver_license"
                value={customer.driver_license || ''}
                disabled={!isEditing}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="flex justify-end">
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  className="mr-2"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleUpdateCustomer(customer);
                    setIsEditing(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </>
            ) : (
              <Button onClick={toggleEditing}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Legal Obligations section */}
      {customerId && <CustomerLegalObligations customerId={customerId} />}
    </div>
  );
};
