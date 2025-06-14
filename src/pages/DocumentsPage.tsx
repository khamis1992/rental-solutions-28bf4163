import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { FileText, Filter } from 'lucide-react';
import DocumentList from '@/components/documents/DocumentList';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DocumentCategory, DocumentType } from '@/types/document.types';
import { Card, CardContent } from '@/components/ui/card';

const DocumentsPage = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  return (
    <PageContainer
      title="Documents"
      description="Manage all documents in the system"
    >
      <SectionHeader
        title="Documents"
        description="Upload, view, and manage documents"
        icon={FileText}
      />
      
      <div className="mt-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/3 space-y-1">
                <Label htmlFor="category-filter">Filter by Category</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.values(DocumentCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-1/3 space-y-1">
                <Label htmlFor="type-filter">Filter by Type</Label>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.values(DocumentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <DocumentList 
          showUploadButton={true}
          showSearch={true}
          showFilters={false}
        />
      </div>
    </PageContainer>
  );
};

export default DocumentsPage;
