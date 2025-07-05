
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TemplateStatus } from '@/components/agreements/form/AgreementTemplateStatus';

export function useTemplateSetup() {
  const [standardTemplateExists, setStandardTemplateExists] = useState<TemplateStatus>({ 
    accessible: false, 
    message: 'Checking template status...' 
  });
  
  const [specificUrlCheck, setSpecificUrlCheck] = useState<TemplateStatus>({ 
    accessible: false, 
    message: 'Checking URL templates...' 
  });
  
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    const checkTemplates = async () => {
      try {
        // Check standard template
        const { data: standardTemplate, error: standardError } = await supabase
          .from('agreement_templates')
          .select('id')
          .eq('is_default', true)
          .single();
        
        if (standardError) {
          setStandardTemplateExists({ 
            accessible: false, 
            message: 'No standard template found. Some features may be limited.' 
          });
        } else {
          setStandardTemplateExists({ 
            accessible: true, 
            message: 'Standard template available' 
          });
        }
        
        // Check URL specific template
        const currentUrl = window.location.pathname;
        const { data: urlTemplate, error: urlError } = await supabase
          .from('agreement_templates')
          .select('id')
          .eq('url_path', currentUrl)
          .single();
          
        if (urlError) {
          setSpecificUrlCheck({ 
            accessible: false, 
            message: 'No URL-specific template found' 
          });
        } else {
          setSpecificUrlCheck({ 
            accessible: true, 
            message: 'URL-specific template available' 
          });
        }
      } catch (error) {
        setTemplateError(error instanceof Error ? error.message : 'Failed to check templates');
      }
    };
    
    checkTemplates();
  }, []);
  
  return { standardTemplateExists, specificUrlCheck, templateError };
}
