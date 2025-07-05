
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  InvoiceTemplate,
  fetchTemplates,
  saveTemplate,
  deleteTemplate,
  initializeTemplates
} from '@/utils/invoiceTemplateUtils';

export const useInvoiceTemplates = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize templates if none exist
      await initializeTemplates();
      
      // Fetch templates
      const loadedTemplates = await fetchTemplates();
      setTemplates(loadedTemplates);
    } catch (err: any) {
      console.error('Error loading templates:', err);
      setError(err.message || 'Failed to load templates');
      toast.error(`Failed to load templates: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const addTemplate = useCallback(async (template: Omit<InvoiceTemplate, 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const savedTemplate = await saveTemplate(template);
      
      // Reload templates to ensure we have the latest data
      await loadTemplates();
      
      toast.success('Template added successfully');
      return savedTemplate;
    } catch (err: any) {
      console.error('Error adding template:', err);
      setError(err.message || 'Failed to add template');
      toast.error(`Failed to add template: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadTemplates]);
  
  const updateTemplate = useCallback(async (template: Omit<InvoiceTemplate, 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedTemplate = await saveTemplate(template);
      
      // Reload templates to ensure we have the latest data
      await loadTemplates();
      
      toast.success('Template updated successfully');
      return updatedTemplate;
    } catch (err: any) {
      console.error('Error updating template:', err);
      setError(err.message || 'Failed to update template');
      toast.error(`Failed to update template: ${err.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadTemplates]);
  
  const removeTemplate = useCallback(async (templateId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await deleteTemplate(templateId);
      
      // Reload templates to ensure we have the latest data
      await loadTemplates();
      
      toast.success('Template deleted successfully');
      return true;
    } catch (err: any) {
      console.error('Error deleting template:', err);
      setError(err.message || 'Failed to delete template');
      toast.error(`Failed to delete template: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadTemplates]);
  
  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);
  
  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    addTemplate,
    updateTemplate,
    removeTemplate
  };
};
