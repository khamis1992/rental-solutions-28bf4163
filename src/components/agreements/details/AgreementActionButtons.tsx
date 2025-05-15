
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { CalendarClock, Download, FileEdit, FileText, Trash } from "lucide-react";
import { Agreement } from "@/types/agreement";

interface AgreementActionButtonsProps {
  agreement?: Agreement;
  onEdit: () => void;
  onDownloadPdf: () => void;
  onGenerateDocument: () => void;
  onDelete: () => void;
  isGeneratingPdf?: boolean;
  loadingStates?: Record<string, boolean>;
}

export function AgreementActionButtons({ 
  agreement,
  onEdit, 
  onDownloadPdf, 
  onGenerateDocument, 
  onDelete,
  isGeneratingPdf,
  loadingStates
}: AgreementActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" onClick={onEdit}>
        <FileEdit className="h-4 w-4 mr-2" /> Edit Agreement
      </Button>
      
      <LoadingButton
        variant="outline"
        onClick={onDownloadPdf}
        loadingKey="generatingPdf"
        loadingStates={loadingStates}
        isLoading={isGeneratingPdf}
        loadingText="Generating PDF..."
      >
        <Download className="h-4 w-4 mr-2" /> Download PDF
      </LoadingButton>
      
      <Button variant="outline" onClick={onGenerateDocument}>
        <FileText className="h-4 w-4 mr-2" /> Generate Documents
      </Button>
      
      <Button variant="outline" onClick={() => window.print()}>
        <CalendarClock className="h-4 w-4 mr-2" /> Print
      </Button>
      
      <Button variant="destructive" onClick={onDelete}>
        <Trash className="h-4 w-4 mr-2" /> Delete
      </Button>
    </div>
  );
}
