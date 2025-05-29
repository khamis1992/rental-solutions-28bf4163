
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
    if (confirm('Are you sure you want to delete this document?')) {
      await deleteDocument.mutateAsync(document.id);
    }
  };
  
  const handleView = (document: Document) => {
    setSelectedDocument(document);
    setIsViewerOpen(true);
  };
  
  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                {showSearch && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              {showUploadButton && (
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  Upload Document
                </Button>
              )}
            </div>
            
            <div className={`overflow-auto ${maxHeight ? `max-h-[${maxHeight}]` : ''}`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                    <TableHead>Status</TableHead>
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
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div>
                              <div>{doc.title}</div>
                              <div className="text-xs text-muted-foreground">{doc.file_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize">
                          {doc.type.split('_').join(' ')}
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize">
                          {doc.category}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDate(new Date(doc.created_at))}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              doc.status === 'active' ? 'default' : 
                              doc.status === 'draft' ? 'outline' : 
                              doc.status === 'archived' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {doc.status}
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
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(doc)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No documents found.
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
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
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
        <DialogContent className="sm:max-w-md md:max-w-4xl lg:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
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
