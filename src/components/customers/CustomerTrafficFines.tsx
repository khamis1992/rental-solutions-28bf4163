import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { hasData } from '@/utils/supabase-type-helpers';
import { ExclamationTriangleIcon } from '@/components/icons/radix-shim';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Loader2 } from 'lucide-react';
import { generateStandardReport } from '@/utils/report-utils';
import { toast } from 'sonner';
import { logOperation } from '@/utils/monitoring-utils';

interface CustomerTrafficFinesProps {
  customerId: string;
}

type TrafficFine = {
  id: string;
  violation_number: string;
  license_plate: string;
  vehicle_id: string;
  violation_date: string;
  fine_amount: number;
  violation_charge: string;
  payment_status: string;
  fine_location: string;
  lease_id: string;
  payment_date: string | null;
};

type VehicleInfo = {
  id: string;
  make: string;
  model: string;
};

type LeaseInfo = {
  id: string;
  start_date: string;
  end_date: string | null;
  agreement_number: string;
  status?: string;
};

type LeaseWithVehicle = LeaseInfo & {
  vehicles: {
    id: string;
    make: string;
    model: string;
    year?: string;
    license_plate?: string;
  };
};

type CustomerInfo = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  driver_license: string | null;
};

export function CustomerTrafficFines({ customerId }: CustomerTrafficFinesProps) {
  const [fines, setFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Record<string, VehicleInfo>>({});
  const [leases, setLeases] = useState<Record<string, LeaseInfo>>({});
  const [invalidFines, setInvalidFines] = useState<TrafficFine[]>([]);
  const [showInvalidFines, setShowInvalidFines] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [activeLeaseInfo, setActiveLeaseInfo] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!customerId) return;

      try {
        setIsLoading(true);
        
        // Fetch customer information from profiles table
        const { data: customer, error: customerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', customerId)
          .single();
          
        if (customer && !customerError) {
          logOperation('customerTrafficFines.fetchCustomer', 'success', 
            { customerId: customer.id }, 'Customer data fetched successfully');
          setCustomerInfo({
            id: customer.id,
            full_name: customer.full_name,
            email: customer.email,
            phone: customer.phone_number,
            driver_license: customer.driver_license
          });
        } else {
          logOperation('customerTrafficFines.fetchCustomer', 'error', 
            { customerId }, customerError?.message || 'Error fetching customer');
        }

        const leaseResponse = await supabase
          .from('leases')
          .select(`
            id, 
            start_date, 
            end_date, 
            agreement_number,
            vehicles(*)
          `)
          .eq('customer_id', customerId);

        if (!hasData(leaseResponse)) {
          console.error('Error fetching leases:', leaseResponse.error);
          setIsLoading(false);
          return;
        }

        const leaseData = leaseResponse.data as LeaseWithVehicle[];
        
        if (!leaseData || leaseData.length === 0) {
          logOperation('customerTrafficFines.fetchLeases', 'warning', 
            { customerId }, 'No lease data found for customer');
          setIsLoading(false);
          return;
        }
        
        // Get active lease for report
        const activeLease = leaseData.find(lease => lease.status === 'active') || leaseData[0];
        if (activeLease) {
          setActiveLeaseInfo(activeLease);
        }

        const leaseMap: Record<string, LeaseInfo> = {};
        leaseData.forEach(lease => {
          if (lease && lease.id) {
            leaseMap[lease.id] = {
              id: lease.id,
              start_date: lease.start_date,
              end_date: lease.end_date,
              agreement_number: lease.agreement_number,
              status: lease.status
            };
          }
        });
        setLeases(leaseMap);

        const leaseIds = leaseData.map(lease => lease.id);
        
        const finesResponse = await supabase
          .from('traffic_fines')
          .select('*')
          .in('lease_id', leaseIds);

        if (!hasData(finesResponse)) {
          console.error('Error fetching fines:', finesResponse.error);
          setIsLoading(false);
          return;
        }

        const fineData = finesResponse.data as TrafficFine[];
        
        const validFines: TrafficFine[] = [];
        const invalidFines: TrafficFine[] = [];

        fineData.forEach(fine => {
          if (!fine.lease_id || !fine.violation_date) {
            invalidFines.push(fine);
            return;
          }
          
          const lease = leaseMap[fine.lease_id];
          if (!lease) {
            invalidFines.push(fine);
            return;
          }
          
          const violationDate = new Date(fine.violation_date);
          const startDate = new Date(lease.start_date);
          const endDate = lease.end_date ? new Date(lease.end_date) : new Date();
          
          if (violationDate >= startDate && violationDate <= endDate) {
            validFines.push(fine);
          } else {
            invalidFines.push(fine);
          }
        });
        
        logOperation('customerTrafficFines.processFines', 'success', 
          { customerId, validCount: validFines.length, invalidCount: invalidFines.length }, 
          `Found ${validFines.length} valid fines and ${invalidFines.length} invalid fines`);

        const vehicleIds = Array.from(
          new Set(
            [...validFines, ...invalidFines]
              .filter(fine => fine && fine.vehicle_id)
              .map(fine => fine.vehicle_id)
          )
        );
        
        if (vehicleIds.length > 0) {
          const vehiclesResponse = await supabase
            .from('vehicles')
            .select('id, make, model')
            .in('id', vehicleIds);

          if (hasData(vehiclesResponse)) {
            const vehicleData = vehiclesResponse.data as VehicleInfo[];
            const vehicleMap: Record<string, VehicleInfo> = {};
            
            vehicleData.forEach(vehicle => {
              vehicleMap[vehicle.id] = {
                id: vehicle.id,
                make: vehicle.make,
                model: vehicle.model
              };
            });
            
            setVehicles(vehicleMap);
          } else {
            logOperation('customerTrafficFines.fetchVehicles', 'warning', 
              { vehicleIds }, 'Failed to fetch vehicle information');
          }
        }

        setFines(validFines);
        setInvalidFines(invalidFines);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching traffic fines:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, [customerId]);

  const getVehicleInfo = (vehicleId: string | null): string => {
    if (!vehicleId || !vehicles[vehicleId]) return 'Unknown Vehicle';
    const vehicle = vehicles[vehicleId];
    return `${vehicle.make} ${vehicle.model}`;
  };

  const getLeaseInfo = (leaseId: string | null): string => {
    if (!leaseId || !leases[leaseId]) return 'N/A';
    return leases[leaseId].agreement_number || 'Unknown Agreement';
  };

  const generateTrafficFinesReport = async () => {
    try {
      logOperation('customerTrafficFines.generateReport', 'success', 
        { customerId: customerInfo?.id }, 'Generating traffic fines report');
      
      const doc = generateStandardReport(
        'Traffic Violations Report',
        undefined,
        (doc, startY) => {
          let currentY = startY;
          
          // Customer Information section
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('CUSTOMER INFORMATION', 20, currentY);
          currentY += 15;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          if (customerInfo) {
            const customerInfoText = [
              `Name: ${customerInfo.full_name}`,
              `Phone: ${customerInfo.phone || 'N/A'}`,
              `Email: ${customerInfo.email || 'N/A'}`,
              `License: ${customerInfo.driver_license || 'N/A'}`
            ];
            
            customerInfoText.forEach(info => {
              doc.text(info, 20, currentY);
              currentY += 7;
            });
          } else {
            doc.text('Customer information not available', 20, currentY);
            currentY += 7;
          }
          
          currentY += 10;

          // Agreement Information section
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('AGREEMENT INFORMATION', 20, currentY);
          currentY += 15;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          if (activeLeaseInfo) {
            const vehicle = activeLeaseInfo.vehicles;
            const agreementInfo = [
              `Agreement Number: ${activeLeaseInfo.agreement_number || 'N/A'}`,
              `Vehicle: ${vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year || 'N/A'})` : 'N/A'}`,
              `License Plate: ${vehicle ? vehicle.license_plate || 'N/A' : 'N/A'}`,
              `Start Date: ${activeLeaseInfo.start_date ? format(new Date(activeLeaseInfo.start_date), 'dd/MM/yyyy') : 'N/A'}`,
              `End Date: ${activeLeaseInfo.end_date ? format(new Date(activeLeaseInfo.end_date), 'dd/MM/yyyy') : 'N/A'}`
            ];
            
            agreementInfo.forEach(info => {
              doc.text(info, 20, currentY);
              currentY += 7;
            });
          } else {
            doc.text('No active agreement found', 20, currentY);
            currentY += 7;
          }
          
          currentY += 15;
          
          // Summary section
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('VIOLATIONS SUMMARY', 20, currentY);
          currentY += 15;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          const totalAmount = finesToDisplay.reduce((sum, fine) => sum + fine.fine_amount, 0);
          const paidFines = finesToDisplay.filter(fine => fine.payment_status === 'paid').length;
          const pendingFines = finesToDisplay.length - paidFines;
          
          const summaryInfo = [
            `Total Violations: ${finesToDisplay.length}`,
            `Total Amount: ${formatCurrency(totalAmount)}`,
            `Paid Violations: ${paidFines}`,
            `Pending Violations: ${pendingFines}`
          ];
          
          summaryInfo.forEach(info => {
            doc.text(info, 20, currentY);
            currentY += 7;
          });
          
          currentY += 15;

          // Violations Detail Table
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('VIOLATION DETAILS', 20, currentY);
          currentY += 15;
          
          // Table headers
          doc.setFontSize(10);
          const headers = ['Date', 'License Plate', 'Amount'];
          const columnWidths = [40, 40, 40];
          let xPos = 20;
          
          headers.forEach((header, i) => {
            doc.text(header, xPos, currentY);
            xPos += columnWidths[i];
          });
          
          // Table content
          currentY += 8;
          doc.setFont('helvetica', 'normal');

          finesToDisplay.forEach((fine) => {
            if (currentY > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              currentY = 20;
            }

            xPos = 20;
            const rowData = [
              fine.violation_date ? format(new Date(fine.violation_date), 'dd/MM/yyyy') : 'N/A',
              fine.license_plate || 'N/A',
              formatCurrency(fine.fine_amount)
            ];

            rowData.forEach((text, i) => {
              doc.text(text.toString(), xPos, currentY);
              xPos += columnWidths[i];
            });
            
            currentY += 7;
          });
          
          // Footer with generation date
          currentY += 15;
          doc.setFontSize(8);
          doc.setTextColor(0);
          doc.text(`Report generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, currentY);
          
          return currentY;
        }
      );
      
      doc.save('traffic-violations-report.pdf');
      toast.success('Traffic violations report generated successfully');
    } catch (error) {
      logOperation('customerTrafficFines.generateReport', 'error', 
        { customerId: customerInfo?.id }, 'Failed to generate traffic violations report');
      toast.error('Failed to generate traffic violations report');
    }
  };

  const finesToDisplay = showInvalidFines ? [...fines, ...invalidFines] : fines;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Traffic Fines</CardTitle>
            <CardDescription>Fines associated with this customer</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {finesToDisplay.length > 0 && (
              <Button 
                variant="outline"
                onClick={generateTrafficFinesReport}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
            )}
            {invalidFines.length > 0 && (
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  className="h-4 w-4" 
                  checked={showInvalidFines}
                  onChange={(e) => setShowInvalidFines(e.target.checked)}
                />
                <span className="text-sm">Show all fines including invalid dates</span>
              </label>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            {invalidFines.length > 0 && (
              <Alert variant="warning" className="mb-4">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <AlertTitle>Invalid Fine Assignments</AlertTitle>
                <AlertDescription>
                  {invalidFines.length} traffic {invalidFines.length === 1 ? 'fine is' : 'fines are'} assigned to this customer but 
                  {invalidFines.length === 1 ? ' its violation date falls' : ' their violation dates fall'} outside the lease periods. 
                  {!showInvalidFines && ' These are hidden by default.'}
                </AlertDescription>
              </Alert>
            )}

            {finesToDisplay.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Violation #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Agreement #</TableHead>
                    <TableHead>Validity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finesToDisplay.map((fine) => {
                    if (!fine?.id) return null;

                    const isValid = fines.some(validFine => validFine.id === fine.id);
                    
                    return (
                      <TableRow key={fine.id}>
                        <TableCell>{fine.violation_number}</TableCell>
                        <TableCell>
                          {fine.violation_date ? format(new Date(fine.violation_date), 'dd/MM/yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>{getVehicleInfo(fine.vehicle_id)}</TableCell>
                        <TableCell>{fine.license_plate}</TableCell>
                        <TableCell>{formatCurrency(fine.fine_amount)}</TableCell>
                        <TableCell>
                          {fine.payment_status === 'paid' ? (
                            <Badge>Paid</Badge>
                          ) : fine.payment_status === 'pending' ? (
                            <Badge>Pending</Badge>
                          ) : fine.payment_status === 'disputed' ? (
                            <Badge>Disputed</Badge>
                          ) : (
                            <Badge>Unknown</Badge>
                          )}
                        </TableCell>
                        <TableCell>{getLeaseInfo(fine.lease_id)}</TableCell>
                        <TableCell>
                          {isValid ? (
                            <Badge>
                              Valid
                            </Badge>
                          ) : (
                            <Badge>
                              Invalid Period
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-muted/30">
                <ExclamationTriangleIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No Traffic Fines</h3>
                <p className="text-sm text-muted-foreground">This customer has no valid traffic fines.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
