
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { testTrafficFineDataQuality, fixTrafficFineDataQualityIssues, TrafficFineDataQualityResult } from '@/utils/traffic-fines-test-utils';

const TrafficFineDataQuality: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState<TrafficFineDataQualityResult | null>(null);

  const fetchDataQuality = async () => {
    setLoading(true);
    try {
      const qualityResults = await testTrafficFineDataQuality();
      setResults(qualityResults);
    } catch (error) {
      console.error('Error fetching data quality:', error);
      toast.error('Failed to analyze data quality');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataQuality();
  }, []);

  const handleFixIssues = async () => {
    setFixing(true);
    try {
      const fixResults = await fixTrafficFineDataQualityIssues();
      
      if (fixResults.success) {
        toast.success(`Fixed ${fixResults.fixed} data quality issues`, {
          description: fixResults.issues.join(', ')
        });
        await fetchDataQuality();
      } else {
        toast.error('Failed to fix some data issues', {
          description: fixResults.issues.join(', ')
        });
      }
    } catch (error) {
      console.error('Error fixing issues:', error);
      toast.error('Error fixing data quality issues');
    } finally {
      setFixing(false);
    }
  };

  const getStatusIcon = () => {
    if (!results) return <Skeleton className="h-10 w-10" />;
    
    switch (results.status) {
      case 'success':
        return <CheckCircle className="h-10 w-10 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-10 w-10 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-10 w-10 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (!results) return 'bg-gray-200';
    
    switch (results.status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Traffic Fine Data Quality
        </CardTitle>
        <CardDescription>
          Analysis of data quality and validation issues for traffic fines
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : results ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold">{results.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-green-500">{results.validRecords}</div>
                <div className="text-sm text-muted-foreground">Valid Records</div>
              </div>
              
              <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold text-destructive">{results.invalidRecords}</div>
                <div className="text-sm text-muted-foreground">Invalid Records</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Data Quality Score</span>
                <span className="font-medium">
                  {results.totalRecords === 0 ? '0%' : 
                   `${Math.round((results.validRecords / results.totalRecords) * 100)}%`}
                </span>
              </div>
              <Progress 
                value={results.totalRecords === 0 ? 0 : 
                       Math.round((results.validRecords / results.totalRecords) * 100)} 
                className="h-2"
                indicatorClassName={getStatusColor()}
              />
            </div>
            
            {results.issues.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Issues Detected</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {results.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-1">Missing License Plates</div>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{results.missingLicensePlateCount}</div>
                  <div className="text-xs text-muted-foreground">
                    {results.totalRecords === 0 ? '0%' : 
                     `${Math.round((results.missingLicensePlateCount / results.totalRecords) * 100)}%`}
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="text-sm font-medium mb-1">Potential Duplicates</div>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{results.duplicateCount}</div>
                  <div className="text-xs text-muted-foreground">
                    {results.totalRecords === 0 ? '0%' : 
                     `${Math.round((results.duplicateCount / results.totalRecords) * 100)}%`}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No data quality information available
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={fetchDataQuality} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
        {results && (results.status === 'warning' || results.status === 'error') && (
          <Button onClick={handleFixIssues} disabled={fixing || loading}>
            {fixing ? 'Fixing Issues...' : 'Fix Common Issues'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default TrafficFineDataQuality;
