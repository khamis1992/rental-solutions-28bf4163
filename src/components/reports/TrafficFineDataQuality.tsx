
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { testTrafficFineDataQuality, fixTrafficFineDataQualityIssues, TrafficFineDataQualityResult } from '@/utils/traffic-fines-test-utils';

export default function TrafficFineDataQuality() {
  const [qualityData, setQualityData] = useState<TrafficFineDataQualityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fixResults, setFixResults] = useState<{ fixed: number; errors: number; details: string[]; success?: boolean; } | null>(null);
  const [showFixDialog, setShowFixDialog] = useState(false);
  
  useEffect(() => {
    loadQualityData();
  }, []);
  
  const loadQualityData = async () => {
    setIsLoading(true);
    try {
      const results = await testTrafficFineDataQuality();
      setQualityData(results);
    } catch (error) {
      console.error("Error testing data quality:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFixIssues = async () => {
    setIsLoading(true);
    try {
      const results = await fixTrafficFineDataQualityIssues({
        fixDates: true,
        fixDuplicates: true
      });
      setFixResults(results);
      
      if (results.success) {
        // If fix was successful, reload quality data to reflect changes
        await loadQualityData();
      }
      
      // Show the results dialog regardless of success/failure
      setShowFixDialog(true);
    } catch (error) {
      console.error("Error fixing issues:", error);
      setFixResults({
        fixed: 0,
        errors: 1,
        details: [(error as Error).message || "Unknown error occurred"],
        success: false
      });
      setShowFixDialog(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'success': return "success";
      case 'warning': return "warning";
      case 'error': return "destructive";
      default: return "secondary";
    }
  };
  
  // In case the TrafficFineDataQualityResult doesn't have all the expected fields,
  // let's provide defaults
  const totalRecords = qualityData?.totalRecords ?? 0;
  const validRecords = qualityData?.validRecords ?? 0;
  const invalidRecords = qualityData?.invalidRecords ?? 0;
  const issues = qualityData?.issues ?? [];
  const status = qualityData?.status ?? 'error';
  const missingLicensePlateCount = qualityData?.missingLicensePlateCount ?? 0;
  const duplicateCount = qualityData?.duplicateCount ?? 0;
  const categorizedIssues = qualityData?.categorizedIssues ?? {
    missingData: 0,
    incorrectDates: 0,
    duplicates: 0,
    incorrectAssignments: 0
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Traffic Fine Data Quality</CardTitle>
          <CardDescription>Analyzing data quality...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <div className="space-y-4 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Please wait while we analyze the data quality...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!qualityData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Traffic Fine Data Quality</CardTitle>
          <CardDescription>Error analyzing data</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to analyze traffic fine data quality. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={loadQualityData}>Retry Analysis</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Traffic Fine Data Quality</CardTitle>
          <CardDescription>Analysis of your traffic fine data quality</CardDescription>
        </div>
        <Badge variant={getStatusBadgeVariant(status)}>
          {totalRecords} Records
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quality Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Valid Records</h3>
            <span className="text-sm">{Math.round((validRecords / (totalRecords || 1)) * 100)}%</span>
          </div>
          
          <Progress
            value={totalRecords ? (validRecords / totalRecords) * 100 : 0}
            className={`h-2 ${status === 'error' ? 'bg-red-200' : status === 'warning' ? 'bg-amber-200' : 'bg-muted'}`}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total: {totalRecords}</span>
            <span>Valid: {validRecords} | Invalid: {invalidRecords}</span>
          </div>
        </div>
        
        {/* Issues Summary */}
        {issues && issues.length > 0 && (
          <Alert variant={status === 'error' ? 'destructive' : 'warning'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Data Quality Issues Detected</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {issues.map((issue, idx) => (
                  <li key={idx} className="text-sm">{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Missing License Plate */}
        <Card className="border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              Missing License Plates
            </CardTitle>
            <Badge variant="outline">{missingLicensePlateCount} Records</Badge>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm text-muted-foreground mb-2">
              {totalRecords ? 
                `${Math.round((missingLicensePlateCount / totalRecords) * 100)}% of records have missing license plates.` : 
                'No records with missing license plates.'} 
            </p>
          </CardContent>
        </Card>
        
        {/* Duplicate Records */}
        <Card className="border shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              Duplicate Records
            </CardTitle>
            <Badge variant="outline">{duplicateCount} Records</Badge>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-sm text-muted-foreground mb-2">
              {totalRecords ? 
                `${Math.round((duplicateCount / totalRecords) * 100)}% of records are potential duplicates.` : 
                'No duplicate records found.'} 
            </p>
          </CardContent>
        </Card>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start space-y-4">
        <div className="w-full pt-4 border-t flex justify-between items-center">
          <span className="text-sm font-medium flex items-center">
            {status === 'success' ? 
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> : 
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
            }
            Data Quality: {status === 'success' ? 'Good' : status === 'warning' ? 'Needs Attention' : 'Poor'}
          </span>
          
          <Button 
            onClick={handleFixIssues} 
            variant="default"
            disabled={isLoading || status === 'success' || invalidRecords === 0}
          >
            Fix Issues Automatically
          </Button>
        </div>
        
        {showFixDialog && fixResults && (
          <Alert variant={fixResults.success ? "success" : "destructive"} className="w-full">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>
              {fixResults.success ? "Issues Fixed Successfully" : "Fix Completed with Errors"}
            </AlertTitle>
            <AlertDescription>
              <p className="mb-1">
                Fixed {fixResults.fixed} issues. {fixResults.errors > 0 && `Failed to fix ${fixResults.errors} issues.`}
              </p>
              {fixResults.details && fixResults.details.length > 0 && (
                <ul className="list-disc list-inside text-xs mt-2">
                  {fixResults.details.slice(0, 5).map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                  {fixResults.details.length > 5 && <li>...and {fixResults.details.length - 5} more</li>}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
