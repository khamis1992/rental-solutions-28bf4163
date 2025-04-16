
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Calendar, FileText, Loader2, Upload, X } from 'lucide-react';
import { useTrafficFines, TrafficFineCreatePayload } from '@/hooks/use-traffic-fines';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

// Define the schema for traffic fine entry form
const trafficFineSchema = z.object({
  violationNumber: z.string().min(1, 'Violation number is required'),
  licensePlate: z.string().min(1, 'License plate is required'),
  violationDate: z.date({
    required_error: 'Violation date is required',
  }),
  fineAmount: z.coerce.number().min(0, 'Fine amount must be a positive number'),
  violationCharge: z.string().optional(),
  location: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'disputed']).default('pending'),
});

type TrafficFineFormData = z.infer<typeof trafficFineSchema>;

interface TrafficFineEntryProps {
  onFineSaved?: () => void;
}

const TrafficFineEntry: React.FC<TrafficFineEntryProps> = ({ onFineSaved }) => {
  const { createTrafficFine } = useTrafficFines();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);

  const form = useForm<TrafficFineFormData>({
    resolver: zodResolver(trafficFineSchema),
    defaultValues: {
      violationNumber: `TF-${Math.floor(Math.random() * 10000)}`,
      licensePlate: '',
      violationDate: new Date(),
      fineAmount: 0,
      violationCharge: '',
      location: '',
      paymentStatus: 'pending',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast.error('Please select a PDF file');
      }
    }
  };

  const uploadFile = async (licensePlate: string) => {
    if (!selectedFile) {
      return null;
    }

    try {
      setIsUploading(true);
      const timestamp = Date.now();
      const filePath = `traffic-fines/${licensePlate}/${timestamp}_${selectedFile.name.replace(/\s+/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      setUploadedFileUrl(publicUrlData.publicUrl);
      
      // Save document reference in the documents table
      const { data: documentData, error: documentError } = await supabase
        .from('traffic_fine_documents')
        .insert({
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          public_url: publicUrlData.publicUrl,
          uploaded_at: new Date().toISOString(),
          document_type: 'traffic_fine',
          status: 'active'
        })
        .select('id')
        .single();
        
      if (documentError) {
        console.error('Error saving document reference:', documentError);
      } else if (documentData) {
        setUploadedDocumentId(documentData.id);
        return documentData.id;
      }
      
      return null;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const clearUploadedFile = () => {
    setSelectedFile(null);
    setUploadedFileUrl(null);
    setUploadedDocumentId(null);
  };

  const onSubmit = async (data: TrafficFineFormData) => {
    try {
      // First upload any attached document
      const documentId = selectedFile ? await uploadFile(data.licensePlate) : null;
      
      // Create the fine with document reference if available
      const fineData: TrafficFineCreatePayload & { document_id?: string } = {
        ...data
      };
      
      if (documentId) {
        fineData.document_id = documentId;
      }
      
      await createTrafficFine.mutate(fineData);
      
      toast.success("Traffic fine created successfully");
      form.reset();
      clearUploadedFile();
      
      if (onFineSaved) {
        onFineSaved();
      }
    } catch (error) {
      toast.error("Failed to create traffic fine", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record New Traffic Fine</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Make sure to enter the correct license plate to ensure proper customer assignment.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., TF-12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., ABC123" />
                    </FormControl>
                    <FormDescription>
                      License plate is required to match the fine to a vehicle
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Violation Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fineAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fine Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                        placeholder="0.00" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Charge</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Speeding" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="disputed">Disputed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter violation location details" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Upload Documentation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Attach a PDF document of the traffic fine notice or receipt
              </p>
              
              {!uploadedFileUrl ? (
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="pdf-upload"
                      onChange={handleFileChange}
                      accept="application/pdf"
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => document.getElementById('pdf-upload')?.click()}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Select PDF
                    </Button>
                    {selectedFile && (
                      <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{selectedFile?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedFile?.size ? `${(selectedFile.size / 1024).toFixed(2)} KB` : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearUploadedFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading document...
                </>
              ) : (
                "Create Traffic Fine"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default TrafficFineEntry;
