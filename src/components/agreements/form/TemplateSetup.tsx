
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TemplateStatus, createTemplateStatus } from './AgreementTemplateStatus';

export const useTemplateSetup = () => {
  const [standardTemplateExists, setStandardTemplateExists] = useState<TemplateStatus>(
    createTemplateStatus(false, 'Checking for standard templates...')
  );
  const [specificUrlCheck, setSpecificUrlCheck] = useState<TemplateStatus>(
    createTemplateStatus(false, 'Checking for URL-specific templates...')
  );
  const [templateError, setTemplateError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if standard template exists
    const checkTemplateAvailability = async () => {
      try {
        // Check for standard template
        const { data: standardTemplate, error } = await supabase
          .from('agreement_templates')
          .select('id')
          .eq('is_default', true)
          .single();
        
        if (error) {
          console.error("Error checking for standard template:", error);
          setTemplateError("Error checking template availability");
          setStandardTemplateExists(createTemplateStatus(false, "Standard template not found"));
        } else {
          setStandardTemplateExists(createTemplateStatus(!!standardTemplate, 
            !!standardTemplate ? "Standard template available" : "No standard template found"));
        }
        
        // Check for URL-specific template
        const urlParams = new URLSearchParams(window.location.search);
        const templateId = urlParams.get('template_id');
        
        if (templateId) {
          const { data: specificTemplate, error: specificError } = await supabase
            .from('agreement_templates')
            .select('id')
            .eq('id', templateId)
            .single();
            
          if (specificError) {
            console.error("Error checking for specific template:", specificError);
            setSpecificUrlCheck(createTemplateStatus(false, "URL template not found"));
          } else {
            setSpecificUrlCheck(createTemplateStatus(!!specificTemplate, 
              !!specificTemplate ? "URL template found" : "URL template not found"));
          }
        }
      } catch (err) {
        console.error("Exception checking template availability:", err);
        setTemplateError("Error checking template availability");
      }
    };
    
    checkTemplateAvailability();
  }, []);
  
  return { 
    standardTemplateExists, 
    specificUrlCheck, 
    templateError 
  };
};
