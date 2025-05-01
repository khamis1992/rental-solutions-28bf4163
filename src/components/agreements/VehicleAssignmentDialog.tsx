import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { useDataHandler } from "@/hooks/use-data-handler"
import { LEASE_STATUSES, PAYMENT_STATUSES } from '@/types/database-common';
import { supabase } from '@/lib/supabase';

interface VehicleAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string | null;
  agreementId: string | null;
  onVehicleAssigned: () => void;
}

export default function VehicleAssignmentDialog({
  isOpen,
  onClose,
  vehicleId,
  agreementId,
  onVehicleAssigned
}: VehicleAssignmentDialogProps) {
  const [existingLeaseId, setExistingLeaseId] = useState<string | null>(null);
  const [existingAgreementNumber, setExistingAgreementNumber] = useState<string | null>(null);
  const [hasExistingLease, setHasExistingLease] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    id: string | null;
    amount: number | null;
    paymentDate: string | null;
    status: string | null;
    description: string | null;
    paymentMethod: string | null;
    daysOverdue: number | null;
    lateFeeAmount: number | null;
  }>({
    id: null,
    amount: null,
    paymentDate: null,
    status: null,
    description: null,
    paymentMethod: null,
    daysOverdue: null,
    lateFeeAmount: null
  });
  const [trafficFines, setTrafficFines] = useState<any[]>([]);

  useEffect(() => {
    async function fetchExistingAgreement() {
      try {
        // Check if there's already an active lease for this vehicle
        const { data: existingLeases, error: leaseError } = await supabase
          .from('leases')
          .select('id, agreement_number')
          .eq('vehicle_id', vehicleId as string)
          .eq('status', LEASE_STATUSES.ACTIVE as string)
          .maybeSingle();

        if (leaseError) {
          console.error("Error checking existing leases:", leaseError);
          return;
        }

        if (existingLeases && 'id' in existingLeases) {
          setExistingLeaseId(existingLeases.id);
          setExistingAgreementNumber(existingLeases.agreement_number);
          setHasExistingLease(true);
          
          // If we have an existing lease, fetch its payment details
          const { data: paymentData, error: paymentError } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('lease_id', existingLeases.id as string)
            .eq('status', PAYMENT_STATUSES.PENDING as any)
            .maybeSingle();

          if (paymentError) {
            console.error("Error fetching payment data:", paymentError);
          } else if (paymentData && 'id' in paymentData) {
            setPaymentInfo({
              id: paymentData.id,
              amount: paymentData.amount,
              paymentDate: paymentData.payment_date,
              status: paymentData.status,
              description: paymentData.description,
              paymentMethod: paymentData.payment_method,
              daysOverdue: paymentData.days_overdue,
              lateFeeAmount: paymentData.late_fine_amount
            });
          }

          // Fetch any traffic fines for the existing lease
          const { data: fines, error: finesError } = await supabase
            .from('traffic_fines')
            .select('*')
            .eq('lease_id', existingLeases.id as string)
            .eq('payment_status', 'pending');

          if (finesError) {
            console.error("Error fetching traffic fines:", finesError);
          } else {
            setTrafficFines(fines || []);
          }
        }
      } catch (error) {
        console.error("Error in fetchExistingAgreement:", error);
      }
    }

    if (vehicleId && isOpen) {
      fetchExistingAgreement();
    }
  }, [vehicleId, isOpen]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vehicle Assignment</AlertDialogTitle>
          <AlertDialogDescription>
            {hasExistingLease ? (
              <>
                This vehicle is currently assigned to agreement #
                {existingAgreementNumber}.
                <br />
                <br />
                {paymentInfo.id && (
                  <>
                    There is a pending payment of ${paymentInfo.amount} due on
                    {paymentInfo.paymentDate}.
                    <br />
                  </>
                )}
                {trafficFines.length > 0 && (
                  <>
                    There are {trafficFines.length} pending traffic fines.
                    <br />
                  </>
                )}
                <br />
                Are you sure you want to reassign this vehicle?
              </>
            ) : (
              "Are you sure you want to assign this vehicle to the agreement?"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onVehicleAssigned}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
