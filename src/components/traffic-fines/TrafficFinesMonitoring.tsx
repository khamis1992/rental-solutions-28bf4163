
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { 
  getRecentOperations, 
  getOperationMetrics, 
  clearOperationLogs 
} from '@/utils/monitoring-utils';
import { 
  runTrafficFinesSystemHealthCheck, 
  testTrafficFineAssignment 
} from '@/utils/traffic-fines-test-utils';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { toast } from 'sonner';

const TrafficFinesMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [recentOperations, setRecentOperations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [testInProgress, setTestInProgress] = useState(false);
  
  const { trafficFines } = useTrafficFines();
  
  // Load operations and metrics
  useEffect(() => {
    updateMetrics();
  }, []);
  
  const updateMetrics = () => {
    setRecentOperations(getRecentOperations());
    setMetrics(getOperationMetrics());
  };
  
  // Run system health check
  const runHealthCheck = async () => {
    setIsRefreshing(true);
    try {
      const results = await runTrafficFinesSystemHealthCheck();
      setHealthStatus(results);
      
      if (results.status === 'error') {
        toast.error('System health check detected critical issues', {
          description: results.issues[0]
        });
      } else if (results.status === 'warning') {
        toast.warning('System health check detected potential issues', {
          description: `${results.issues.length} issues found`
        });
      } else {
        toast.success('System health check completed successfully');
      }
    } catch (error) {
      toast.error('Failed to run system health check', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRefreshing(false);
      updateMetrics();
    }
  };
  
  // Run test on a specific traffic fine
  const runTest = async (fineId: string) => {
    setTestInProgress(true);
    try {
      const results = await testTrafficFineAssignment(fineId);
      setTestResults(results);
      
      if (results.success) {
        toast.success('Traffic fine assignment test passed');
      } else {
        toast.error('Traffic fine assignment test failed', {
          description: results.overallStatus
        });
      }
    } catch (error) {
      toast.error('Test execution failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTestInProgress(false);
      updateMetrics();
    }
  };
  
  // Clear logs
  const handleClearLogs = () => {
    clearOperationLogs();
    updateMetrics();
    toast.success('Operation logs cleared');
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> Success</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500"><AlertTriangle className="mr-1 h-3 w-3" /> Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500"><XCircle className="mr-1 h-3 w-3" /> Error</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Traffic Fines System Monitoring</CardTitle>
            <CardDescription>
              Monitor system health and troubleshoot assignment issues
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={isRefreshing}
            onClick={runHealthCheck}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>
          
          {/* Health Tab */}
          <TabsContent value="health" className="pt-4">
            {healthStatus ? (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(healthStatus.status)}
                </div>
                
                {healthStatus.issues.length > 0 && (
                  <Alert variant={healthStatus.status === 'error' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Issues Detected</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 mt-2">
                        {healthStatus.issues.map((issue: string, i: number) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Fines</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold">{healthStatus.metrics.totalFines}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Unassigned</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold">{healthStatus.metrics.unassignedFines}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold">{healthStatus.metrics.pendingFines}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold">{healthStatus.metrics.paidFines}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Disputed</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold">{healthStatus.metrics.disputedFines}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>Run a health check to see system status</p>
                <Button variant="outline" className="mt-4" onClick={runHealthCheck}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Health Check
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* Operations Tab */}
          <TabsContent value="operations" className="pt-4">
            <div className="space-y-6">
              {metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Operations</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold">{metrics.total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Success</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold text-green-500">{metrics.success}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Warnings</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold text-amber-500">{metrics.warnings}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Errors</CardTitle>
                    </CardHeader>
                    <CardContent className="py-0 px-4 pb-4">
                      <div className="text-2xl font-bold text-red-500">{metrics.errors}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Recent Operations</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearLogs}
                >
                  Clear Logs
                </Button>
              </div>
              
              {recentOperations.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Operation</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOperations.slice(0, 10).map((op, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{op.operation}</TableCell>
                          <TableCell>{getStatusBadge(op.status)}</TableCell>
                          <TableCell>
                            {new Date(op.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {op.errorMessage || JSON.stringify(op.details || {}).substring(0, 50)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground border rounded-md">
                  <p>No operation logs available</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Testing Tab */}
          <TabsContent value="testing" className="pt-4">
            <div className="space-y-6">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Test Fine Assignment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a traffic fine to test its eligibility for customer assignment
                </p>
                
                <div className="border rounded-md mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fine #</TableHead>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trafficFines && trafficFines.slice(0, 5).map((fine) => (
                        <TableRow key={fine.id}>
                          <TableCell>{fine.violationNumber}</TableCell>
                          <TableCell>{fine.licensePlate}</TableCell>
                          <TableCell>{fine.paymentStatus}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={testInProgress}
                              onClick={() => runTest(fine.id)}
                            >
                              Test
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {testResults && (
                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Test Results</h3>
                    <Badge className={
                      testResults.success 
                        ? "bg-green-500 text-white" 
                        : "bg-red-500 text-white"
                    }>
                      {testResults.success ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{testResults.overallStatus}</p>
                  
                  {testResults.recommendations && testResults.recommendations.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="list-disc pl-5">
                        {testResults.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <h4 className="font-medium mb-2">Test Steps:</h4>
                  <div className="space-y-2">
                    {testResults.steps.map((step: any, i: number) => (
                      <div key={i} className="border rounded-sm p-2">
                        <div className="flex items-center">
                          {step.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className="font-medium">{step.step}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrafficFinesMonitoring;
