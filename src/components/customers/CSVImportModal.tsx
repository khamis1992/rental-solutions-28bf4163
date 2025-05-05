
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

const fieldMappingSchema = z.record(z.string());

const formSchema = z.object({
  file: z.any(),
  fieldMapping: fieldMappingSchema,
});

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportModal({ open, onOpenChange }: CSVImportModalProps) {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [savedFilename, setSavedFilename] = useState<string | null>(null);

  // Get the current user on component mount
  React.useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  // Reference customer_import_logs table with type assertion for TypeScript
  const importLogsTable = supabase.from('customer_import_logs' as any);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: null,
      fieldMapping: {},
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!values.file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import.",
      });
      return;
    }

    const file = values.file[0];

    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
      });
      return;
    }

    // Check if user is authenticated
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to import customers.",
      });
      return;
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('customer-csv-imports')
      .upload(`${user.id}/${file.name}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
      });
      return;
    }

    const savedFilename = uploadData.path;
    setSavedFilename(savedFilename);

    // Adjust the insert call to match what the API expects
    const { data, error } = await importLogsTable.insert({
      file_name: savedFilename,
      original_file_name: file.name,
      status: 'pending' as any,
      created_by: user.id || null,
      mapping_used: values.fieldMapping
    } as any);

    if (error) {
      toast({
        title: "Failed to create import log",
        description: error.message,
      });
      return;
    }

    // Ensure we safely access the id property
    const importLogId = data && Array.isArray(data) && data.length > 0 && 'id' in data[0] ? data[0].id : null;

    if (!importLogId) {
      toast({
        title: "Failed to retrieve import log ID",
        description: "Could not retrieve the import log ID.",
      });
      return;
    }

    toast({
      title: "Import started",
      description: "Your customer import has started and you'll be notified when it's complete.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import customers.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CSV File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".csv, application/vnd.ms-excel"
                      onChange={(e) => {
                        if (e.target.files) {
                          field.onChange(e.target.files);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              <UploadCloud className="h-4 w-4 mr-2" />
              Import
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
