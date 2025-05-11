
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useTemplateSetup = () => {
  const [standardTemplateExists, setStandardTemplateExists] = useState<boolean>(false);
  const [specificUrlCheck, setSpecificUrlCheck] = useState<boolean | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useEffect(() => {
    const checkTemplateAvailability = async () => {
      try {
        // Check if a standard template exists in the database
        const { data, error } = await supabase
          .from('agreement_templates')
          .select('id')
          .eq('is_active', true)
          .limit(1);

        if (error) {
          console.error("Error checking template availability:", error);
          setTemplateError("Failed to check template availability");
          setStandardTemplateExists(false);
          return;
        }

        // Ensure data exists and is an array before using it
        if (data && Array.isArray(data) && data.length > 0) {
          console.info("Template check result: Templates found");
          setStandardTemplateExists(true);
        } else {
          console.info("Template check result: No templates found");
          setStandardTemplateExists(false);
        }
      } catch (err) {
        console.error("Exception in template check:", err);
        setTemplateError("Error checking template availability");
        setStandardTemplateExists(false);
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
