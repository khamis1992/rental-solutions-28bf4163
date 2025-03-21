
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { customerSchemas } from "@/lib/validation";

// Define the form schema based on validation schemas
const formSchema = z.object({
  first_name: customerSchemas.firstName,
  last_name: customerSchemas.lastName,
  email: customerSchemas.email,
  phone: customerSchemas.phone,
  driving_license: customerSchemas.drivingLicense,
  address: customerSchemas.address,
  customer_type: z.enum(["individual", "corporate"]),
  company_name: z.string().optional(),
  tax_number: z.string().optional(),
  status: z.enum(["active", "pending", "inactive"]),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof formSchema>;

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormData>;
  customerId?: string;
  isEditing?: boolean;
}

const CustomerForm = ({ defaultValues, customerId, isEditing = false }: CustomerFormProps) => {
  const navigate = useNavigate();
  
  // Set up form with defaults
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      driving_license: "",
      address: "",
      customer_type: "individual",
      company_name: "",
      tax_number: "",
      status: "active",
      notes: "",
    },
  });
  
  const customerType = form.watch("customer_type");
  
  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (isEditing && customerId) {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update(data)
          .eq("id", customerId);
          
        if (error) throw error;
        
        toast.success("Customer updated successfully");
      } else {
        // Create new customer
        const { error } = await supabase
          .from("customers")
          .insert([data]);
          
        if (error) throw error;
        
        toast.success("Customer created successfully");
      }
      
      navigate("/customers");
    } catch (error: any) {
      console.error("Error saving customer:", error.message);
      toast.error(isEditing ? "Failed to update customer" : "Failed to create customer");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
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
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1234567890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="driving_license"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driving License</FormLabel>
                <FormControl>
                  <Input placeholder="DL12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customer_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {customerType === "corporate" && (
            <>
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="tax_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Number</FormLabel>
                    <FormControl>
                      <Input placeholder="TAX123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, City, Country" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about the customer..." 
                  className="min-h-32" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/customers")}
          >
            Cancel
          </Button>
          <Button type="submit">
            {isEditing ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CustomerForm;
