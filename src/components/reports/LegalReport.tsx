
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLegalDocuments, useComplianceItems } from '@/hooks/use-legal';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
          <h2 className="text-xl font-semibold">Legal Reports</h2>
          <p className="text-muted-foreground">
            Analyze legal compliance and case metrics
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance">Compliance Report</SelectItem>
              <SelectItem value="cases">Case Analysis</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {reportType === 'compliance' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Compliance Rate Over Time</CardTitle>
              <CardDescription>
                Monthly compliance and non-compliance percentages
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
                    <Bar dataKey="compliance" stackId="a" fill="#22c55e" name="Compliant %" />
                    <Bar dataKey="nonCompliance" stackId="a" fill="#ef4444" name="Non-Compliant %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Document Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">91%</span>
                  <Badge className="bg-green-100 text-green-800">+2.4%</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">54 documents expiring within 30 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Regulation Adherence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">87%</span>
                  <Badge className="bg-yellow-100 text-yellow-800">-1.2%</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">3 policy updates required</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Risk Exposure Index</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">Low</span>
                  <Badge className="bg-green-100 text-green-800">Improved</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">Last assessment: 7 days ago</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      {reportType === 'cases' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Legal Cases by Type</CardTitle>
              <CardDescription>
                Distribution of legal cases and their resolution status
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
                    <Bar dataKey="resolved" fill="#22c55e" name="Resolved" />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Average Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">14 days</span>
                  <Badge className="bg-green-100 text-green-800">-2 days</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">Improved from previous period</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Active Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">19</span>
                  <Badge className="bg-yellow-100 text-yellow-800">+3</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">5 high priority cases</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Case Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">76%</span>
                  <Badge className="bg-green-100 text-green-800">+4%</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-2">Based on last 50 closed cases</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default LegalReport;
