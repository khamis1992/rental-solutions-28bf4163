// @ts-nocheck
/* eslint-disable */


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ArabicTableColumn<T = any> {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: 'right' | 'left' | 'center';
}

export interface ArabicTableAction<T = any> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: T) => void;
  disabled?: (record: T) => boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface ArabicDataTableProps<T = any> {
  data: T[];
  columns: ArabicTableColumn<T>[];
  actions?: ArabicTableAction<T>[];
  loading?: boolean;
  title?: string;
  description?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T) => void;
  className?: string;
  emptyText?: string;
  showHeader?: boolean;
}

export const ArabicDataTable = <T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  title,
  description,
  searchable = true,
  searchPlaceholder = 'البحث...',
  filterable = false,
  exportable = false,
  refreshable = false,
  onRefresh,
  onExport,
  pagination,
  rowKey = 'id',
  onRowClick,
  className,
  emptyText = 'لا توجد بيانات',
  showHeader = true,
}: ArabicDataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortColumn, setSortColumn] = React.useState<string>('');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(record =>
      columns.some(column => {
        const value = record[column.key];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  const renderCell = (column: ArabicTableColumn<T>, record: T, index: number) => {
    const value = record[column.key];
    
    if (column.render) {
      return column.render(value, record, index);
    }
    
    return value;
  };

  const renderActions = (record: T) => {
    if (actions.length === 0) return null;
    
    if (actions.length === 1) {
      const action = actions[0];
      return (
        <Button
          size="sm"
          variant={action.variant || 'outline'}
          onClick={() => action.onClick(record)}
          disabled={action.disabled?.(record)}
          className="h-8"
        >
          {action.icon}
          {action.label}
        </Button>
      );
    }
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action.key}
              onClick={() => action.onClick(record)}
              disabled={action.disabled?.(record)}
              className="flex items-center gap-2"
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Card className={cn('w-full', className)} dir="rtl">
      {showHeader && (title || description || searchable || filterable || exportable || refreshable) && (
        <CardHeader>
          <div className="flex flex-col gap-4">
            {(title || description) && (
              <div className="text-right">
                {title && <CardTitle>{title}</CardTitle>}
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-2 order-2 sm:order-1">
                {refreshable && onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={loading}
                  >
                    <RefreshCw className={cn('h-4 w-4 ml-2', loading && 'animate-spin')} />
                    تحديث
                  </Button>
                )}
                
                {filterable && (
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 ml-2" />
                    تصفية
                  </Button>
                )}
                
                {exportable && onExport && (
                  <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="h-4 w-4 ml-2" />
                    تصدير
                  </Button>
                )}
              </div>
              
              {searchable && (
                <div className="relative w-full sm:w-auto order-1 sm:order-2">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 text-right w-full sm:w-64"
                  />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-right font-medium text-sm',
                      column.width && `w-${column.width}`,
                      column.sortable && 'cursor-pointer hover:bg-muted/80',
                      column.align === 'center' && 'text-center',
                      column.align === 'left' && 'text-left'
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {column.title}
                      {column.sortable && sortColumn === column.key && (
                        <span className="text-xs">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="px-4 py-3 text-right font-medium text-sm w-24">
                    الإجراءات
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      جاري التحميل...
                    </div>
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                sortedData.map((record, index) => (
                  <tr
                    key={getRowKey(record, index)}
                    className={cn(
                      'border-b hover:bg-muted/50 transition-colors',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(record)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3 text-sm text-right',
                          column.align === 'center' && 'text-center',
                          column.align === 'left' && 'text-left'
                        )}
                      >
                        {renderCell(column, record, index)}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className="px-4 py-3 text-right">
                        {renderActions(record)}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {pagination && (
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>عرض</span>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => pagination.onChange(1, parseInt(value))}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>من {pagination.total} عنصر</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onChange(1, pagination.pageSize)}
                disabled={pagination.current === 1}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
                disabled={pagination.current === 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <span className="text-sm text-muted-foreground px-2">
                صفحة {pagination.current} من {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pagination.onChange(Math.ceil(pagination.total / pagination.pageSize), pagination.pageSize)}
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 