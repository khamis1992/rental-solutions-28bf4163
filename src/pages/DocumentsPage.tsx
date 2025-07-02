import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText } from 'lucide-react';
import DocumentList from '@/components/documents/DocumentList';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { DocumentCategory, DocumentType } from '@/types/document.types';
import { Card, CardContent } from '@/components/ui/card';

const DocumentsPage = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { language } = useLanguage();
  
  // Helper functions to translate categories and types
  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      'contract': 'عقد',
      'insurance': 'تأمين',
      'maintenance': 'صيانة',
      'identity': 'هوية',
      'financial': 'مالي',
      'legal': 'قانوني',
      'other': 'أخرى'
    };
    return labels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'agreement': 'اتفاقية',
      'insurance_policy': 'بوليصة تأمين',
      'maintenance_report': 'تقرير صيانة',
      'id_card': 'بطاقة هوية',
      'license': 'رخصة',
      'receipt': 'إيصال',
      'invoice': 'فاتورة',
      'legal_notice': 'إشعار قانوني',
      'other': 'أخرى'
    };
    return labels[type] || type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };
  
  return (
    <PageContainer>
      <PageHeader
        title="الوثائق"
        subtitle="رفع وعرض وإدارة الوثائق"
        icon={<FileText className="w-6 h-6 text-blue-500" />}
        align={language === 'ar' ? 'right' : 'left'}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      />
      
      <div className="mt-6 space-y-6" dir="rtl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/3 space-y-1">
                <Label htmlFor="category-filter" className="text-right">تصفية حسب الفئة</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفئات</SelectItem>
                    {Object.values(DocumentCategory).map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-1/3 space-y-1">
                <Label htmlFor="type-filter" className="text-right">تصفية حسب النوع</Label>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    {Object.values(DocumentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {getTypeLabel(type)}
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
