import React from 'react';
import { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFleetReport } from '@/hooks/use-fleet-report';
import { useFinancials } from '@/hooks/use-financials';
import { useCustomers } from '@/hooks/use-customers';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import ReportDownloadOptions from '@/components/reports/ReportDownloadOptions';
import AdvancedFilterPanel, { FilterOption, FilterGroup } from '@/components/reports/filters/AdvancedFilterPanel';
import InteractiveChart from '@/components/reports/charts/InteractiveChart';
import { Card, CardContent } from '@/components/ui/card';

const useDatasetData = () => {
  const { reportData } = useFleetReport();
  const fleet = reportData?.vehicles || [];
  const { transactions } = useFinancials();
  const financial = transactions || [];
  const { customers } = useCustomers();
  const customerList = customers || [];
  const { trafficFines } = useTrafficFines();
  const traffic = trafficFines || [];
  return { fleet, financial, customers: customerList, traffic } as Record<string, any[]>;
};

const ReportBuilder = () => {
  const [dataset, setDataset] = useState('fleet');
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState([]);

  const datasets = useDatasetData();

  const data = datasets[dataset] || [];

  const columns = Array.from(
    new Set(
      (data[0] ? Object.keys(data[0]) : []).concat(selectedColumns)
    )
  );

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const getFilterGroups = () => {
    switch (dataset) {
      case 'fleet':
        return [
          {
            id: 'status',
            name: 'Vehicle Status',
            options: [
              { id: 'available', label: 'Available', value: 'available' },
              { id: 'rented', label: 'Rented', value: 'rented' },
              { id: 'maintenance', label: 'Maintenance', value: 'maintenance' },
              { id: 'out_of_service', label: 'Out of Service', value: 'out_of_service' }
            ],
            type: 'select' as const
          },
          {
            id: 'vehicle_type',
            name: 'Vehicle Type',
            options: Array.from(new Set(data.map(v => v.vehicle_type)))
              .filter(Boolean)
              .map(type => ({ id: type, label: type, value: type })),
            type: 'select' as const
          },
          {
            id: 'purchase_date',
            name: 'Purchase Date',
            options: [],
            type: 'dateRange' as const
          }
        ];
      case 'financial':
        return [
          {
            id: 'transaction_type',
            name: 'Transaction Type',
            options: Array.from(new Set(data.map(t => t.transaction_type)))
              .filter(Boolean)
              .map(type => ({ id: type, label: type, value: type })),
            type: 'select' as const
          },
          {
            id: 'amount',
            name: 'Amount',
            options: [],
            type: 'number' as const
          },
          {
            id: 'date',
            name: 'Transaction Date',
            options: [],
            type: 'dateRange' as const
          }
        ];
      case 'customers':
        return [
          {
            id: 'status',
            name: 'Customer Status',
            options: Array.from(new Set(data.map(c => c.status)))
              .filter(Boolean)
              .map(status => ({ id: status, label: status, value: status })),
            type: 'select' as const
          },
          {
            id: 'created_at',
            name: 'Registration Date',
            options: [],
            type: 'dateRange' as const
          }
        ];
      case 'traffic':
        return [
          {
            id: 'paymentStatus',
            name: 'Payment Status',
            options: Array.from(new Set(data.map(f => f.paymentStatus)))
              .filter(Boolean)
              .map(status => ({ id: status, label: status, value: status })),
            type: 'select' as const
          },
          {
            id: 'violationDate',
            name: 'Violation Date',
            options: [],
            type: 'dateRange' as const
          },
          {
            id: 'fineAmount',
            name: 'Fine Amount',
            options: [],
            type: 'number' as const
          }
        ];
      default:
        return [];
    }
  };
  
  const applyFilters = (dataToFilter) => {
    if (filters.length === 0) return dataToFilter;
    
    return dataToFilter.filter(item => {
      return filters.every(filter => {
        const value = item[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greaterThan':
            return Number(value) > Number(filter.value);
          case 'lessThan':
            return Number(value) < Number(filter.value);
          case 'between':
            if (filter.value.from && filter.value.to) {
              const itemDate = new Date(value);
              const fromDate = new Date(filter.value.from);
              const toDate = new Date(filter.value.to);
              return itemDate >= fromDate && itemDate <= toDate;
            }
            return true;
          case 'in':
            return value === filter.value;
          default:
            return true;
        }
      });
    });
  };
  
  const handleApplyFilter = (filter) => {
    setFilters(prev => [...prev, filter]);
  };
  
  const handleRemoveFilter = (filterToRemove) => {
    setFilters(prev => prev.filter(filter => 
      filter.field !== filterToRemove.field || 
      filter.value !== filterToRemove.value
    ));
  };
  
  const handleClearFilters = () => {
    setFilters([]);
  };

  const getReportData = () => {
    if (!data) return [];
    
    const filteredData = applyFilters(data);
    
    if (selectedColumns.length === 0) return filteredData;
    
    return filteredData.map(item => {
      const obj = {};
      selectedColumns.forEach(col => {
        obj[col] = item[col];
      });
      return obj;
    });
  };

  return (
    <PageContainer
      title="Report Builder"
      description="Create custom reports from any dataset"
    >
      <div className="mb-4 space-y-4">
        <SectionHeader
          title="Select Dataset"
          description="Choose which dataset to build the report from"
        />
        <Select value={dataset} onValueChange={setDataset}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select dataset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fleet">Fleet</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="customers">Customers</SelectItem>
            <SelectItem value="traffic">Traffic Fines</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Add Advanced Filtering */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <AdvancedFilterPanel
              filterGroups={getFilterGroups()}
              appliedFilters={filters}
              onApplyFilter={handleApplyFilter}
              onRemoveFilter={handleRemoveFilter}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
        </Card>
      </div>

      {columns.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            title="Select Columns"
            description="Pick the fields to include in the report"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {columns.map(col => (
              <label key={col} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedColumns.includes(col)}
                  onCheckedChange={() => toggleColumn(col)}
                />
                <span className="text-sm capitalize">{col.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <ReportDownloadOptions reportType="custom" getReportData={getReportData} />
      </div>

      <div className="rounded-md border overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              {selectedColumns.length > 0 ?
                selectedColumns.map(col => (
                  <TableHead key={col}>{col}</TableHead>
                )) :
                columns.map(col => <TableHead key={col}>{col}</TableHead>)
              }
            </TableRow>
          </TableHeader>
          <TableBody>
            {getReportData().slice(0, 20).map((row, idx) => (
              <TableRow key={idx}>
                {(selectedColumns.length > 0 ? selectedColumns : columns).map(col => (
                  <TableCell key={col}>{(row as any)[col]?.toString() || ''}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
};

export default ReportBuilder;
