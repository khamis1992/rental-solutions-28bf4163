
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NewPaymentEntryProps {
  onBack: () => void;
  onClose: () => void;
}

export function NewPaymentEntry({ onBack, onClose }: NewPaymentEntryProps) {
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setLoading(true);

    try {
      // Here we would normally process the payment and upload the file
      // Simulate a successful payment recording
      setTimeout(() => {
        toast.success("Payment recorded successfully");
        onClose();
      }, 1000);
    } catch (error) {
      toast.error("Failed to record payment. Please try again.");
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
        <Label htmlFor="amount">Payment Amount</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="text-lg"
          min="0.01"
          step="0.01"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Payment Method</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="credit_card">Credit Card</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Payment Note</Label>
        <Textarea
          id="note"
          placeholder="Enter payment details (e.g., Invoice #12345)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
        <Button type="submit" disabled={!amount || loading}>
          {loading ? "Processing..." : "Record Payment"}
        </Button>
      </div>
    </form>
  );
}
