
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  lease_id?: string;
  vehicle_id?: string;
  customer_id?: string;
  document_type: string;
  metadata?: any;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async (filters?: {
    lease_id?: string;
    vehicle_id?: string;
    customer_id?: string;
    document_type?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('agreement_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.lease_id) {
        query = query.eq('lease_id', filters.lease_id);
      }
      if (filters?.vehicle_id) {
        query = query.eq('vehicle_id', filters.vehicle_id);
      }
      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      if (filters?.document_type) {
        query = query.eq('document_type', filters.document_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    metadata: {
      document_type: string;
      lease_id?: string;
      vehicle_id?: string;
      customer_id?: string;
    }
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Upload file to Supabase Storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Save document record
      const { data, error } = await supabase
        .from('agreement_documents')
        .insert([
          {
            original_filename: file.name,
            document_url: urlData.publicUrl,
            document_type: metadata.document_type,
            file_size: file.size,
            lease_id: metadata.lease_id,
            vehicle_id: metadata.vehicle_id,
            upload_status: 'completed'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Document uploaded successfully');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to upload document');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('agreement_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDocuments(documents.filter(doc => doc.id !== id));
      toast.success('Document deleted successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to delete document');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (htmlContent: string, filename: string = 'document.pdf') => {
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Create a temporary DOM element to parse HTML
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Add content to PDF (this is a simple text extraction)
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      doc.text(textContent, 10, 10);
      
      // Save the PDF
      doc.save(filename);
      
      toast.success('PDF generated successfully');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to generate PDF');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    generatePDF
  };
};
