
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface NewPaymentEntryProps {
  onBack: () => void;
  onClose: () => void;
}

export function NewPaymentEntry({ onBack, onClose }: NewPaymentEntryProps) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Here we would normally process the payment and upload the file
      toast({
        title: "Payment Recorded",
        description: "The new payment has been successfully recorded.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        className="mb-2"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="space-y-2">
        <Label htmlFor="note">Payment Note</Label>
        <Textarea
          id="note"
          placeholder="Enter payment details (e.g., Invoice #12345)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Upload Invoice</Label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <input {...getInputProps()} />
          {file ? (
            <p className="text-sm">File selected: {file.name}</p>
          ) : isDragActive ? (
            <p className="text-sm">Drop the file here...</p>
          ) : (
            <p className="text-sm">
              Drag & drop an invoice here, or click to select<br />
              (PDF, JPEG, PNG)
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={!note || loading}>
          Record Payment
        </Button>
      </div>
    </form>
  );
}
