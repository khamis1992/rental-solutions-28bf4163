
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type TemplateStatus = boolean;

export const useTemplateSetup = () => {
  const [standardTemplateExists, setStandardTemplateExists] = useState<TemplateStatus>(false);
  const [specificUrlCheck, setSpecificUrlCheck] = useState<TemplateStatus>(false);
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
        } else {
          setStandardTemplateExists(!!standardTemplate);
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
          } else {
            setSpecificUrlCheck(!!specificTemplate);
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
