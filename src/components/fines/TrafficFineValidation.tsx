
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, FileText, Loader2, Search, Upload, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTrafficFines } from '@/hooks/use-traffic-fines';

const validationSchema = z.object({
  licensePlate: z.string().min(1, 'License plate is required'),
});

type ValidationFormValues = z.infer<typeof validationSchema>;

const TrafficFineValidation: React.FC = () => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const { trafficFines } = useTrafficFines();
  
  const form = useForm<ValidationFormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      licensePlate: '',
    },
  });

  const onSubmit = async (data: ValidationFormValues) => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      // Find traffic fines for this license plate
      const relevantFines = trafficFines?.filter(fine => 
        fine.licensePlate?.toLowerCase() === data.licensePlate.toLowerCase()
      ) || [];
      
      // Calculate some stats
      const totalAmount = relevantFines.reduce((sum, fine) => sum + fine.fineAmount, 0);
      const pendingAmount = relevantFines
        .filter(fine => fine.paymentStatus === 'pending')
        .reduce((sum, fine) => sum + fine.fineAmount, 0);
      
      // Create a validation record
      const { error: validationError } = await supabase
        .from('traffic_fine_validations')
        .insert({
          license_plate: data.licensePlate,
          validation_date: new Date().toISOString(),
          validation_source: 'manual',
          result: {
            fines_found: relevantFines.length,
            total_amount: totalAmount,
            pending_amount: pendingAmount,
            fines: relevantFines.map(fine => ({
              id: fine.id,
              violation_number: fine.violationNumber,
              violation_date: fine.violationDate,
              amount: fine.fineAmount,
              status: fine.paymentStatus
            }))
          },
          status: 'completed'
        });
        
      if (validationError) {
        console.error('Error recording validation:', validationError);
        toast.error('Error recording validation result');
      }
      
      // Set the result for display
      setValidationResult({
        licensePlate: data.licensePlate,
        finesCount: relevantFines.length,
        totalAmount,
        pendingAmount,
        fines: relevantFines
      });
      
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate license plate');
    } finally {
      setIsValidating(false);
    }
  };

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

  const uploadFile = async () => {
    if (!selectedFile || !validationResult) {
      toast.error('Please select a file and complete validation first');
      return;
    }

    try {
      setIsUploading(true);
      const timestamp = Date.now();
      const filePath = `traffic-fines/${validationResult.licensePlate}/${timestamp}_${selectedFile.name.replace(/\s+/g, '_')}`;
      
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
      
      // Update the validation record with the document reference
      if (validationResult) {
        await supabase
          .from('traffic_fine_validations')
          .update({
            document_url: publicUrlData.publicUrl,
            document_name: selectedFile.name
          })
          .eq('license_plate', validationResult.licensePlate)
          .order('validation_date', { ascending: false })
          .limit(1);
      }
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const clearUploadedFile = () => {
    setSelectedFile(null);
    setUploadedFileUrl(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fine Validation</CardTitle>
          <CardDescription>
            Check if a vehicle has any pending traffic fines
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6">
                  <FormField
                    control={form.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter license plate" 
                            {...field} 
                            disabled={isValidating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-12 md:col-span-6 md:flex md:items-end">
                  <Button 
                    type="submit" 
                    disabled={isValidating} 
                    className="w-full"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Validate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>
        </Form>
        <CardFooter className="flex flex-col items-start">
          {validationResult && (
            <div className="w-full space-y-4">
              <Alert 
                variant={validationResult.finesCount > 0 ? "destructive" : "default"}
                className={validationResult.finesCount > 0 ? "mb-4" : ""}
              >
                {validationResult.finesCount > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <AlertTitle>
                  {validationResult.finesCount > 0 
                    ? `${validationResult.finesCount} Traffic Fine(s) Found` 
                    : 'No Traffic Fines Found'}
                </AlertTitle>
                <AlertDescription>
                  {validationResult.finesCount > 0 
                    ? `Total amount: $${validationResult.totalAmount.toFixed(2)}, Pending amount: $${validationResult.pendingAmount.toFixed(2)}`
                    : `No traffic fines found for license plate ${validationResult.licensePlate}`}
                </AlertDescription>
              </Alert>

              {validationResult.finesCount > 0 && (
                <div className="mt-4 border rounded-md p-4">
                  <h3 className="font-semibold mb-2">Fine Details</h3>
                  <div className="space-y-2">
                    {validationResult.fines.map((fine: any) => (
                      <div key={fine.id} className="p-2 border rounded flex justify-between items-center">
                        <div>
                          <p className="font-medium">{fine.violationNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(fine.violationDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${fine.fineAmount.toFixed(2)}</p>
                          <p className={`text-sm ${
                            fine.paymentStatus === 'paid' 
                              ? 'text-green-600' 
                              : fine.paymentStatus === 'disputed' 
                                ? 'text-amber-600' 
                                : 'text-red-600'
                          }`}>
                            {fine.paymentStatus.charAt(0).toUpperCase() + fine.paymentStatus.slice(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full border-t pt-4">
                <h3 className="font-semibold mb-2">Upload Documentation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You can attach a PDF document related to this validation (e.g., traffic fine notice, payment receipt)
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

                    {selectedFile && (
                      <Button 
                        type="button"
                        onClick={uploadFile}
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Document
                          </>
                        )}
                      </Button>
                    )}
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
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </Button>
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
                  </div>
                )}
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default TrafficFineValidation;
