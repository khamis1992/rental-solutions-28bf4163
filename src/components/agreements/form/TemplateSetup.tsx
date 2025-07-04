import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { errorLogger } from '@/lib/errors/error-logger';

export function useTemplateSetup() {
  const [standardTemplateExists, setStandardTemplateExists] = useState(false as boolean);
  const [specificTemplateUrl, setSpecificTemplateUrl] = useState(null as string | null);
  const [templateError, setTemplateError] = useState(null as Error | null);
  const [specificUrlCheck, setSpecificUrlCheck] = useState(false as boolean);

  useEffect(() => {
    const checkTemplates = async () => {
      try {
        // Check if standard template exists
        const { data: templateData, error: templateError } = await supabase
          .from('agreement_templates')
          .select('id, content')
          .eq('is_default', true as any); // Type assertion to fix the type issue
          
        if (templateError) {
          throw templateError;
        }
        
        setStandardTemplateExists(templateData && templateData.length > 0);
        
        // Check if a specific URL template exists
        const urlTemplateId = new URLSearchParams(window.location.search).get('templateId');
        if (urlTemplateId) {
          const { data: specificTemplate, error: specificError } = await supabase
            .from('agreement_templates')
            .select('*')
            .eq('id', urlTemplateId as any); // Type assertion to fix the type issue
            
          if (specificError) {
            throw specificError;
          }
          
          setSpecificUrlCheck(specificTemplate && specificTemplate.length > 0);
          if (specificTemplate && specificTemplate.length > 0) {
            setSpecificTemplateUrl(`/templates/${specificTemplate[0].id}`);
          }
        }
      } catch (error) {
        const errorInstance = error instanceof Error ? error : new Error('Unknown error checking templates');
        errorLogger.logError(errorInstance, {
          context: 'TemplateSetup.checkTemplates',
          operation: 'checking_agreement_templates'
        });
        setTemplateError(errorInstance);
      }
    };
    
    checkTemplates();
  }, []);
  
  return { standardTemplateExists, specificUrlCheck, specificTemplateUrl, templateError };
}

export function AgreementTemplateStatus({ 
  standardTemplateExists, 
  specificUrlCheck 
}: { 
  standardTemplateExists: boolean; 
  specificUrlCheck: boolean;
}) {
  if (!standardTemplateExists && !specificUrlCheck) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              No agreement template found
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                No default agreement template is available. The agreement will be created without a template.
                You can add a template later from the agreement details page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
