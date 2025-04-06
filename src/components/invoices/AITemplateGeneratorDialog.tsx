import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TemplateVariable } from '@/utils/invoiceTemplateUtils';
import { useTranslation } from 'next-i18next';
import { useIsRTL } from '@/utils/rtl-utils';


interface AITemplateGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateGenerated: (template: string) => void;
  variables: TemplateVariable[];
  templateType: string;
}

const AITemplateGeneratorDialog: React.FC<AITemplateGeneratorDialogProps> = ({
  open,
  onOpenChange,
  onTemplateGenerated,
  variables,
  templateType,
}) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      // Call our edge function
      const { data, error } = await supabase.functions.invoke('generate-template', {
        body: {
          prompt,
          templateType,
          variables,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.template) {
        onTemplateGenerated(data.template);
        onOpenChange(false);
        toast.success(t('common:templateGeneratedSuccessfully')); // Use translation
      } else {
        throw new Error(t('common:noTemplateGenerated')); // Use translation
      }
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error(t('common:failedToGenerateTemplate', { message: (error as Error).message })); // Use translation
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('common:generateTemplateWithAI')}</DialogTitle> {/* Use translation */}
          <DialogDescription>
            {t('common:describeTemplate')} {/* Use translation */}
          </DialogDescription>
        </DialogHeader>

        <div className={`grid gap-4 py-4 ${isRTL ? 'text-right' : 'text-left'}`}> {/* Added RTL support */}
          <div className="grid gap-2">
            <label htmlFor="prompt" className="text-sm font-medium">{t('common:prompt')}</label> {/* Use translation */}
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('common:promptPlaceholder')} {/* Use translation */}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              {t('common:aiWillUseVariables', { count: variables.length, type: templateType })} {/* Use translation */}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')} {/* Use translation */}
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common:generating')} {/* Use translation */}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t('common:generateTemplate')} {/* Use translation */}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AITemplateGeneratorDialog;