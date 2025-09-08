// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Upload, 
  MoreVertical, 
  Download, 
  Trash2, 
  Eye, 
  Search,
  FileText,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useDocumentsEnhanced } from '@/hooks/use-documents-enhanced';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { DocumentViewer } from './DocumentViewer';
import { toast } from 'sonner';

interface DocumentListProps {
  leaseId?: string;
  vehicleId?: string;
  showUpload?: boolean;
  title?: string;
}

export function DocumentList({ 
  leaseId, 
  vehicleId, 
  showUpload = true, 
  title = "المستندات" 
}: DocumentListProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewerDocument, setViewerDocument] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    documents,
    isLoading,
    deleteDocument,
    downloadDocument,
    refreshDocuments
  } = useDocumentsEnhanced({ leaseId, vehicleId });

  // Filter documents based on search term
  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return documents;
    
    return documents.filter(doc =>
      doc.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  const handleDownload = async (document: any) => {
    const isDownloading = true;
    try {
      await downloadDocument(document.id, document.original_filename || 'document');
      toast.success('تم تحميل المستند بنجاح');
    } catch (error) {
      toast.error('فشل في تحميل المستند');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستند؟')) {
      try {
        await deleteDocument(documentId);
        toast.success('تم حذف المستند بنجاح');
      } catch (error) {
        toast.error('فشل في حذف المستند');
      }
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      'contract': 'عقد',
      'id_copy': 'نسخة الهوية',
      'license_copy': 'نسخة الرخصة',
      'insurance': 'تأمين',
      'other': 'أخرى'
    };
    return typeLabels[type] || type;
  };

  const getDocumentIcon = (filename: string) => {
    const extension = filename?.split('.').pop()?.toLowerCase();
    return <FileText className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin ml-2" />
          <span>جاري تحميل المستندات...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {title}
              </CardTitle>
              <CardDescription>
                إدارة وعرض المستندات المرتبطة
              </CardDescription>
            </div>
            {showUpload && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="w-4 h-4 ml-2" />
                رفع مستند
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في المستندات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Documents Table */}
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مستندات متاحة</p>
              {showUpload && (
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setUploadDialogOpen(true)}
                >
                  رفع أول مستند
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">اسم الملف</TableHead>
                  <TableHead className="text-right">الحجم</TableHead>
                  <TableHead className="text-right">تاريخ الرفع</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getDocumentIcon(document.original_filename)}
                        <span>{getDocumentTypeLabel(document.document_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {document.original_filename || 'مستند غير مسمى'}
                    </TableCell>
                    <TableCell>
                      {document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : '-'}
                    </TableCell>
                    <TableCell>
                      {document.created_at ? 
                        formatDate(document.created_at) : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={document.upload_status === 'completed' ? 'default' : 'secondary'}>
                        {document.upload_status === 'completed' ? 'مكتمل' : 'قيد المعالجة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewerDocument(document)}>
                            <Eye className="w-4 h-4 ml-2" />
                            عرض
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(document)}>
                            <Download className="w-4 h-4 ml-2" />
                            تحميل
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(document.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        leaseId={leaseId}
        vehicleId={vehicleId}
        onUploadComplete={() => {
          refreshDocuments();
          setUploadDialogOpen(false);
        }}
      />

      {/* Document Viewer */}
      {viewerDocument && (
        <DocumentViewer
          document={viewerDocument}
          open={!!viewerDocument}
          onOpenChange={() => setViewerDocument(null)}
        />
      )}
    </div>
  );
}