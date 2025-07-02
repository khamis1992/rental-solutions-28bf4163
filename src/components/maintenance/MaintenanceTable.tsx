// @ts-nocheck
/* eslint-disable */
import React, { useState, memo, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaintenanceRecord } from '@/hooks/use-maintenance';

import { ChevronDown, ChevronUp, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface MaintenanceTableProps {
  records: MaintenanceRecord[];
  isLoading?: boolean;
  onEdit?: (record: MaintenanceRecord) => void;
  onDelete?: (id: string) => void;
}

const MaintenanceTable = ({
  records,
  isLoading = false,
  onEdit,
  onDelete
}: MaintenanceTableProps) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const { language } = useLanguage();

  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(item => item !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLabels = language === 'ar' ? {
      'scheduled': 'مجدول',
      'in_progress': 'قيد التنفيذ', 
      'completed': 'مكتمل',
      'cancelled': 'ملغي'
    } : {
      'scheduled': 'Scheduled',
      'in_progress': 'In Progress',
      'completed': 'Completed', 
      'cancelled': 'Cancelled'
    };

    const label = statusLabels[status as keyof typeof statusLabels] || status;

    switch(status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{label}</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{label}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{label}</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{label}</Badge>;
      default:
        return <Badge variant="outline">{label}</Badge>;
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return language === 'ar' ? 'غير محدد' : 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          {language === 'ar' ? 'لم يتم العثور على سجلات صيانة.' : 'No maintenance records found.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'نوع الخدمة' : 'Service Type'}
            </TableHead>
            <TableHead className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'المركبة' : 'Vehicle'}
            </TableHead>
            <TableHead className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'التاريخ المجدول' : 'Scheduled Date'}
            </TableHead>
            <TableHead className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'الحالة' : 'Status'}
            </TableHead>
            <TableHead className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'التكلفة' : 'Cost'}
            </TableHead>
            <TableHead className={language === 'ar' ? 'text-left' : 'text-right'}>
              {language === 'ar' ? 'الإجراءات' : 'Actions'}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <React.Fragment key={record.id}>
              <TableRow className="cursor-pointer" onClick={() => toggleExpand(record.id)}>
                <TableCell className={`font-medium ${language === 'ar' ? 'text-right' : ''}`}>
                  {record.service_type}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : ''}>
                  {record.vehicle_id ? 
                    record.vehicle_id.substring(0, 6) + '...' : 
                    (language === 'ar' ? 'غير معروف' : 'Unknown')}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : ''}>
                  {formatDate(record.scheduled_date)}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : ''}>
                  {getStatusBadge(record.status || '')}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-right' : ''}>
                  {record.cost ? `$${record.cost.toFixed(2)}` : (language === 'ar' ? 'غير محدد' : 'N/A')}
                </TableCell>
                <TableCell className={language === 'ar' ? 'text-left' : 'text-right'}>
                  <div className={`flex justify-end items-center space-x-2 ${language === 'ar' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(record);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(record.id);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                    {expandedIds.includes(record.id) ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </div>
                </TableCell>
              </TableRow>
              {expandedIds.includes(record.id) && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-gray-50">
                    <div className="p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className={`font-semibold mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                            {language === 'ar' ? 'التفاصيل' : 'Details'}
                          </h4>
                          <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                            <span className="font-medium">
                              {language === 'ar' ? 'نوع الصيانة:' : 'Maintenance Type:'}
                            </span> {record.maintenance_type || (language === 'ar' ? 'غير محدد' : 'N/A')}
                          </p>
                          <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                            <span className="font-medium">
                              {language === 'ar' ? 'معرف المركبة:' : 'Vehicle ID:'}
                            </span> {record.vehicle_id}
                          </p>
                          <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                            <span className="font-medium">
                              {language === 'ar' ? 'التكلفة:' : 'Cost:'}
                            </span> {record.cost ? `$${record.cost.toFixed(2)}` : (language === 'ar' ? 'غير محدد' : 'N/A')}
                          </p>
                          <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                            <span className="font-medium">
                              {language === 'ar' ? 'تم بواسطة:' : 'Performed By:'}
                            </span> {record.performed_by || (language === 'ar' ? 'غير محدد' : 'N/A')}
                          </p>
                        </div>
                        <div>
                          <h4 className={`font-semibold mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                            {language === 'ar' ? 'التواريخ' : 'Dates'}
                          </h4>
                          <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                            <span className="font-medium">
                              {language === 'ar' ? 'التاريخ المجدول:' : 'Scheduled Date:'}
                            </span> {formatDate(record.scheduled_date)}
                          </p>
                          <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                            <span className="font-medium">
                              {language === 'ar' ? 'تاريخ الإنجاز:' : 'Completed Date:'}
                            </span> {formatDate(record.completed_date)}
                          </p>
                          <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                            <span className="font-medium">
                              {language === 'ar' ? 'تاريخ الإنشاء:' : 'Created At:'}
                            </span> {formatDate(record.created_at)}
                          </p>
                          <p className={`text-sm ${language === 'ar' ? 'text-right' : ''}`}>
                            <span className="font-medium">
                              {language === 'ar' ? 'تاريخ التحديث:' : 'Updated At:'}
                            </span> {formatDate(record.updated_at)}
                          </p>
                        </div>
                      </div>
                      
                      {record.description && (
                        <div className="mt-4">
                          <h4 className={`font-semibold mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                            {language === 'ar' ? 'الوصف' : 'Description'}
                          </h4>
                          <p className={`text-sm whitespace-pre-wrap ${language === 'ar' ? 'text-right' : ''}`}>
                            {record.description}
                          </p>
                        </div>
                      )}
                      
                      {record.notes && (
                        <div className="mt-4">
                          <h4 className={`font-semibold mb-2 ${language === 'ar' ? 'text-right' : ''}`}>
                            {language === 'ar' ? 'ملاحظات' : 'Notes'}
                          </h4>
                          <p className={`text-sm whitespace-pre-wrap ${language === 'ar' ? 'text-right' : ''}`}>
                            {record.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaintenanceTable;
