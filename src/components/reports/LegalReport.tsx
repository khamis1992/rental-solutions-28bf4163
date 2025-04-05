
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLegalDocuments, useComplianceItems } from '@/hooks/use-legal';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

// Mock data - in production, this would come from the use-legal hook
const MOCK_COMPLIANCE_DATA = [
  { month: 'Jan', compliance: 92, nonCompliance: 8 },
  { month: 'Feb', compliance: 88, nonCompliance: 12 },
  { month: 'Mar', compliance: 95, nonCompliance: 5 },
  { month: 'Apr', compliance: 90, nonCompliance: 10 },
  { month: 'May', compliance: 85, nonCompliance: 15 },
  { month: 'Jun', compliance: 93, nonCompliance: 7 },
];

const MOCK_CASE_DATA = [
  { name: 'Contract Disputes', count: 12, resolved: 8, pending: 4 },
  { name: 'Document Violations', count: 7, resolved: 5, pending: 2 },
  { name: 'Insurance Claims', count: 15, resolved: 9, pending: 6 },
  { name: 'Customer Complaints', count: 10, resolved: 7, pending: 3 },
  { name: 'Traffic Violations', count: 18, resolved: 14, pending: 4 }
];

const LegalReport = () => {
  const [reportType, setReportType] = useState('compliance');
  const [timeRange, setTimeRange] = useState('6months');
  const { documents, loading: docsLoading } = useLegalDocuments();
  const { items, loading: itemsLoading } = useComplianceItems();
  const isLoading = docsLoading || itemsLoading;
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[300px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">{t('legal.reports')}</h2>
          <p className="text-muted-foreground">
            {t('legal.reportsDescription')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('legal.reportType')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance">{t('legal.complianceReport')}</SelectItem>
              <SelectItem value="cases">{t('legal.caseAnalysis')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('legal.timeRange')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">{t('legal.last3Months')}</SelectItem>
              <SelectItem value="6months">{t('legal.last6Months')}</SelectItem>
              <SelectItem value="1year">{t('legal.lastYear')}</SelectItem>
              <SelectItem value="all">{t('legal.allTime')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {reportType === 'compliance' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('legal.complianceRateOverTime')}</CardTitle>
              <CardDescription>
                {t('legal.monthlyCompliance')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={MOCK_COMPLIANCE_DATA}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="compliance" stackId="a" fill="#22c55e" name={t('legal.compliantPercentage')} />
                    <Bar dataKey="nonCompliance" stackId="a" fill="#ef4444" name={t('legal.nonCompliantPercentage')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('legal.documentCompliance')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">91%</span>
                  <Badge className="bg-green-100 text-green-800">+2.4%</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{t('legal.documentExpiryWarning')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('legal.regulationAdherence')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">87%</span>
                  <Badge className="bg-yellow-100 text-yellow-800">-1.2%</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{t('legal.policyUpdatesNeeded')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('legal.riskExposureIndex')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{t('legal.low')}</span>
                  <Badge className="bg-green-100 text-green-800">{t('legal.improved')}</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{t('legal.lastAssessment')}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      {reportType === 'cases' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('legal.casesByType')}</CardTitle>
              <CardDescription>
                {t('legal.caseDistribution')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={MOCK_CASE_DATA}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="resolved" fill="#22c55e" name={t('legal.resolved')} />
                    <Bar dataKey="pending" fill="#f59e0b" name={t('legal.pending')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('legal.averageResolutionTime')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">14 {t('common.days')}</span>
                  <Badge className="bg-green-100 text-green-800">-2 {t('common.days')}</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{t('legal.improvedFromPrevious')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('legal.activeCases')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">19</span>
                  <Badge className="bg-yellow-100 text-yellow-800">+3</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{t('legal.highPriorityCases')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{t('legal.caseSuccessRate')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">76%</span>
                  <Badge className="bg-green-100 text-green-800">+4%</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">{t('legal.basedOnClosed')}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default LegalReport;
