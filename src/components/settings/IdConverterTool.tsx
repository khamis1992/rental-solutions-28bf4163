
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowRight } from 'lucide-react';

// Define the schema for our form
const idConverterSchema = z.object({
  inputId: z.string().min(1, 'Input ID is required'),
});

type IdConverterFormValues = z.infer<typeof idConverterSchema>;

export const IdConverterTool = () => {
  const [convertedId, setConvertedId] = useState<string | null>(null);
  
  // Create form
  const form = useForm<IdConverterFormValues>({
    resolver: zodResolver(idConverterSchema),
    defaultValues: {
      inputId: '',
    },
  });
  
  const onSubmit = (data: IdConverterFormValues) => {
    // Simple conversion logic - in a real app this would be more complex
    try {
      // Example: Convert from numeric to UUID format or vice versa
      const input = data.inputId.trim();
      let result = '';
      
      if (/^\d+$/.test(input)) {
        // Convert numeric to a sample UUID format
        result = `converted-${input}-uuid-format`;
      } else {
        // Convert non-numeric (like UUID) to a numeric format
        result = `${input.length}${Math.floor(Math.random() * 10000)}`;
      }
      
      setConvertedId(result);
    } catch (error) {
      console.error('Error converting ID:', error);
      setConvertedId('Error: Invalid ID format');
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          ID Converter Tool
        </CardTitle>
        <CardDescription>
          Convert between different ID formats in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-2/5">
                <FormField
                  control={form.control}
                  name="inputId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Input ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter ID to convert" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="self-center mt-6">
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="w-full sm:w-2/5">
                <FormItem>
                  <FormLabel>Converted ID</FormLabel>
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted/50">
                    {convertedId || '---'}
                  </div>
                </FormItem>
              </div>
            </div>
            
            <Button type="submit" size="sm">
              Convert ID
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
