import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { AgreementTrafficFines } from '../../AgreementTrafficFines';

interface DocumentsCardProps {
  agreement: any;
  onEdit: () => Promise<void>;
  onDownloadPdf: () => Promise<void>;
  onGenerateDocument: () => Promise<void>;
  onDelete: () => Promise<void>;
  isGeneratingPdf: boolean;
}

export function DocumentsCard({
  agreement,
  onEdit,
  onDownloadPdf,
  onGenerateDocument,
  onDelete,
  isGeneratingPdf
}: DocumentsCardProps) {
  const handleEdit = async () => {
    await onEdit();
  };

  const handleDelete = async () => {
    await onDelete();
  };

  const handleDownloadPdf = async () => {
    await onDownloadPdf();
  };

  const handleGenerateDocument = async () => {
    await onGenerateDocument();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agreement Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-medium">Contract Document</h3>
                <p className="text-sm text-muted-foreground">
                  Download or generate the agreement contract
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleGenerateDocument}
                  disabled={isGeneratingPdf}
                >
                  <FileText className="h-4 w-4" />
                  {isGeneratingPdf ? 'Generating...' : 'Generate Document'}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-medium">Agreement Management</h3>
                <p className="text-sm text-muted-foreground">
                  Edit or delete this agreement
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4" />
                  Edit Agreement
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Agreement
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines</CardTitle>
        </CardHeader>
        <CardContent>
          {agreement.start_date && agreement.end_date ? (
            <AgreementTrafficFines 
              agreementId={agreement.id}
              startDate={new Date(agreement.start_date)}
              endDate={new Date(agreement.end_date)}
            />
          ) : (
            <div className="flex items-center p-4 bg-amber-50 text-amber-800 rounded-md">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>Cannot check for traffic fines: missing rental period information.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
