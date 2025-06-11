import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { generateFullArabicContractPdf } from '@/utils/contract-generator';
import { Agreement } from '@/types/agreement';

interface Contract2GenerationButtonProps {
  agreement: Agreement;
}

export function Contract2GenerationButton({ agreement }: Contract2GenerationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateContract = async () => {
    if (!agreement) {
      toast.error('Agreement data not available');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Generating full Arabic rental contract...');
      await generateFullArabicContractPdf(agreement);
      toast.success('Full contract PDF generated successfully');
    } catch (error) {
      console.error('Error generating full contract:', error);
      toast.error('Failed to generate full contract PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleGenerateContract}
      disabled={isGenerating}
      className="flex items-center gap-2"
    >
      <FileText className="h-4 w-4" />
      {isGenerating ? 'Generating...' : 'Contract2'}
    </Button>
  );
} 