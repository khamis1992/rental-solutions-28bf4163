import React, { memo, useMemo } from 'react';
import MaintenanceTable from './MaintenanceTable';
import { MaintenanceRecord } from '@/hooks/use-maintenance';

interface OptimizedMaintenanceTableProps {
  records: MaintenanceRecord[];
  isLoading?: boolean;
  onEdit?: (record: MaintenanceRecord) => void;
  onDelete?: (id: string) => void;
}

// استخدام React.memo لمنع re-renders غير ضرورية
const OptimizedMaintenanceTable = memo<OptimizedMaintenanceTableProps>(({
  records,
  isLoading = false,
  onEdit,
  onDelete
}) => {
  // memoize records لمنع recreating array
  const memoizedRecords = useMemo(() => {
    return records || [];
  }, [records]);

  // memoize handlers لمنع recreation
  const memoizedOnEdit = useMemo(() => onEdit, [onEdit]);
  const memoizedOnDelete = useMemo(() => onDelete, [onDelete]);

  return (
    <MaintenanceTable
      records={memoizedRecords}
      isLoading={isLoading}
      onEdit={memoizedOnEdit}
      onDelete={memoizedOnDelete}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function لتحسين الأداء
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.records.length === nextProps.records.length &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    // مقارنة معرفات السجلات للتأكد من عدم تغييرها
    prevProps.records.every((record, index) => 
      record.id === nextProps.records[index]?.id &&
      record.status === nextProps.records[index]?.status
    )
  );
});

OptimizedMaintenanceTable.displayName = 'OptimizedMaintenanceTable';

export default OptimizedMaintenanceTable; 