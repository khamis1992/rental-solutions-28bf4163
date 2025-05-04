
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { LegalStats } from './stats/LegalStats';
import { RecentLegalActivity } from './activity/RecentLegalActivity';
import { UpcomingDeadlines } from './deadlines/UpcomingDeadlines';
import LegalCaseManagement from './LegalCaseManagement';
import LegalRiskAssessment from './LegalRiskAssessment';
import ComplianceReporting from './ComplianceReporting';
import ComplianceCalendar from './ComplianceCalendar';

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
                New Case
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-2">
          <LegalStats 
            activeCases={activeCases}
            highPriorityCases={highPriorityCases}
            pendingCases={pendingCases}
            resolvedCases={resolvedCases}
            onViewAll={handleViewAll}
          />

          <Tabs 
            defaultValue="overview" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
              <TabsTrigger value="cases">Case Management</TabsTrigger>
              <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RecentLegalActivity />
                <UpcomingDeadlines />
              </div>
            </TabsContent>
            
            <TabsContent value="cases">
              <LegalCaseManagement />
            </TabsContent>
            
            <TabsContent value="risk">
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
