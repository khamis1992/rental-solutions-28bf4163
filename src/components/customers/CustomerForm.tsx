
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, Customer } from "@/lib/validation-schemas/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface CustomerFormProps {
  initialData?: Customer;
  onSubmit: (data: Customer) => void;
  isLoading?: boolean;
}

export function CustomerForm({ initialData, onSubmit, isLoading }: CustomerFormProps) {
  const navigate = useNavigate();
  
  const form = useForm<Customer>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      full_name: "",
      email: "",
      phone: "",
      address: "",
      driver_license: "",
      notes: "",
      status: "active",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer's full name" {...field} />
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
                  <Input type="email" placeholder="customer@example.com" {...field} />
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
            name="driver_license"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driver License</FormLabel>
                <FormControl>
                  <Input placeholder="License number" {...field} />
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Customer's current status in the system
                </FormDescription>
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
                <Textarea placeholder="Customer's address" {...field} />
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
                <Textarea placeholder="Additional notes about the customer" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/customers")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : initialData ? "Update Customer" : "Add Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
