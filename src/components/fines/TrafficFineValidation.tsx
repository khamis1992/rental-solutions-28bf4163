
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, AlertTriangle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useTrafficFinesValidation, ValidationResult } from '@/hooks/use-traffic-fines-validation';
import { Loader2 } from 'lucide-react';

const TrafficFineValidation = () => {
  const { validationHistory, validationAttempts, validateTrafficFine, isValidating, isLoading } = useTrafficFinesValidation();
  const [licensePlate, setLicensePlate] = useState('');
  const [activeTab, setActiveTab] = useState('validate');
  
  const handleValidate = async () => {
    if (!licensePlate) return;
    
    try {
      await validateTrafficFine(licensePlate);
      setActiveTab('history');
    } catch (error) {
      console.error('Validation error:', error);
    }
  };
  
  const renderValidationStatus = (validation: ValidationResult) => {
    if (validation.status === 'pending') {
      return (
        <div className="flex items-center text-amber-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>In Progress</span>
        </div>
      );
    }
    
    if (validation.status === 'error') {
      return (
        <div className="flex items-center text-red-500">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span>Error</span>
        </div>
      );
    }
    
    if (validation.has_fine) {
      return (
        <div className="flex items-center text-red-500">
          <X className="h-4 w-4 mr-1" />
          <span>Fine Found</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-green-500">
          <Check className="h-4 w-4 mr-1" />
          <span>No Fine</span>
        </div>
      );
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fine Validation</CardTitle>
        <CardDescription>
          Check if a vehicle has any traffic fines registered in the MOI system
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="validate">Validate License Plate</TabsTrigger>
            <TabsTrigger value="history">Validation History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="validate" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter license plate to validate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
              </div>
              <Button onClick={handleValidate} disabled={isValidating || !licensePlate}>
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Validate'
                )}
              </Button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-md font-medium mb-2">How validation works:</h3>
              <p className="text-sm text-muted-foreground">
                This tool checks if there are any traffic fines registered to the license plate in the Ministry of Interior system.
                The validation is done through an automated process that securely queries the traffic database.
              </p>
              <div className="p-4 bg-amber-50 rounded-md mt-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Important Notes:</h4>
                    <ul className="text-xs text-amber-700 list-disc ml-5 mt-1">
                      <li>Results are updated daily and may not reflect very recent fines</li>
                      <li>System does not detect fines registered to other GCC countries</li>
                      <li>Each validation is logged for audit purposes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-md font-medium mb-2">Validation History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">License Plate</th>
                        <th className="text-left py-3 px-4">Source</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationHistory && validationHistory.length > 0 ? (
                        validationHistory.map((validation) => (
                          <tr key={validation.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              {typeof validation.validation_date === 'string' &&
                                format(new Date(validation.validation_date), 'dd MMM yyyy, HH:mm')}
                            </td>
                            <td className="py-3 px-4">{validation.license_plate}</td>
                            <td className="py-3 px-4">{validation.validation_source}</td>
                            <td className="py-3 px-4">
                              {renderValidationStatus(validation)}
                            </td>
                            <td className="py-3 px-4">
                              {validation.details || validation.error_message || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">
                            No validation history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TrafficFineValidation;
