
import React, { useState } from 'react';
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
        toast.success('Template generated successfully!');
      } else {
        throw new Error('No template was generated');
      }
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Template with AI</DialogTitle>
          <DialogDescription>
            Describe what kind of template you want, and our AI will generate it using your available variables.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="prompt" className="text-sm font-medium">Prompt</label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Create a modern invoice template with a clean layout and subtle color palette"
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              The AI will use {variables.length} available variables and create a {templateType} template.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AITemplateGeneratorDialog;
