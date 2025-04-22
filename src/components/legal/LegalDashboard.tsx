
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gavel, 
  FileText, 
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import LegalDocuments from './LegalDocuments';
import LegalCaseManagement from './LegalCaseManagement';
import { Button } from '@/components/ui/button';
import { runAgreementStatusMaintenance } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const LegalDashboard = () => {
  const [activeTab, setActiveTab] = useState('documents');
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  
  // Load last check time from local storage
  useEffect(() => {
    const saved = localStorage.getItem('lastAgreementStatusCheck');
    if (saved) {
      setLastChecked(saved);
    }
  }, []);

  const handleCheckAgreementStatus = async () => {
    setIsRunningCheck(true);
    try {
      toast.info("Running agreement status check...");
      const result = await runAgreementStatusMaintenance();
      
      if (result.success) {
        const now = new Date().toISOString();
        setLastChecked(now);
        localStorage.setItem('lastAgreementStatusCheck', now);
        toast.success(result.message || "Agreement status check completed successfully");
      } else {
        toast.error(result.message || "Agreement status check failed");
      }
    } catch (error) {
      console.error("Error running agreement status check:", error);
      toast.error("Failed to run agreement status check");
    } finally {
      setIsRunningCheck(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">Legal Management Dashboard</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckAgreementStatus}
              disabled={isRunningCheck}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              {isRunningCheck ? "Running..." : "Check Agreement Status"}
            </Button>
          </div>
          {lastChecked && (
            <div className="text-xs text-muted-foreground flex items-center mt-1">
              <Badge variant="outline" className="text-xs mr-2">AI powered</Badge>
              Last status check: {new Date(lastChecked).toLocaleString()}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="documents" 
            className="space-y-4"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TabsTrigger value="documents" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Legal Documents</span>
              </TabsTrigger>
              <TabsTrigger value="cases" className="flex items-center space-x-2">
                <Gavel className="h-4 w-4" />
                <span>Case Management</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="documents" className="space-y-4">
              <LegalDocuments />
            </TabsContent>
            
            <TabsContent value="cases" className="space-y-4">
              <LegalCaseManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegalDashboard;
