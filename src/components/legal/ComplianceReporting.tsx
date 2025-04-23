
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  FileText, 
  AlertTriangle, 
  DownloadCloud, 
  Calendar, 
  CheckCircle2,
  XCircle
} from 'lucide-react';

// Sample compliance report data
const complianceData = [
  { name: 'Vehicle Registration', compliant: 35, nonCompliant: 2 },
  { name: 'Driver License', compliant: 28, nonCompliant: 9 },
  { name: 'Insurance', compliant: 31, nonCompliant: 6 },
  { name: 'Tax Documents', compliant: 36, nonCompliant: 1 },
  { name: 'Maintenance Logs', compliant: 25, nonCompliant: 12 },
];

const statusData = [
  { name: 'Compliant', value: 155 },
  { name: 'Non-Compliant', value: 30 },
  { name: 'Expiring Soon', value: 15 },
];

// Colors for charts
const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1'];

const ComplianceReporting = () => {
  return (
    <div className="space-y-6">
      {/* Compliance Status Overview */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-semibold">Compliance Status Overview</CardTitle>
              <CardDescription>Summary of regulatory compliance across the fleet</CardDescription>
            </div>
            <Button variant="outline" className="flex items-center">
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
              <div>
                <p className="text-sm font-medium text-green-600">Compliant</p>
                <h3 className="text-2xl font-bold text-green-700">82%</h3>
                <p className="text-xs text-green-500">155 documents</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
              <div>
                <p className="text-sm font-medium text-red-600">Non-Compliant</p>
                <h3 className="text-2xl font-bold text-red-700">16%</h3>
                <p className="text-xs text-red-500">30 documents</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50">
              <div>
                <p className="text-sm font-medium text-amber-600">Expiring Soon</p>
                <h3 className="text-2xl font-bold text-amber-700">8%</h3>
                <p className="text-xs text-amber-500">15 documents</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Compliance by Document Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={complianceData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="compliant" name="Compliant" fill="#10b981" />
                      <Bar dataKey="nonCompliant" name="Non-Compliant" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Pie Chart */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Overall Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Urgent Compliance Issues */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Urgent Compliance Issues</CardTitle>
          <CardDescription>Items that require immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Insurance Expiration</AlertTitle>
            <AlertDescription>
              3 vehicles have insurance policies expiring within the next 7 days.
              <div className="mt-2">
                <Button variant="outline" size="sm" className="bg-white">View Affected Vehicles</Button>
              </div>
            </AlertDescription>
          </Alert>
          
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Registration Renewal</AlertTitle>
            <AlertDescription>
              5 vehicles require registration renewal within the next 14 days.
              <div className="mt-2">
                <Button variant="outline" size="sm" className="bg-white">View Affected Vehicles</Button>
              </div>
            </AlertDescription>
          </Alert>
          
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertTitle>Document Updates Required</AlertTitle>
            <AlertDescription>
              12 documents need to be updated to meet current regulatory requirements.
              <div className="mt-2">
                <Button variant="outline" size="sm">View Document List</Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      {/* Upcoming Compliance Calendar */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Upcoming Compliance Deadlines</CardTitle>
          <CardDescription>Calendar of upcoming regulatory deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium">Annual Tax Filing</p>
                  <p className="text-sm text-muted-foreground">Due in 5 days</p>
                </div>
              </div>
              <Badge variant="destructive">Urgent</Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">Vehicle Inspection Certification</p>
                  <p className="text-sm text-muted-foreground">Due in 14 days</p>
                </div>
              </div>
              <Badge variant="warning">Important</Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Driver License Updates</p>
                  <p className="text-sm text-muted-foreground">Due in 30 days</p>
                </div>
              </div>
              <Badge variant="outline">Standard</Badge>
            </div>
          </div>
          
          <Button variant="outline" className="mt-4 w-full">
            View Full Compliance Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceReporting;
