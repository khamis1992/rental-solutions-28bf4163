
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';
import { generateArabicContractPdf } from '@/utils/contract-generator';
import { Agreement } from '@/types/agreement';

interface ContractGenerationButtonProps {
  agreement: Agreement;
}

export function ContractGenerationButton({ agreement }: ContractGenerationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateContract = async () => {
    if (!agreement) {
      toast.error('Agreement data not available');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Generating Arabic rental contract...');
      
      await generateArabicContractPdf(agreement);
      
      toast.success('Contract PDF generated successfully');
    } catch (error) {
      console.error('Error generating contract:', error);
      toast.error('Failed to generate contract PDF');
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
      {isGenerating ? 'Generating Contract...' : 'Contract'}
    </Button>
  );
}
