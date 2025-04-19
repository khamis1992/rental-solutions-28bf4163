import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { asTableId, asLeaseIdColumn, asVehicleIdColumn, asPaymentStatusColumn } from '@/utils/database-type-helpers';

interface ReassignmentWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  onReassignmentComplete?: () => void;
}

export function ReassignmentWizard({ 
  open, 
  onOpenChange,
  agreementId,
  onReassignmentComplete
}: ReassignmentWizardProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [reassigned, setReassigned] = useState(false);
  const [currentAgreement, setCurrentAgreement] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  
  const fetchCurrentAgreement = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (*)
        `)
        .eq('id', asTableId('leases', agreementId))
        .single();
      
      if (error) {
        toast.error(`Failed to load agreement details: ${error.message}`);
        return;
      }
      
      if (data) {
        setCurrentAgreement(data);
        if (data.profiles && data.profiles[0]) {
          setSelectedCustomer(data.profiles[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching agreement:', err);
      toast.error('An error occurred while loading the agreement details.');
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query: string) => {
    setCustomerLoading(true);
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (*)
        `)
        .eq('id', asTableId('leases', agreementId))
        .single();
      
      if (error) {
        toast.error(`Failed to search customers: ${error.message}`);
        return;
      }
      
      // If there's a valid response, extract the customer data safely
      if (data && data.profiles) {
        // This approach avoids the spread operator issue 
        const customerData = data.profiles;
        setCustomers(Array.isArray(customerData) ? customerData : [customerData]);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      toast.error('An error occurred while searching for customers.');
    } finally {
      setCustomerLoading(false);
    }
  };
  
  const searchVehicles = async (available: boolean = true) => {
    setVehicleLoading(true);
    try {
      const statusFilter = available ? 'available' : 'in_use,maintenance';
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', asTableId('vehicles', agreementId));
      
      if (error) {
        toast.error(`Failed to search vehicles: ${error.message}`);
        return;
      }
      
      setVehicles(data || []);
    } catch (err) {
      console.error('Error searching vehicles:', err);
      toast.error('An error occurred while searching for vehicles.');
    } finally {
      setVehicleLoading(false);
    }
  };
  
  const reassignAgreement = async () => {
    setLoading(true);
    try {
      // Update payment records if needed
      const { error: paymentsError } = await supabase
        .from('unified_payments')
        .update({ status: asPaymentStatusColumn('pending') })
        .eq('lease_id', asLeaseIdColumn(agreementId));
      
      if (paymentsError) {
        console.error('Error updating payments:', paymentsError);
      }
      
      // Update the agreement with new customer and/or vehicle
      const updates: any = {};
      if (selectedCustomer && selectedCustomer.id) {
        updates.customer_id = selectedCustomer.id;
      }
      if (selectedVehicle && selectedVehicle.id) {
        updates.vehicle_id = selectedVehicle.id;
      }
      
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('leases')
          .update(updates)
          .eq('id', asTableId('leases', agreementId));
        
        if (error) {
          toast.error(`Failed to reassign agreement: ${error.message}`);
          return;
        }
        
        toast.success('Agreement successfully reassigned!');
        setReassigned(true);
        if (onReassignmentComplete) {
          onReassignmentComplete();
        }
      }
    } catch (err) {
      console.error('Error reassigning agreement:', err);
      toast.error('An error occurred during reassignment.');
    } finally {
      setLoading(false);
    }
  };
  
  React.useEffect(() => {
    if (open && agreementId) {
      fetchCurrentAgreement();
    } else {
      setStep(0);
      setReassigned(false);
      setCurrentAgreement(null);
      setSelectedCustomer(null);
      setSelectedVehicle(null);
    }
  }, [open, agreementId]);
  
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
  };
  
  const handleVehicleSelect = (vehicle: any) => {
    setSelectedVehicle(vehicle);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reassign Agreement</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {step === 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Current Agreement</h3>
                {currentAgreement ? (
                  <div>
                    <p>Agreement Number: {currentAgreement.agreement_number}</p>
                    <p>Customer: {currentAgreement.profiles?.full_name || 'N/A'}</p>
                    <p>Vehicle: {currentAgreement.vehicle_id || 'N/A'}</p>
                  </div>
                ) : (
                  <p>Loading agreement details...</p>
                )}
              </div>
            )}
            
            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Select New Customer</h3>
                <input
                  type="text"
                  placeholder="Search for customer..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchCustomers(e.target.value);
                  }}
                  className="w-full p-2 border rounded"
                />
                
                {customerLoading ? (
                  <p>Loading customers...</p>
                ) : (
                  <ul>
                    {customers.map((customer) => (
                      <li
                        key={customer.id}
                        className={`p-2 rounded cursor-pointer ${
                          selectedCustomer?.id === customer.id ? 'bg-primary text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        {customer.full_name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {step === 2 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Select New Vehicle</h3>
                {vehicleLoading ? (
                  <p>Loading vehicles...</p>
                ) : (
                  <ul>
                    {vehicles.map((vehicle) => (
                      <li
                        key={vehicle.id}
                        className={`p-2 rounded cursor-pointer ${
                          selectedVehicle?.id === vehicle.id ? 'bg-primary text-white' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handleVehicleSelect(vehicle)}
                      >
                        {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {reassigned ? 'Close' : 'Cancel'}
              </Button>
              {!reassigned && (
                <Button 
                  onClick={step === 0 ? () => setStep(1) : reassignAgreement}
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {step === 0 ? 'Next' : 'Reassign'}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
