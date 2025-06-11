
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { TooltipWrapper } from "@/components/ui/TooltipWrapper";
import { CalendarClock, Download, FileEdit, FileText, Trash } from "lucide-react";

interface AgreementActionButtonsProps {
  onEdit: () => Promise<void>;
  onDownloadPdf: () => Promise<void>;
  onGenerateDocument: () => Promise<void>;
  onDelete: () => Promise<void>; // Changed to Promise<void> for consistency
  isGeneratingPdf?: boolean;
}

export function AgreementActionButtons({
  onEdit,
  onDownloadPdf,
  onGenerateDocument,
  onDelete,
  isGeneratingPdf = false,
}: AgreementActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <TooltipWrapper content="Edit this agreement's details.">
        <Button variant="outline" onClick={onEdit}>
          <FileEdit className="h-4 w-4 mr-2" /> Edit Agreement
        </Button>
      </TooltipWrapper>

      <TooltipWrapper content="Download this agreement as a PDF.">
        <LoadingButton
          variant="outline"
          onClick={onDownloadPdf}
          isLoading={isGeneratingPdf}
          loadingText="Generating PDF..."
        >
          <Download className="h-4 w-4 mr-2" /> Download PDF
        </LoadingButton>
      </TooltipWrapper>

      <TooltipWrapper content="Generate related documents for this agreement.">
        <Button variant="outline" onClick={onGenerateDocument}>
          <FileText className="h-4 w-4 mr-2" /> Generate Documents
        </Button>
      </TooltipWrapper>

      <TooltipWrapper content="Print this agreement.">
        <Button variant="outline" onClick={() => window.print()}>
          <CalendarClock className="h-4 w-4 mr-2" /> Print
        </Button>
      </TooltipWrapper>

      <TooltipWrapper content="Delete this agreement. This action cannot be undone.">
        <Button variant="destructive" onClick={onDelete}>
          <Trash className="h-4 w-4 mr-2" /> Delete
        </Button>
      </TooltipWrapper>
    </div>
  );
}
