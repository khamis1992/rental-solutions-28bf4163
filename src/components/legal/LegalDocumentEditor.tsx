
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, Save, X } from 'lucide-react';

interface LegalDocumentEditorProps {
  documentId?: string;
  initialData?: {
    title: string;
    content: string;
    type: string;
    category: string;
  };
  onClose: () => void;
  onSave: (data: any) => void;
}

const LegalDocumentEditor: React.FC<LegalDocumentEditorProps> = ({
  documentId,
  initialData,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [type, setType] = useState(initialData?.type || 'template');
  const [category, setCategory] = useState(initialData?.category || 'contracts');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a document title');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please enter document content');
      return;
    }

    setSaving(true);
    
    try {
      // Simulate saving to database
      await new Promise(resolve => setTimeout(resolve, 800));
      
      onSave({
        id: documentId || `new-${Date.now()}`,
        title,
        content,
        type,
        category,
        lastUpdated: new Date(),
        status: documentId ? 'active' : 'draft'
      });
      
      toast.success(documentId ? 'Document updated successfully' : 'Document created successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">
          {documentId ? 'Edit Document' : 'Create New Document'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title">Document Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="type">Document Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="guideline">Guideline</SelectItem>
                <SelectItem value="form">Form</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contracts">Contracts</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="reporting">Reporting</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="content">Document Content</Label>
          <div className="border rounded-md p-4 bg-gray-50">
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter document content"
              className="min-h-[300px]"
            />
          </div>
        </div>
        
        <div className="flex items-center text-amber-600 space-x-2 bg-amber-50 p-3 rounded border border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Document will be saved as a draft until published.</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <span className="animate-spin mr-2">⟳</span> Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Document
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LegalDocumentEditor;
