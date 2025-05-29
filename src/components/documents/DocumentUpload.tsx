
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentsEnhanced } from '@/hooks/use-documents-enhanced';
import { 
  DocumentCategory, 
  DocumentType,
  DocumentEntityType,
  CreateDocumentRequest 
} from '@/types/document.types';

export interface DocumentUploadProps {
  entityType?: DocumentEntityType;
  entityId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  entityType,
  entityId,
  onComplete,
  onCancel
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>(DocumentCategory.OTHER);
  const [type, setType] = useState<DocumentType>(DocumentType.OTHER);
  const [file, setFile] = useState<File | null>(null);
  
  const { createDocument } = useDocumentsEnhanced();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      
      if (!title) {
        setTitle(acceptedFiles[0].name.split('.')[0]);
      }
    }
  }, [title]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 20971520, // 20MB
  });
  
  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (!title) {
      toast.error('Please enter a title for the document');
      return;
    }
    
    const request: CreateDocumentRequest = {
      title,
      description: description || undefined,
      file,
      category,
      type,
      entity_type: entityType,
      entity_id: entityId
    };
    
    try {
      await createDocument.mutateAsync(request);
      
      setTitle('');
      setDescription('');
      setCategory(DocumentCategory.OTHER);
      setType(DocumentType.OTHER);
      setFile(null);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter document description"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as DocumentCategory)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DocumentCategory).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Document Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as DocumentType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(DocumentType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>File</Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            {!file ? (
              <div className="flex flex-col items-center justify-center text-center">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, XLSX, JPG, PNG (MAX. 20MB)
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                <div className="flex items-center space-x-3">
                  <File className="h-8 w-8 text-primary" />
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={createDocument.isPending || !file || !title}
        >
          {createDocument.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Document'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentUpload;
