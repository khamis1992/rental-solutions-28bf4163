
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { saveAs } from 'file-saver';
import { generatePDF, generateExcel, generateCSV, isRTL } from '@/utils/report-utils';
import { Loader2, FileText, Download } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import * as XLSX from 'xlsx';

interface ReportGeneratorProps {
  title: string;
  reportTypes: { value: string; label: string }[];
  fetchReportData: (type: string, dateRange: DateRange | undefined) => Promise<any[]>;
  columns: { field: string; header: string }[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  title,
  reportTypes,
  fetchReportData,
  columns
}) => {
  const [reportType, setReportType] = useState<string>(reportTypes[0]?.value || '');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { t, translations } = useTranslation();

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      // Fetch report data
      const data = await fetchReportData(reportType, dateRange);
      
      if (!data || data.length === 0) {
        console.error("No data available for report");
        // TODO: Show error toast
        setIsGenerating(false);
        return;
      }
      
      // Format filename with current date
      const date = new Date();
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const filename = `${title.replace(/\s+/g, '_')}_${reportType}_${dateString}`;
      
      // Generate report based on selected format
      if (format === 'pdf') {
        const doc = generatePDF(title, data, columns, translations);
        doc.save(`${filename}.pdf`);
      } else if (format === 'excel') {
        const workbook = generateExcel(title, data, columns, translations);
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${filename}.xlsx`);
      } else if (format === 'csv') {
        const csvContent = generateCSV(data, columns, translations);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, `${filename}.csv`);
      }
      
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating report:", error);
      setIsGenerating(false);
      // TODO: Show error toast
    }
  };

  return (
    <Card className={isRTL() ? 'rtl text-right' : ''}>
      <CardHeader>
        <CardTitle>{t(`reports.${title}`)}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reportType">{t('reports.reportOptions')}</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger id="reportType">
                <SelectValue placeholder={t('reports.selectReportType')} />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {t(type.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateRange">{t('reports.dateRange')}</Label>
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="format">{t('reports.format')}</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger id="format">
                <SelectValue placeholder={t('reports.selectFormat')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating} 
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('reports.generating')}
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {t('reports.generateReport')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
