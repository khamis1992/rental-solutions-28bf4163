import React, { useState } from 'react';
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
  const [dataset, setDataset] = useState<string>('fleet');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

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

  const getReportData = () => {
    if (!data) return [];
    if (selectedColumns.length === 0) return data;
    return data.map(item => {
      const obj: Record<string, any> = {};
      selectedColumns.forEach(col => {
        obj[col] = (item as any)[col];
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
