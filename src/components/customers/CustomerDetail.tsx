import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MoreVertical, Edit, Copy, User, Mail, Phone, MapPin, Calendar, Book, CheckCheck, Check, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { CustomerTrafficFines } from './CustomerTrafficFines';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Separator } from "@/components/ui/separator"
import { useAgreements } from '@/hooks/use-agreements';
import { useUser } from '@/hooks/use-auth';

interface CustomerDetails {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  driver_license: string;
  nationality: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

const customerSchema = z.object({
  full_name: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Invalid email address.",
  }),
  phone_number: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
  address: z.string().min(2, {
    message: "Address must be at least 2 characters.",
  }),
  driver_license: z.string().min(2, {
    message: "Driver license must be at least 2 characters.",
  }),
  nationality: z.string().min(2, {
    message: "Nationality must be at least 2 characters.",
  }),
  role: z.string().min(2, {
    message: "Role must be at least 2 characters.",
  }),
  status: z.string().min(2, {
    message: "Status must be at least 2 characters.",
  }),
  notes: z.string().optional(),
})

export function CustomerDetail() {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const { toast } = useToast()
  const { customerId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCustomer: setSelectedCustomer } = useAgreements();
  const { user } = useUser();

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails(customerId);
    }
  }, [customerId]);

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) {
        console.error("Error fetching customer details:", error);
        toast({
          title: "Error",
          description: "Failed to fetch customer details",
          variant: "destructive",
        });
      }

      if (data) {
        setCustomer(data);
        setNotes(data.notes || "");
        setSelectedCustomer({
          id: data.id,
          full_name: data.full_name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "Unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const updateCustomer = useMutation(
    async ({ id, data }: { id: string; data: Partial<CustomerDetails> }) => {
      const { data: updatedCustomer, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', id)
        .select()
        .single();
  
      if (error) {
        console.error('Error updating customer:', error);
        throw error;
      }
  
      return updatedCustomer;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      },
    }
  );

  const handleSaveNotes = async () => {
    try {
      setIsSaving(true);
      
      // Fix: Ensure the updateCustomer function can handle the mutation
      // Instead of using updateCustomer.update which doesn't exist,
      // directly call updateCustomer with the customer id and data
      const updatedCustomer = await updateCustomer({
        id: customer.id,
        data: { notes: notes }
      });
      
      if (updatedCustomer) {
        toast({
          title: "Notes updated",
          description: "Customer notes have been updated successfully",
        });
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast({
        title: "Update failed",
        description: "Failed to update customer notes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer?.id) {
      toast({
        title: "Error",
        description: "Customer ID is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', customer.id);

      if (error) {
        console.error("Error deleting customer:", error);
        toast({
          title: "Error",
          description: "Failed to delete customer.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Customer deleted successfully.",
        });
        navigate('/customers');
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: customer?.full_name || "",
      email: customer?.email || "",
      phone_number: customer?.phone_number || "",
      address: customer?.address || "",
      driver_license: customer?.driver_license || "",
      nationality: customer?.nationality || "",
      role: customer?.role || "",
      status: customer?.status || "",
      notes: customer?.notes || "",
    },
    mode: "onChange",
  });

  const [open, setOpen] = React.useState(false)

  const onSubmit = async (values: z.infer<typeof customerSchema>) => {
    try {
      setIsSaving(true);
      
      // Ensure customer and customer.id are valid before proceeding
      if (!customer || !customer.id) {
        toast({
          title: "Error",
          description: "Customer data is not loaded properly.",
          variant: "destructive",
        });
        return;
      }
  
      // Call the updateCustomer mutation with the customer id and form values
      const updatedCustomer = await updateCustomer({
        id: customer.id,
        data: values
      });
  
      if (updatedCustomer) {
        toast({
          title: "Customer updated",
          description: "Customer details have been updated successfully",
        });
        setOpen(false);
        // Refresh customer details after successful update
        fetchCustomerDetails(customer.id);
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update customer details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Update failed",
        description: "Failed to update customer details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!customer) {
    return <div>Loading customer details...</div>;
  }

  return (
    <Card className="w-[75%]">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Avatar className="mr-2 h-8 w-8">
            <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
            <AvatarFallback>{customer.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {customer.full_name}
          <Badge className="ml-2">{customer.role}</Badge>
        </CardTitle>
        <CardDescription>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            Joined {format(new Date(customer.created_at), 'MMMM dd, yyyy')}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span className="font-semibold">Full Name:</span> {customer.full_name}
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4" />
                  <span className="font-semibold">Email:</span> {customer.email}
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  <span className="font-semibold">Phone:</span> {customer.phone_number}
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span className="font-semibold">Address:</span> {customer.address}
                </div>
                <div className="flex items-center">
                  <Book className="mr-2 h-4 w-4" />
                  <span className="font-semibold">Driver License:</span> {customer.driver_license}
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span className="font-semibold">Nationality:</span> {customer.nationality}
                </div>
                <div className="flex items-center">
                  <CheckCheck className="mr-2 h-4 w-4" />
                  <span className="font-semibold">Status:</span> {customer.status}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add customer notes..."
                className="w-full"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="mt-2"
              >
                {isSaving ? "Saving..." : "Save Notes"}
              </Button>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-2">Traffic Fines</h3>
              <CustomerTrafficFines customerId={customer.id} />
            </div>
          </div>
        </ScrollArea>
      </CardContent>
      <CardContent>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-auto flex h-8 w-8 p-0 data-[state=open]:bg-muted">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(customer.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy customer ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user?.app_metadata?.role === 'admin' && (
              <DropdownMenuItem onClick={handleDeleteCustomer} className="text-red-500">
                Delete Customer
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Edit Customer</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit customer</DialogTitle>
              <DialogDescription>
                Make changes to customer here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="driver_license"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Driver License</FormLabel>
                      <FormControl>
                        <Input placeholder="Driver License" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <FormControl>
                        <Input placeholder="Nationality" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input placeholder="Role" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Input placeholder="Status" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
