
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gavel, 
  AlertTriangle, 
  BarChart4, 
  ShieldAlert,
  CalendarDays,
  FileText,
  Users,
  Clock,
  Filter,
  Search,
  ArrowUpRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import LegalCaseManagement from './LegalCaseManagement';
import LegalRiskAssessment from './LegalRiskAssessment';
import ComplianceReporting from './ComplianceReporting';
import ComplianceCalendar from './ComplianceCalendar';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { useNavigate } from 'react-router-dom';

const LegalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { legalCases, isLoading } = useLegalCases();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Calculate statistics
  const activeCases = !isLoading ? legalCases.filter(c => c.status === 'active').length : 0;
  const pendingCases = !isLoading ? legalCases.filter(c => c.status === 'pending').length : 0;
  const resolvedCases = !isLoading ? legalCases.filter(c => c.status === 'resolved').length : 0;
  const highPriorityCases = !isLoading ? legalCases.filter(c => c.priority === 'high').length : 0;
  
  const handleNewCase = () => {
    navigate('/legal/cases/new');
  };

  const handleViewAll = (filterType: string, value: string) => {
    navigate(`/legal/cases?${filterType}=${value}`);
  };
  
  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center">
                <Gavel className="h-5 w-5 mr-2 text-primary" />
                Legal Management Console
              </CardTitle>
              <CardDescription>
                Monitor and manage all legal aspects of your operation
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cases, documents..."
                  className="pl-8 w-full md:w-[200px] h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={handleNewCase} className="w-full md:w-auto">
                <Gavel className="mr-2 h-4 w-4" />
                New Case
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Stats Overview */}
        <CardContent className="pb-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
              <CardContent className="p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
                    <h3 className="text-2xl font-bold text-primary">{activeCases}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-primary/10">
                    <Gavel className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mt-2">
                  <Button variant="link" className="p-0 h-auto text-xs" onClick={() => handleViewAll('status', 'active')}>
                    View all active cases →
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-destructive">
              <CardContent className="p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                    <h3 className="text-2xl font-bold text-destructive">{highPriorityCases}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                </div>
                <div className="mt-2">
                  <Button variant="link" className="p-0 h-auto text-xs text-destructive" onClick={() => handleViewAll('priority', 'high')}>
                    View high priority cases →
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                    <h3 className="text-2xl font-bold text-amber-500">{pendingCases}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <div className="mt-2">
                  <Button variant="link" className="p-0 h-auto text-xs text-amber-500" onClick={() => handleViewAll('status', 'pending')}>
                    View pending cases →
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
              <CardContent className="p-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Resolved Cases</p>
                    <h3 className="text-2xl font-bold text-green-500">{resolvedCases}</h3>
                  </div>
                  <div className="p-2 rounded-full bg-green-500/10">
                    <ShieldAlert className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <div className="mt-2">
                  <Button variant="link" className="p-0 h-auto text-xs text-green-500" onClick={() => handleViewAll('status', 'resolved')}>
                    View resolved cases →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs 
            defaultValue="overview" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-muted/50 p-1">
              <TabsTrigger value="overview" className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart4 className="h-4 w-4" />
                <span>Dashboard Overview</span>
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Gavel className="h-4 w-4" />
                <span>Case Management</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ShieldAlert className="h-4 w-4" />
                <span>Risk Assessment</span>
              </TabsTrigger>
              <TabsTrigger value="compliance" className="flex items-center justify-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <CalendarDays className="h-4 w-4" />
                <span>Compliance</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Dashboard Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Legal Activity</CardTitle>
                    <CardDescription>Latest updates and changes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                      <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="p-2 rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center">
                          <Gavel className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">New Case Created</h4>
                            <Badge variant="outline" className="text-xs">2h ago</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Payment default case opened for customer #1254</p>
                          <Button variant="link" className="p-0 h-6 mt-1 text-xs">View case details →</Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="p-2 rounded-full bg-amber-500/10 h-10 w-10 flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">Court Date Scheduled</h4>
                            <Badge variant="outline" className="text-xs">Yesterday</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Case #LC-283 hearing scheduled for June 15th</p>
                          <Button variant="link" className="p-0 h-6 mt-1 text-xs">View calendar →</Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="p-2 rounded-full bg-green-500/10 h-10 w-10 flex items-center justify-center">
                          <ShieldAlert className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">Case Resolved</h4>
                            <Badge variant="outline" className="text-xs">2 days ago</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Vehicle damage case #LC-276 settled with customer</p>
                          <Button variant="link" className="p-0 h-6 mt-1 text-xs">View settlement →</Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                        <div className="p-2 rounded-full bg-blue-500/10 h-10 w-10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium">Document Updated</h4>
                            <Badge variant="outline" className="text-xs">3 days ago</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Contract template for commercial vehicles revised</p>
                          <Button variant="link" className="p-0 h-6 mt-1 text-xs">View document →</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View All Activity</Button>
                  </CardFooter>
                </Card>
                
                {/* Upcoming Deadlines */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
                    <CardDescription>Legal deadlines requiring action</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                      <div className="p-3 rounded-md border-l-4 border-red-500 bg-red-50">
                        <div className="flex justify-between">
                          <h4 className="font-medium">Court Filing Deadline</h4>
                          <Badge variant="destructive">Tomorrow</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Case #LC-290 response due</p>
                        <Button variant="link" className="p-0 h-6 mt-1 text-xs text-red-600">Take action →</Button>
                      </div>
                      
                      <div className="p-3 rounded-md border-l-4 border-amber-500 bg-amber-50">
                        <div className="flex justify-between">
                          <h4 className="font-medium">Insurance Renewal</h4>
                          <Badge className="bg-amber-500">3 days</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Fleet vehicle insurance policy expires</p>
                        <Button variant="link" className="p-0 h-6 mt-1 text-xs text-amber-600">Review →</Button>
                      </div>
                      
                      <div className="p-3 rounded-md border-l-4 border-blue-500 bg-blue-50">
                        <div className="flex justify-between">
                          <h4 className="font-medium">Settlement Negotiation</h4>
                          <Badge className="bg-blue-500">Next week</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Customer #2356 contract dispute</p>
                        <Button variant="link" className="p-0 h-6 mt-1 text-xs text-blue-600">View details →</Button>
                      </div>
                      
                      <div className="p-3 rounded-md border-l-4 border-green-500 bg-green-50">
                        <div className="flex justify-between">
                          <h4 className="font-medium">Regulatory Compliance</h4>
                          <Badge className="bg-green-500">2 weeks</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Annual compliance report submission</p>
                        <Button variant="link" className="p-0 h-6 mt-1 text-xs text-green-600">Start preparation →</Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View All Deadlines</Button>
                  </CardFooter>
                </Card>
              </div>
              
              {/* Quick Access Links */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Quick Access</CardTitle>
                  <CardDescription>Frequently used legal resources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2" onClick={handleNewCase}>
                      <div className="p-2 rounded-full bg-primary/10 mb-1">
                        <Gavel className="h-5 w-5 text-primary" />
                      </div>
                      <span>New Legal Case</span>
                      <span className="text-xs text-muted-foreground">Create a case record</span>
                    </Button>
                    
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
                      <div className="p-2 rounded-full bg-blue-500/10 mb-1">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <span>Document Templates</span>
                      <span className="text-xs text-muted-foreground">Standard legal forms</span>
                    </Button>
                    
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
                      <div className="p-2 rounded-full bg-amber-500/10 mb-1">
                        <CalendarDays className="h-5 w-5 text-amber-500" />
                      </div>
                      <span>Legal Calendar</span>
                      <span className="text-xs text-muted-foreground">Court dates & deadlines</span>
                    </Button>
                    
                    <Button variant="outline" className="h-auto py-6 flex flex-col items-center justify-center gap-2">
                      <div className="p-2 rounded-full bg-green-500/10 mb-1">
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                      <span>Customer Obligations</span>
                      <span className="text-xs text-muted-foreground">Review & manage</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Performance Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Legal Performance Metrics</CardTitle>
                      <CardDescription>Key indicators of legal department performance</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-1" /> Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        <ArrowUpRight className="h-4 w-4 mr-1" /> Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="shadow-none border">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center">
                          <h3 className="text-3xl font-bold text-primary">87%</h3>
                          <p className="text-sm font-medium mt-1">Case Resolution Rate</p>
                          <Badge variant="outline" className="mt-2">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> 5% increase
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-none border">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center">
                          <h3 className="text-3xl font-bold text-amber-500">24</h3>
                          <p className="text-sm font-medium mt-1">Avg. Days to Resolution</p>
                          <Badge variant="outline" className="mt-2">
                            <ArrowUpRight className="h-3 w-3 mr-1 rotate-180" /> 3 days longer
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="shadow-none border">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center text-center">
                          <h3 className="text-3xl font-bold text-green-500">92%</h3>
                          <p className="text-sm font-medium mt-1">Compliance Rate</p>
                          <Badge variant="outline" className="mt-2">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> 2% increase
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="cases" className="space-y-4">
              <LegalCaseManagement />
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-4">
              <LegalRiskAssessment />
            </TabsContent>
            
            <TabsContent value="compliance" className="space-y-6">
              <ComplianceCalendar />
              <ComplianceReporting />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDashboard;
