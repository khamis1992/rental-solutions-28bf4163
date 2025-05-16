import React, { useState } from 'react';
import { useTrafficFineQuery } from '@/hooks/use-traffic-fine-query';
import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

/**
 * This component is used to test the API functionality after the service migration
 * It provides a UI to test various operations with traffic fines and legal cases
 */
export default function ServiceTester() {
  // State for form inputs
  const [licensePlate, setLicensePlate] = useState('');
  const [fineAmount, setFineAmount] = useState('100');
  const [violationNumber, setViolationNumber] = useState(`TF-${Math.floor(Math.random() * 10000)}`);
  const [legalCaseTitle, setLegalCaseTitle] = useState('');
  const [legalCaseDescription, setLegalCaseDescription] = useState('');
  const [fineIdToUpdate, setFineIdToUpdate] = useState('');
  const [legalCaseIdToUpdate, setLegalCaseIdToUpdate] = useState('');
  
  // Traffic fine hooks
  const {
    getTrafficFines,
    createTrafficFine,
    updateTrafficFineStatus,
    deleteTrafficFine
  } = useTrafficFineQuery();
  
  // Legal case hooks
  const {
    getLegalCases,
    createLegalCase,
    updateLegalCaseStatus,
    deleteLegalCase
  } = useLegalCaseQuery();
  
  // Query results
  const { 
    data: trafficFines,
    isLoading: finesLoading,
    isError: finesError,
    error: finesErrorData
  } = getTrafficFines({});
  
  const { 
    data: legalCases,
    isLoading: casesLoading,
    isError: casesError,
    error: casesErrorData
  } = getLegalCases({});
  
  // Mutations
  const createFineMutation = createTrafficFine();
  const updateFineMutation = updateTrafficFineStatus();
  const deleteFineMutation = deleteTrafficFine();
  const createCaseMutation = createLegalCase();
  const updateCaseMutation = updateLegalCaseStatus();
  const deleteCaseMutation = deleteLegalCase();
  
  // Handlers
  const handleCreateFine = async () => {
    try {
      const newFine = {
        violation_number: violationNumber,
        license_plate: licensePlate,
        fine_amount: parseFloat(fineAmount),
        violation_date: new Date().toISOString(),
        payment_status: 'pending'
      };
      
      await createFineMutation.mutateAsync(newFine);
      toast.success('Traffic fine created successfully');
      setLicensePlate('');
      setFineAmount('100');
      setViolationNumber(`TF-${Math.floor(Math.random() * 10000)}`);
    } catch (error) {
      console.error('Error creating fine:', error);
      toast.error('Failed to create traffic fine');
    }
  };
  
  const handleUpdateFine = async () => {
    if (!fineIdToUpdate) {
      toast.error('Please enter a fine ID');
      return;
    }
    
    try {
      await updateFineMutation.mutateAsync({ 
        id: fineIdToUpdate, 
        status: 'paid'
      });
      toast.success('Traffic fine updated successfully');
      setFineIdToUpdate('');
    } catch (error) {
      console.error('Error updating fine:', error);
      toast.error('Failed to update traffic fine');
    }
  };
  
  const handleDeleteFine = async () => {
    if (!fineIdToUpdate) {
      toast.error('Please enter a fine ID');
      return;
    }
    
    try {
      await deleteFineMutation.mutateAsync(fineIdToUpdate);
      toast.success('Traffic fine deleted successfully');
      setFineIdToUpdate('');
    } catch (error) {
      console.error('Error deleting fine:', error);
      toast.error('Failed to delete traffic fine');
    }
  };
  
  const handleCreateCase = async () => {
    if (!legalCaseTitle) {
      toast.error('Please enter a case title');
      return;
    }
    
    try {
      const newCase = {
        title: legalCaseTitle,
        description: legalCaseDescription,
        status: 'open',
        created_at: new Date().toISOString()
      };
      
      await createCaseMutation.mutateAsync(newCase);
      toast.success('Legal case created successfully');
      setLegalCaseTitle('');
      setLegalCaseDescription('');
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create legal case');
    }
  };
  
  const handleUpdateCase = async () => {
    if (!legalCaseIdToUpdate) {
      toast.error('Please enter a case ID');
      return;
    }
    
    try {
      await updateCaseMutation.mutateAsync({ 
        id: legalCaseIdToUpdate, 
        status: 'resolved'
      });
      toast.success('Legal case updated successfully');
      setLegalCaseIdToUpdate('');
    } catch (error) {
      console.error('Error updating case:', error);
      toast.error('Failed to update legal case');
    }
  };
  
  const handleDeleteCase = async () => {
    if (!legalCaseIdToUpdate) {
      toast.error('Please enter a case ID');
      return;
    }
    
    try {
      await deleteCaseMutation.mutateAsync(legalCaseIdToUpdate);
      toast.success('Legal case deleted successfully');
      setLegalCaseIdToUpdate('');
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Failed to delete legal case');
    }
  };
  
  return (
    <div className="container mx-auto py-10 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Service Migration Test Page</h1>
        <p className="text-muted-foreground">
          Use this page to test API functionality after service migration
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traffic Fines Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Fines Service</CardTitle>
            <CardDescription>Test traffic fine operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create Fine Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Create Traffic Fine</h3>
              <div className="space-y-2">
                <Label htmlFor="violationNumber">Violation Number</Label>
                <Input 
                  id="violationNumber" 
                  value={violationNumber}
                  onChange={(e) => setViolationNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input 
                  id="licensePlate" 
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fineAmount">Fine Amount</Label>
                <Input 
                  id="fineAmount" 
                  type="number"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateFine} 
                disabled={createFineMutation.isPending || !licensePlate}
                className="w-full"
              >
                {createFineMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : 'Create Fine'}
              </Button>
            </div>
            
            <Separator />
            
            {/* Update/Delete Fine Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Update/Delete Traffic Fine</h3>
              <div className="space-y-2">
                <Label htmlFor="fineId">Fine ID</Label>
                <Input 
                  id="fineId" 
                  value={fineIdToUpdate}
                  onChange={(e) => setFineIdToUpdate(e.target.value)}
                  placeholder="Enter fine ID to update or delete"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleUpdateFine} 
                  disabled={updateFineMutation.isPending || !fineIdToUpdate}
                  variant="outline"
                  className="flex-1"
                >
                  {updateFineMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : 'Mark as Paid'}
                </Button>
                <Button 
                  onClick={handleDeleteFine} 
                  disabled={deleteFineMutation.isPending || !fineIdToUpdate}
                  variant="destructive"
                  className="flex-1"
                >
                  {deleteFineMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : 'Delete Fine'}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Data Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Traffic Fines Data</h3>
              {finesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : finesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {finesErrorData?.message || 'Failed to load traffic fines'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <div className="px-4 py-3 text-sm font-medium bg-muted">
                    {trafficFines?.length || 0} Traffic Fines Loaded
                  </div>
                  <div className="max-h-60 overflow-auto">
                    {trafficFines?.length ? (
                      trafficFines.map((fine: any) => (
                        <div key={fine.id} className="px-4 py-2 text-sm border-t">
                          <div className="font-medium">{fine.violation_number || 'N/A'}</div>
                          <div className="text-muted-foreground">
                            {fine.license_plate} - ${fine.fine_amount} - {fine.payment_status}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {fine.id}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No traffic fines found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Legal Cases Testing */}
        <Card>
          <CardHeader>
            <CardTitle>Legal Cases Service</CardTitle>
            <CardDescription>Test legal case operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Create Case Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Create Legal Case</h3>
              <div className="space-y-2">
                <Label htmlFor="caseTitle">Case Title</Label>
                <Input 
                  id="caseTitle" 
                  value={legalCaseTitle}
                  onChange={(e) => setLegalCaseTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caseDescription">Description</Label>
                <Input 
                  id="caseDescription" 
                  value={legalCaseDescription}
                  onChange={(e) => setLegalCaseDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleCreateCase} 
                disabled={createCaseMutation.isPending || !legalCaseTitle}
                className="w-full"
              >
                {createCaseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : 'Create Case'}
              </Button>
            </div>
            
            <Separator />
            
            {/* Update/Delete Case Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Update/Delete Legal Case</h3>
              <div className="space-y-2">
                <Label htmlFor="caseId">Case ID</Label>
                <Input 
                  id="caseId" 
                  value={legalCaseIdToUpdate}
                  onChange={(e) => setLegalCaseIdToUpdate(e.target.value)}
                  placeholder="Enter case ID to update or delete"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleUpdateCase} 
                  disabled={updateCaseMutation.isPending || !legalCaseIdToUpdate}
                  variant="outline"
                  className="flex-1"
                >
                  {updateCaseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : 'Mark as Resolved'}
                </Button>
                <Button 
                  onClick={handleDeleteCase} 
                  disabled={deleteCaseMutation.isPending || !legalCaseIdToUpdate}
                  variant="destructive"
                  className="flex-1"
                >
                  {deleteCaseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : 'Delete Case'}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Data Display */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Legal Cases Data</h3>
              {casesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : casesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {casesErrorData?.message || 'Failed to load legal cases'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <div className="px-4 py-3 text-sm font-medium bg-muted">
                    {legalCases?.length || 0} Legal Cases Loaded
                  </div>
                  <div className="max-h-60 overflow-auto">
                    {legalCases?.length ? (
                      legalCases.map((legalCase: any) => (
                        <div key={legalCase.id} className="px-4 py-2 text-sm border-t">
                          <div className="font-medium">{legalCase.title || 'N/A'}</div>
                          <div className="text-muted-foreground">
                            Status: {legalCase.status}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {legalCase.id}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground">
                        No legal cases found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="rounded-md border p-4 bg-muted/50">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium">Test Summary</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          This testing page allows you to verify that all service operations are working correctly after the migration.
          Use the forms above to test CRUD operations for both traffic fines and legal cases.
        </p>
      </div>
    </div>
  );
}
