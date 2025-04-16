
import React, { useState, useEffect } from 'react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Calendar, 
  Car, 
  Download, 
  FileText, 
  Filter, 
  Printer, 
  UserCheck, 
  Loader2, 
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
  Cell,
} from 'recharts';

// Define chart colors
const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const TrafficFineReport = () => {
  const { trafficFines, isLoading, cleanupInvalidAssignments } = useTrafficFines();
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'month' | 'status' | 'customerName'>('month');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [showInvalidDates, setShowInvalidDates] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'charts'>('cards');

  // Ensure we have data to process even when trafficFines is undefined
  const [finesData, setFinesData] = useState<any[]>([]);

  // Pull in and format the data
  useEffect(() => {
    if (trafficFines) {
      console.log("Traffic fines data loaded in report component:", trafficFines.length);
      setFinesData(trafficFines);
    } else {
      console.log("No traffic fines data available in report component");
      setFinesData([]);
    }
  }, [trafficFines]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading traffic fines data...</p>
        </div>
      </div>
    );
  }

  // Validate if the fine occurred within the lease period
  const isValidFine = (fine: any) => {
    if (!fine.leaseId) return false;
    
    // Check if the fine has a violation date and the assigned lease has start/end dates
    if (!fine.violationDate || !fine.leaseStartDate) return false;
    
    const violationDate = new Date(fine.violationDate);
    const leaseStartDate = new Date(fine.leaseStartDate);
    const leaseEndDate = fine.leaseEndDate ? new Date(fine.leaseEndDate) : new Date();
    
    return violationDate >= leaseStartDate && violationDate <= leaseEndDate;
  };

  // Filter and process the traffic fines data
  const filteredFines = finesData.filter(fine => 
    ((fine.licensePlate?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (fine.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (fine.violationNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  );
  
  // Split fines into valid and invalid assignments
  const validFines = filteredFines.filter(fine => !fine.customerId || isValidFine(fine));
  const invalidAssignedFines = filteredFines.filter(fine => fine.customerId && !isValidFine(fine));

  // Display fines based on validity filter
  const finesToDisplay = showInvalidDates ? filteredFines : validFines;

  // Calculate summary metrics
  const totalFines = finesToDisplay.length;
  const totalAmount = finesToDisplay.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const assignedFines = finesToDisplay.filter(fine => fine.customerId).length;
  const unassignedFines = finesToDisplay.filter(fine => !fine.customerId).length;

  // Handle cleanup of invalid assignments
  const handleCleanupInvalidAssignments = async () => {
    try {
      setIsCleaningUp(true);
      await cleanupInvalidAssignments.mutateAsync();
    } catch (error) {
      console.error("Error cleaning up invalid assignments:", error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Group fines by selected criteria
  const groupFines = () => {
    const groups: Record<string, any[]> = {};

    finesToDisplay.forEach(fine => {
      let groupKey = '';
      
      if (groupBy === 'month') {
        if (!fine.violationDate) {
          groupKey = 'Unknown Date';
        } else {
          const date = new Date(fine.violationDate);
          groupKey = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        }
      } else if (groupBy === 'status') {
        groupKey = fine.paymentStatus?.charAt(0).toUpperCase() + fine.paymentStatus?.slice(1) || 'Unknown';
      } else if (groupBy === 'customerName') {
        groupKey = fine.customerName || 'Unassigned';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(fine);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, fines]) => ({
        name: key,
        fines,
        totalAmount: fines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0),
        count: fines.length
      }));
  };

  const groupedFines = groupFines();

  // Toggle group expansion
  const toggleGroup = (name: string) => {
    if (expandedGroups.includes(name)) {
      setExpandedGroups(expandedGroups.filter(g => g !== name));
    } else {
      setExpandedGroups([...expandedGroups, name]);
    }
  };

  // Generate chart data
  const generateChartData = () => {
    if (groupBy === 'month') {
      return groupedFines.map(group => ({
        name: group.name,
        amount: group.totalAmount,
        count: group.count
      }));
    } else if (groupBy === 'status') {
      return groupedFines.map(group => ({
        name: group.name,
        value: group.count
      }));
    } else {
      // Customer grouping
      return groupedFines
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10)
        .map(group => ({
          name: group.name.length > 15 ? `${group.name.substring(0, 15)}...` : group.name,
          amount: group.totalAmount
        }));
    }
  };

  const chartData = generateChartData();

  // Helper to handle print action
  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  // Helper to handle export action
  const handleExport = () => {
    // Would implement actual export logic (CSV, Excel, etc.) here
    toast.success("Export feature would trigger here");
  };

  return (
    <div className="space-y-6 print:mx-6 print:my-6">
      {/* Report Header with Summary Information */}
      <div className="flex flex-col gap-4 print:hidden">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white hover:bg-gray-50 transition-colors">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fines</p>
                <h3 className="text-2xl font-bold mt-1">{totalFines}</h3>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-80" />
            </CardContent>
          </Card>
          <Card className="bg-white hover:bg-gray-50 transition-colors">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
          <Card className="bg-white hover:bg-gray-50 transition-colors">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned Fines</p>
                <h3 className="text-2xl font-bold mt-1">{assignedFines}</h3>
              </div>
              <UserCheck className="h-8 w-8 text-blue-500 opacity-80" />
            </CardContent>
          </Card>
          <Card className="bg-white hover:bg-gray-50 transition-colors">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unassigned Fines</p>
                <h3 className="text-2xl font-bold mt-1">{unassignedFines}</h3>
              </div>
              <Car className="h-8 w-8 text-gray-500 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            <Input
              type="text"
              placeholder="Search by license plate, customer name or violation number..."
              className="w-full md:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <div className="flex flex-col md:flex-row gap-2 md:items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm whitespace-nowrap">Group by:</label>
                <Select 
                  value={groupBy} 
                  onValueChange={(value) => setGroupBy(value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Group by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="status">Payment Status</SelectItem>
                    <SelectItem value="customerName">Customer Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  className="h-4 w-4" 
                  checked={showInvalidDates}
                  onChange={(e) => setShowInvalidDates(e.target.checked)}
                />
                <span className="text-sm whitespace-nowrap">Include invalid fines</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tabs 
              value={viewMode} 
              onValueChange={(value) => setViewMode(value as any)}
              className="hidden md:block"
            >
              <TabsList>
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Invalid Fines Warning */}
      {invalidAssignedFines.length > 0 && (
        <Alert variant="warning" className="print:hidden">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Fine Assignments Detected</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              {invalidAssignedFines.length} traffic {invalidAssignedFines.length === 1 ? 'fine is' : 'fines are'} assigned to customers 
              but the violation dates fall outside the lease periods. 
              {!showInvalidDates && ' These are hidden by default.'}
            </div>
            {invalidAssignedFines.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCleanupInvalidAssignments}
                disabled={isCleaningUp}
                className="whitespace-nowrap"
              >
                {isCleaningUp ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                    Fix invalid assignments
                  </>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Area */}
      {totalFines === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium">No Traffic Fines Found</h3>
            <p className="text-sm text-muted-foreground mt-2">No traffic fines match your current search criteria.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'charts' ? (
        <Card>
          <CardHeader>
            <CardTitle>Traffic Fines Visualization</CardTitle>
            <CardDescription>
              Visual representation of traffic fines data
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="h-[400px] w-full">
              {groupBy === 'status' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${value} fines`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end"
                      height={60} 
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), groupBy === 'month' ? 'Total Amount' : 'Amount']} 
                    />
                    <Legend />
                    <Bar 
                      dataKey={groupBy === 'month' ? 'amount' : 'amount'} 
                      name={groupBy === 'month' ? 'Total Amount' : 'Amount'} 
                      fill="#6366F1" 
                    />
                    {groupBy === 'month' && (
                      <Bar dataKey="count" name="Number of Fines" fill="#10B981" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>Traffic Fines Report</CardTitle>
            <CardDescription>
              Detailed list of all traffic fines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Violation #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Validity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finesToDisplay.map((fine) => {
                    const isValidFineDate = isValidFine(fine);
                    const vehicleInfo = fine.vehicleModel || 'N/A';
                    
                    return (
                      <TableRow key={fine.id}>
                        <TableCell className="font-medium">{fine.violationNumber}</TableCell>
                        <TableCell>{formatDate(new Date(fine.violationDate))}</TableCell>
                        <TableCell>{fine.licensePlate || 'N/A'}</TableCell>
                        <TableCell>{vehicleInfo}</TableCell>
                        <TableCell>{fine.customerName || 'Unassigned'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(fine.fineAmount || 0)}</TableCell>
                        <TableCell>
                          {!fine.customerId ? (
                            <Badge variant="outline">Unassigned</Badge>
                          ) : isValidFineDate ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Invalid Period
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Card View (default)
        <div className="space-y-6">
          {groupedFines.map((group) => (
            <Card key={group.name} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-4">
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleGroup(group.name)}
                >
                  <div className="flex items-center gap-2">
                    {groupBy === 'month' ? (
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    ) : groupBy === 'status' ? (
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <UserCheck className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>
                        {group.count} fine{group.count !== 1 ? 's' : ''} • {formatCurrency(group.totalAmount)}
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                    {expandedGroups.includes(group.name) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              {expandedGroups.includes(group.name) && (
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Violation #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.fines.map((fine: any) => (
                        <TableRow key={fine.id}>
                          <TableCell className="font-medium">{fine.violationNumber}</TableCell>
                          <TableCell>{formatDate(new Date(fine.violationDate))}</TableCell>
                          <TableCell>{fine.licensePlate || 'N/A'}</TableCell>
                          <TableCell>{fine.vehicleModel || 'N/A'}</TableCell>
                          <TableCell>{fine.customerName || 'Unassigned'}</TableCell>
                          <TableCell className="text-right">{formatCurrency(fine.fineAmount || 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <CardFooter className="flex justify-between py-4 bg-muted/20">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-sm font-medium">{formatCurrency(group.totalAmount)}</span>
                  </CardFooter>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Report print footer */}
      <div className="hidden print:block mt-8 text-sm text-gray-500">
        <p>Report generated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default TrafficFineReport;
