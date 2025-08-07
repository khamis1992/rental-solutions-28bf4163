import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Bug, CheckCircle, XCircle } from 'lucide-react';
import { generateModernAgreementPDF } from '@/utils/modern-agreement-pdf';
import { generateModernLegalContractPDF } from '@/utils/modern-legal-contract-pdf';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export function PdfTestingComponent() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Sample test data
  const sampleAgreement = {
    id: 'test-123',
    agreement_number: 'AGR-2024-001',
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    total_amount: 24000,
    rent_amount: 2000,
    deposit_amount: 4000,
    daily_late_fee: 120,
    agreement_duration: '12 months',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const sampleCustomer = {
    id_number: 'ID123456789',
    full_name: 'أحمد محمد العلي',
    email: 'ahmed.ali@example.com',
    phone_number: '+974 5555 1234',
    driver_license: 'DL123456789',
    nationality: 'قطري'
  };

  const sampleVehicle = {
    id: 'vehicle-123',
    make: 'تويوتا',
    model: 'كامري',
    year: 2023,
    license_plate: '123456',
    vin: 'VIN123456789',
    color: 'أبيض'
  };


  const samplePayments = [
    {
      id: 'payment-1',
      amount: 2000,
      payment_date: '2024-01-01',
      due_date: '2024-01-01',
      status: 'paid',
      payment_method: 'bank_transfer',
      description: 'دفعة شهر يناير'
    },
    {
      id: 'payment-2',
      amount: 2000,
      payment_date: '2024-02-01',
      due_date: '2024-02-01',
      status: 'paid',
      payment_method: 'cash',
      description: 'دفعة شهر فبراير'
    }
  ];

  const updateTestResult = (testName: string, status: TestResult['status'], message?: string, duration?: number) => {
    setTestResults(prev => {
      const existingIndex = prev.findIndex(t => t.test === testName);
      const newResult: TestResult = { test: testName, status, message, duration };
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newResult;
        return updated;
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    updateTestResult(testName, 'pending');
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTestResult(testName, 'success', 'Test completed successfully', duration);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      updateTestResult(testName, 'error', message, duration);
      console.error(`Test failed: ${testName}`, error);
    }
  };

  const testBasicPdfGeneration = async () => {
    console.log('Testing modern PDF generation...');
    await generateModernAgreementPDF(
      sampleAgreement,
      samplePayments,
      [], // No traffic fines for this test
      undefined // No ID card image for this test
    );
    toast.success('Modern PDF generation test completed');
  };

  const testReportGeneration = async () => {
    console.log('Testing modern legal contract PDF generation...');
    await generateModernLegalContractPDF(
      sampleAgreement,
      sampleCustomer,
      sampleVehicle,
      samplePayments
    );
    toast.success('Modern legal contract PDF generation test completed');
  };

  const testArabicTextRendering = async () => {
    console.log('Testing modern Arabic text rendering...');
    // Test with Arabic-heavy content
    const arabicAgreement = {
      ...sampleAgreement,
      agreement_number: 'عقد-١٢٣'
    };
    
    // Arabic customer data setup removed for now

    await generateModernAgreementPDF(
      arabicAgreement,
      samplePayments,
      [],
      undefined // No ID card image for this test
    );
    toast.success('Modern Arabic text rendering test completed');
  };

  const testLargeDocuments = async () => {
    console.log('Testing modern large document generation...');
    // Generate report with more data
    const largePayments = Array.from({ length: 12 }, (_, i) => ({
      id: `payment-${i + 1}`,
      amount: 2000 + (i * 100),
      payment_date: `2024-${String(i + 1).padStart(2, '0')}-01`,
      due_date: `2024-${String(i + 1).padStart(2, '0')}-01`,
      status: i % 3 === 0 ? 'pending' : 'paid',
      payment_method: ['cash', 'bank_transfer', 'credit_card'][i % 3],
      description: `دفعة شهر ${i + 1}`
    }));

    await generateModernAgreementPDF(
      sampleAgreement,
      largePayments,
      [],
      undefined // No ID card image for this test
    );
    toast.success('Modern large document test completed');
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      await runTest('Basic PDF Generation', testBasicPdfGeneration);
      await runTest('Report Generation', testReportGeneration);
      await runTest('Arabic Text Rendering', testArabicTextRendering);
      await runTest('Large Document Generation', testLargeDocuments);
      
      toast.success('All tests completed!');
    } catch (error) {
      toast.error('Test suite failed');
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Running...</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            PDF Generation Testing Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Run All Tests
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runTest('Basic PDF Generation', testBasicPdfGeneration)}
              disabled={isRunning}
            >
              Test Basic PDF
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runTest('Report Generation', testReportGeneration)}
              disabled={isRunning}
            >
              Test Report
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => runTest('Arabic Text Rendering', testArabicTextRendering)}
              disabled={isRunning}
            >
              Test Arabic Text
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results:</h3>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.test}</span>
                      {result.duration && (
                        <span className="text-sm text-muted-foreground">
                          ({result.duration}ms)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                ))}
                
                {/* Fix: Properly access the last result */}
                {testResults.length > 0 && testResults[testResults.length - 1].message && testResults[testResults.length - 1].status === 'error' && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{testResults[testResults.length - 1].message}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Test Information:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Basic PDF Generation: Tests standard agreement contract generation</li>
              <li>• Report Generation: Tests comprehensive agreement report with payments</li>
              <li>• Arabic Text Rendering: Tests RTL text handling and Arabic fonts</li>
              <li>• Large Document Generation: Tests performance with extensive data</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
