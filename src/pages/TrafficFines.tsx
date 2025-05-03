
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart2, FileText, Search, ShieldCheck } from "lucide-react";
import TrafficFinesList from "@/components/fines/TrafficFinesList";
import TrafficFineEntry from "@/components/fines/TrafficFineEntry";
import TrafficFineAnalytics from "@/components/fines/TrafficFineAnalytics";
import TrafficFineValidation from "@/components/fines/TrafficFineValidation";
import TrafficFineDataQuality from "@/components/reports/TrafficFineDataQuality";
import { useErrorNotification } from "@/hooks/use-error-notification";
import { useEffect } from "react";
import { createLogger } from "@/utils/error-logger";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const logger = createLogger("pages:traffic-fines");

const TrafficFines = () => {
  const [activeTab, setActiveTab] = useState("list");
  const errorNotification = useErrorNotification();
  const [hasInvalidAssignments, setHasInvalidAssignments] = useState(false);
  const [showInvalidAssignments, setShowInvalidAssignments] = useState(false);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);
  
  const handleAddFine = () => {
    setActiveTab("add");
  };
  
  const handleFineSaved = () => {
    setActiveTab("list");
  };

  const handleCleanupInvalidAssignments = async () => {
    setCleanupInProgress(true);
    // TrafficFinesList component will handle the actual cleanup
    setTimeout(() => {
      setCleanupInProgress(false);
      setHasInvalidAssignments(false);
    }, 1500);
  };

  // Error handling
  useEffect(() => {
    logger.debug("TrafficFines page mounted");
    
    // Clear any stale notifications when component mounts
    errorNotification.clearError("traffic-fines-error");
    
    // Register a global traffic fines error handler
    const handleTrafficFinesError = (event: ErrorEvent) => {
      // Only handle errors that are likely from the traffic fines module
      if (event.message.includes('traffic') || 
          event.message.includes('fine') || 
          event.filename?.includes('fines')) {
        
        logger.error(`Caught runtime error: ${event.message}`);
        
        errorNotification.showError("Traffic Fines Error", {
          description: event.message,
          id: "traffic-fines-runtime-error"
        });
        
        // Prevent default browser error handling
        event.preventDefault();
      }
    };

    // Add global error listener
    window.addEventListener('error', handleTrafficFinesError);
    
    return () => {
      // Clean up event listener and any pending notifications when component unmounts
      window.removeEventListener('error', handleTrafficFinesError);
      errorNotification.clearError("traffic-fines-error");
      errorNotification.clearError("traffic-fines-runtime-error");
      logger.debug("TrafficFines page unmounted");
    };
  }, [errorNotification]);

  return (
    <PageContainer>
      <SectionHeader
        title="Traffic Fines Management"
        description="Record, track, validate, and manage traffic violations"
        icon={AlertTriangle}
      />
      
      {hasInvalidAssignments && (
        <Alert variant={showInvalidAssignments ? "default" : "destructive"} className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid Fine Assignments Detected</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              Some traffic fines are assigned to customers but the violation dates fall outside the lease periods.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowInvalidAssignments(!showInvalidAssignments)}
              >
                {showInvalidAssignments ? 'Hide' : 'Show'} Invalid Assignments
              </Button>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleCleanupInvalidAssignments}
                disabled={cleanupInProgress}
              >
                {cleanupInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-3 w-3" />
                    Fix Invalid Assignments
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-1 md:grid-cols-5 w-full">
          <TabsTrigger value="list" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Fines List
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Record New Fine
          </TabsTrigger>
          <TabsTrigger value="validate" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Fines Validation
          </TabsTrigger>
          <TabsTrigger value="dataQuality" className="flex items-center">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Data Quality
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Fine Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-6">
          <TrafficFinesList 
            onAddFine={handleAddFine}
            onInvalidAssignmentsFound={(hasInvalid) => {
              setHasInvalidAssignments(hasInvalid);
            }}
            showInvalidAssignments={showInvalidAssignments}
            triggerCleanup={cleanupInProgress}
          />
        </TabsContent>
        
        <TabsContent value="add" className="space-y-6">
          <TrafficFineEntry onFineSaved={handleFineSaved} />
        </TabsContent>
        
        <TabsContent value="validate" className="space-y-6">
          <TrafficFineValidation />
        </TabsContent>
        
        <TabsContent value="dataQuality" className="space-y-6">
          <TrafficFineDataQuality />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          <TrafficFineAnalytics />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default TrafficFines;
