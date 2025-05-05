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
import { Edit, Check, User } from 'lucide-react';

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

// Modify the component to correctly use mutations
export const CustomerDetail = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [customerId, setCustomerId] = useState<string>('f444492f-771a-4242-b979-c9ca6c456b08'); // Example customer ID
  const { toast } = useToast();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customerId)
          .single();

        if (error) {
          console.error("Error fetching customer:", error);
          toast({
            title: "Error fetching customer",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        setCustomer(data);
      } catch (error: any) {
        console.error("Unexpected error fetching customer:", error);
        toast({
          title: "Unexpected error",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchCustomer();
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
    // Use the mutate method correctly
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="mr-2 h-5 w-5" />
          Customer Details
        </CardTitle>
        <CardDescription>View and manage customer information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {customer ? (
          <>
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
          </>
        ) : (
          <p>Loading customer details...</p>
        )}
      </CardContent>
    </Card>
  );
};
