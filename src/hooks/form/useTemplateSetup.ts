
import { useEffect, useState } from 'react';
import { createTemplateStatus, TemplateStatus } from '@/components/agreements/form/AgreementTemplateStatus';
import { supabase } from '@/lib/supabase';

/**
 * Hook to check for available agreement templates
 */
export function useTemplateSetup() {
  const [standardTemplateExists, setStandardTemplateExists] = useState<TemplateStatus>(
    createTemplateStatus(false, 'Checking for standard templates...')
  );
  const [specificUrlCheck, setSpecificUrlCheck] = useState<TemplateStatus>(
    createTemplateStatus(false, 'Checking for URL-specific templates...')
  );
  const [templateError, setTemplateError] = useState<Error | null>(null);

  useEffect(() => {
    // Check for standard templates
    const checkStandardTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('agreement_templates')
          .select('id, name')
          .eq('is_active', true)
          .limit(1);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setStandardTemplateExists(
            createTemplateStatus(true, `Standard template '${data[0].name}' found`)
          );
        } else {
          setStandardTemplateExists(
            createTemplateStatus(false, 'No standard templates found')
          );
        }
      } catch (error) {
        console.error('Error checking for standard templates:', error);
        setTemplateError(error as Error);
        setStandardTemplateExists(
          createTemplateStatus(false, 'Error checking for templates')
        );
      }
    };

    // Check for URL-specific templates
    const checkSpecificUrlTemplate = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const templateId = urlParams.get('templateId');

        if (templateId) {
          const { data, error } = await supabase
            .from('agreement_templates')
            .select('id, name')
            .eq('id', templateId)
            .eq('is_active', true)
            .single();

          if (error) {
            setSpecificUrlCheck(
              createTemplateStatus(false, `Template ID '${templateId}' not found or inactive`)
            );
          } else if (data) {
            setSpecificUrlCheck(
              createTemplateStatus(true, `URL-specified template '${data.name}' will be used`)
            );
          }
        } else {
          setSpecificUrlCheck(
            createTemplateStatus(false, 'No template specified in URL')
          );
        }
      } catch (error) {
        console.error('Error checking for URL-specific template:', error);
        setTemplateError(error as Error);
        setSpecificUrlCheck(
          createTemplateStatus(false, 'Error checking URL template')
        );
      }
    };

    checkStandardTemplate();
    checkSpecificUrlTemplate();
  }, []);

  return {
    standardTemplateExists,
    specificUrlCheck,
    templateError
  };
}
