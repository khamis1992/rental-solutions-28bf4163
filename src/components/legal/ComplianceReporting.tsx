
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, LineChart, PieChart } from 'recharts';
import { 
  Bar, 
  Line, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart4, 
  FileText, 
  Download, 
  Share2, 
  Printer, 
  Calendar 
} from 'lucide-react';

// Mock compliance metrics data
const COMPLIANCE_METRICS = {
  byCategory: [
    { name: 'Vehicle Inspection', compliant: 85, nonCompliant: 15 },
    { name: 'Driver Licenses', compliant: 92, nonCompliant: 8 },
    { name: 'Insurance', compliant: 100, nonCompliant: 0 },
    { name: 'Maintenance', compliant: 78, nonCompliant: 22 },
    { name: 'Permits', compliant: 88, nonCompliant: 12 }
  ],
  monthlyTrend: [
    { name: 'Jan', compliance: 82 },
    { name: 'Feb', compliance: 84 },
    { name: 'Mar', compliance: 86 },
    { name: 'Apr', compliance: 88 },
    { name: 'May', compliance: 81 },
    { name: 'Jun', compliance: 85 },
    { name: 'Jul', compliance: 90 },
    { name: 'Aug', compliance: 92 },
    { name: 'Sep', compliance: 94 },
    { name: 'Oct', compliance: 88 },
  ],
  documentStatus: [
    { name: 'Valid', value: 76 },
    { name: 'Expiring Soon', value: 14 },
    { name: 'Expired', value: 7 },
    { name: 'Missing', value: 3 }
  ]
};

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6366f1'];

const ComplianceReporting = () => {
  const [reportPeriod, setReportPeriod] = useState('lastQuarter');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Compliance Reports</h2>
          <p className="text-muted-foreground">Review compliance metrics and generate reports</p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <Select value={reportPeriod} onValueChange={setReportPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="lastQuarter">Last Quarter</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="charts">
        <TabsList>
          <TabsTrigger value="charts" className="flex items-center space-x-2">
            <BarChart4 className="h-4 w-4" />
            <span>Charts</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Reports</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Schedule</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance by Category</CardTitle>
                <CardDescription>
                  Percentage of compliance across different categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={COMPLIANCE_METRICS.byCategory}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="compliant" stackId="a" fill="#22c55e" name="Compliant" />
                      <Bar dataKey="nonCompliant" stackId="a" fill="#ef4444" name="Non-Compliant" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Compliance Trend</CardTitle>
                <CardDescription>
                  Overall compliance percentage over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={COMPLIANCE_METRICS.monthlyTrend}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[60, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="compliance" 
                        stroke="#3b82f6" 
                        activeDot={{ r: 8 }} 
                        name="Compliance %"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Document Status Distribution</CardTitle>
                <CardDescription>
                  Current status of all compliance documents
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-80 w-full max-w-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={COMPLIANCE_METRICS.documentStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {COMPLIANCE_METRICS.documentStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardFooter className="flex justify-end space-x-2 pt-6">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
              <Button size="sm" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download Report</span>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>
                Select a report to generate or download
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Compliance Summary', description: 'Overview of all compliance metrics', type: 'PDF' },
                    { title: 'Regulatory Documentation', description: 'Status of all regulatory documents', type: 'Excel' },
                    { title: 'Driver Compliance', description: 'Driver license and certification compliance', type: 'PDF' },
                    { title: 'Vehicle Compliance', description: 'Vehicle inspection and registration compliance', type: 'Excel' },
                    { title: 'Non-Compliance Report', description: 'Detailed report of all non-compliant items', type: 'PDF' },
                    { title: 'Upcoming Renewals', description: 'Documents requiring renewal in next 30 days', type: 'PDF' }
                  ].map((report, index) => (
                    <Card key={index} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{report.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 flex-grow">
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <div className="w-full flex justify-between items-center">
                          <Badge variant="outline">{report.type}</Badge>
                          <Button size="sm">Generate</Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Configure automatic report generation and delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Set up automated compliance reports to be delivered to specified recipients on a regular schedule.
                </p>
                
                {/* Implementation of scheduled reports would go here */}
                <div className="p-12 text-center text-muted-foreground border border-dashed rounded-md">
                  Report scheduling functionality coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceReporting;
