import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TemplateVariable } from '@/utils/invoiceTemplateUtils';
import { useTranslation } from '@/contexts/TranslationContext';
import { useIsRTL } from '@/contexts/TranslationContext';


interface AITemplateGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateGenerated: (template: string) => void;
  variables: TemplateVariable[];
  templateType: string;
}

export function AITemplateGeneratorDialog({
  open,
  onOpenChange,
  onTemplateGenerated,
  variables,
  templateType
}: AITemplateGeneratorDialogProps) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

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
        toast.success(t('common:templateGeneratedSuccessfully'));
      } else {
        throw new Error(t('common:noTemplateGenerated'));
      }
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error(t('common:failedToGenerateTemplate', { message: (error as Error).message }));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('common:generateTemplateWithAI')}</DialogTitle>
        </DialogHeader>
        <div className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
          <Input
            placeholder={t('common:promptPlaceholder')}
            className="min-h-[150px]"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t('common:aiWillUseVariables', { count: variables.length, type: templateType })}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common:generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t('common:generateTemplate')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}