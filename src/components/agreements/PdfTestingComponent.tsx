import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generatePdfDocument } from '@/utils/agreementUtils';
import { checkFontAvailability } from '@/utils/font-loader';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  timestamp: string;
  fontStatus: string;
  error?: string;
}

export function PdfTestingComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTestPdfGeneration = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);
      
      const mockAgreement = {
        id: 'test-123',
        agreement_number: 'TEST-001',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        total_amount: 15000,
        rent_amount: 1500,
        status: 'active',
        customers: {
          full_name: 'أحمد محمد الخليفي',
          email: 'ahmed@example.com',
          phone_number: '+974 5555 1234',
          nationality: 'قطري',
          driver_license: 'DL123456'
        },
        vehicles: {
          make: 'تويوتا',
          model: 'كامري',
          year: 2023,
          license_plate: '12345',
          color: 'أبيض',
          vin: 'VIN123456789'
        }
      };

      console.log('Starting PDF test generation...');
      const success = await generatePdfDocument(mockAgreement as any);
      
      const testResult = {
        success,
        timestamp: new Date().toISOString(),
        fontStatus: checkFontAvailability() ? 'available' : 'unavailable'
      };
      
      setTestResult(testResult);
      
      if (testResult.success) {
        toast.success('PDF test generation completed successfully!');
      } else {
        toast.error('PDF test generation failed. Check console for details.');
      }
    } catch (error) {
      console.error('PDF test error:', error);
      const errorResult = {
        success: false,
        timestamp: new Date().toISOString(),
        fontStatus: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResult(errorResult);
      toast.error('PDF test failed with error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Generation Test</CardTitle>
        <CardDescription>
          Test PDF generation with Arabic fonts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleTestPdfGeneration} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Test PDF'}
        </Button>

        {testResult && (
          <div className="mt-4">
            <h3>Test Result:</h3>
            <p><strong>Status:</strong> {testResult.success ? 'Success' : 'Failed'}</p>
            <p><strong>Timestamp:</strong> {testResult.timestamp}</p>
            <p><strong>Font Status:</strong> {testResult.fontStatus}</p>
            {testResult.error && <p><strong>Error:</strong> {testResult.error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
