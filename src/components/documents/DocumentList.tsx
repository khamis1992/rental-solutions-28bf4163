import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Download, 
  Trash2, 
  Edit, 
  Eye, 
  Search,
  FileText,
  Loader2
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useDocumentsEnhanced } from '@/hooks/use-documents-enhanced';
import { Document, DocumentEntityType } from '@/types/document.types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import DocumentUpload from './DocumentUpload';
import DocumentViewer from './DocumentViewer';
import { Card, CardContent } from '@/components/ui/card';

export interface DocumentListProps {
  entityType?: DocumentEntityType;
  entityId?: string;
  showUploadButton?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({
  entityType,
  entityId,
  showUploadButton = true,
  showSearch = true,
  showFilters = true,
  maxHeight
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  const { 
    documents,
    isLoading,
    downloadDocumentFile,
    isDownloading,
    deleteDocument
  } = useDocumentsEnhanced({
    entityType,
    entityId
  });
  
  const filteredDocuments = documents?.filter(doc => 
    searchQuery === '' || 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDownload = (document: Document) => {
    downloadDocumentFile(document);
  };
  
  const handleDelete = async (document: Document) => {
    if (confirm('هل أنت متأكد من حذف هذه الوثيقة؟')) {
      await deleteDocument.mutateAsync(document.id);
    }
  };
  
  const handleView = (document: Document) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
  };

  // Helper function to translate document status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'draft': return 'مسودة';
      case 'archived': return 'مؤرشف';
      default: return 'غير معروف';
    }
  };

  // Helper function to translate document type
  const getTypeLabel = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <>
      <Card dir="rtl">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                {showSearch && (
                  <div className="relative">
                    <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في الوثائق..."
                      className="pr-8 text-right"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              {showUploadButton && (
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  رفع وثيقة
                </Button>
              )}
            </div>
            
            <div className="rounded-md border" style={{ maxHeight }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الوثيقة</TableHead>
                    <TableHead className="hidden md:table-cell text-right">النوع</TableHead>
                    <TableHead className="hidden md:table-cell text-right">الفئة</TableHead>
                    <TableHead className="hidden md:table-cell text-right">تاريخ الرفع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDocuments && filteredDocuments.length > 0 ? (
                    filteredDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center flex-row-reverse">
                            <FileText className="ml-2 h-4 w-4 text-muted-foreground" />
                            <div className="text-right">
                              <div>{doc.title}</div>
                              <div className="text-xs text-muted-foreground">{doc.file_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize text-right">
                          {getTypeLabel(doc.type)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize text-right">
                          {doc.category}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-right">
                          {formatDate(new Date(doc.created_at))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={
                              doc.status === 'active' ? 'default' : 
                              doc.status === 'draft' ? 'outline' : 
                              doc.status === 'archived' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {getStatusLabel(doc.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(doc)}>
                                <Eye className="ml-2 h-4 w-4" /> عرض
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="ml-2 h-4 w-4" /> تحميل
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(doc)}>
                                <Trash2 className="ml-2 h-4 w-4" /> حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        لم يتم العثور على وثائق.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">رفع وثيقة</DialogTitle>
          </DialogHeader>
          <DocumentUpload
            entityType={entityType}
            entityId={entityId}
            onComplete={() => setIsUploadDialogOpen(false)}
            onCancel={() => setIsUploadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Document Viewer */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="sm:max-w-md md:max-w-4xl lg:max-w-6xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <DocumentViewer
              document={selectedDocument}
              onClose={() => setIsViewerOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentList;
