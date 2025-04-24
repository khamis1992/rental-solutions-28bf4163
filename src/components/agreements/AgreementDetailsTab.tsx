
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { Car, User } from 'lucide-react';

interface AgreementDetailsTabProps {
  agreement: Agreement;
  rentAmount: number | null;
  contractAmount: number | null;
}

export const AgreementDetailsTab = ({ 
  agreement,
  rentAmount,
  contractAmount 
}: AgreementDetailsTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Name</p>
              <p>{agreement.customers?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">Email</p>
              <p>{agreement.customers?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">Phone</p>
              <p>{agreement.customers?.phone_number || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">Address</p>
              <p>{agreement.customers?.address || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">Driver License</p>
              <p>{agreement.customers?.driver_license || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Vehicle</p>
              <p>{agreement.vehicles?.make} {agreement.vehicles?.model} ({agreement.vehicles?.year || 'N/A'})</p>
            </div>
            <div>
              <p className="font-medium">License Plate</p>
              <p>{agreement.vehicles?.license_plate}</p>
            </div>
            <div>
              <p className="font-medium">Color</p>
              <p>{agreement.vehicles?.color || 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">VIN</p>
              <p>{agreement.vehicles?.vin || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Agreement Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-medium">Monthly Rent</p>
              <p className="font-semibold">QAR {rentAmount?.toLocaleString() || '0'}</p>
            </div>
            
            <div>
              <p className="font-medium">Total Contract Amount</p>
              <p className="font-semibold">QAR {contractAmount?.toLocaleString() || agreement.total_amount?.toLocaleString() || '0'}</p>
            </div>
            
            <div>
              <p className="font-medium">Deposit Amount</p>
              <p>QAR {agreement.deposit_amount?.toLocaleString() || '0'}</p>
            </div>
            
            <div>
              <p className="font-medium">Daily Late Fee</p>
              <p>QAR {agreement.daily_late_fee?.toLocaleString() || '0'}</p>
            </div>
            
            <div>
              <p className="font-medium">Terms Accepted</p>
              <p>{agreement.terms_accepted ? 'Yes' : 'No'}</p>
            </div>
            
            <div>
              <p className="font-medium">Signature</p>
              <p>{agreement.signature_url ? 'Signed' : 'Not signed'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
