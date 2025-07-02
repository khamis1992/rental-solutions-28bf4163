
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { FormBuilder } from './FormBuilder';
import { useToast } from '@/components/ui/use-toast';

// Define the schema for form validation
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^[3-9]\d{7}$/, "Please enter a valid 8-digit Qatar phone number"),
  message: z.string().min(10, "Message must be at least 10 characters").max(500, "Message cannot exceed 500 characters"),
});

// Infer the type from the schema
type FormData = z.infer<typeof formSchema>;

export function ExampleValidatedForm() {
  const { toast } = useToast();

  // Set default values for the form
  const defaultValues: Partial<FormData> = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };

  // Handle form submission
  const handleSubmit = async (data: FormData) => {
    // Simulate API call
    console.log('Form submitted:', data);
    
    // Display success message
    toast({
      title: 'Form Submitted',
      description: 'Your message has been sent successfully.',
    });
  };

  return (
    <FormBuilder
      schema={formSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      className="space-y-6 max-w-md mx-auto"
    >
      <FormField
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Your name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input placeholder="your.email@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input placeholder="33123456" {...field} />
            </FormControl>
            <FormDescription>
              Enter 8 digits only (Qatar format)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Message</FormLabel>
            <FormControl>
              <Textarea placeholder="Your message" {...field} rows={4} />
            </FormControl>
            <FormDescription>
              Please be specific about your inquiry
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <Button type="submit" className="w-full">
        Submit
      </Button>
    </FormBuilder>
  );
}
