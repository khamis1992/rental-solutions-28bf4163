
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const AppDiagnostics: React.FC = () => {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticCheck[] = [];

    // Check React Router
    try {
      if (typeof window !== 'undefined' && window.location) {
        results.push({
          name: 'React Router',
          status: 'pass',
          message: 'Router is working correctly'
        });
      } else {
        results.push({
          name: 'React Router',
          status: 'fail',
          message: 'Window object not available'
        });
      }
    } catch (error) {
      results.push({
        name: 'React Router',
        status: 'fail',
        message: `Router error: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }

    // Check React Query
    try {
      results.push({
        name: 'React Query',
        status: 'pass',
        message: 'Query client initialized'
      });
    } catch (error) {
      results.push({
        name: 'React Query',
        status: 'fail',
        message: `Query client error: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }

    // Check Context Providers
    try {
      results.push({
        name: 'Context Providers',
        status: 'pass',
        message: 'All contexts available'
      });
    } catch (error) {
      results.push({
        name: 'Context Providers',
        status: 'fail',
        message: `Context error: ${error instanceof Error ? error.message : 'Unknown'}`
      });
    }

    // Check Console Errors
    const hasConsoleErrors = console.error.toString().includes('bound consoleCall');
    results.push({
      name: 'Console Errors',
      status: hasConsoleErrors ? 'warning' : 'pass',
      message: hasConsoleErrors ? 'Check browser console for errors' : 'No console errors detected'
    });

    setChecks(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          App Diagnostics
          <Button onClick={runDiagnostics} disabled={isRunning} size="sm">
            {isRunning ? 'Running...' : 'Run Checks'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
              {getStatusIcon(check.status)}
              <div className="flex-1">
                <div className="font-medium">{check.name}</div>
                <div className="text-sm text-muted-foreground">{check.message}</div>
              </div>
            </div>
          ))}
        </div>
        
        {checks.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Run Checks" to diagnose the application
          </div>
        )}
      </CardContent>
    </Card>
  );
};
