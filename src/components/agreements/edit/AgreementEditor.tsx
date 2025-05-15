
import React from 'react';
import { Agreement } from '@/types/agreement';
import { CustomerInfo } from '@/types/customer';

interface AgreementEditorProps {
  id: string;
  userId: string;
  agreement: Agreement;
  vehicleData: any;
  customerData?: CustomerInfo;
}

export const AgreementEditor: React.FC<AgreementEditorProps> = ({ 
  id, 
  userId, 
  agreement, 
  vehicleData,
  customerData
}) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Edit Agreement</h2>
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-md">
          <p className="text-sm text-slate-500">Agreement ID: {id}</p>
          <p className="text-lg font-medium">{agreement.agreement_number || 'No Agreement Number'}</p>
        </div>

        {/* Basic agreement information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Agreement Details</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> {agreement.status}</p>
              <p><span className="font-medium">Start Date:</span> {agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : 'Not set'}</p>
              <p><span className="font-medium">End Date:</span> {agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : 'Not set'}</p>
              <p><span className="font-medium">Total Amount:</span> {agreement.total_amount || 0} QAR</p>
              <p><span className="font-medium">Rent Amount:</span> {agreement.rent_amount || 0} QAR/month</p>
            </div>
          </div>

          {customerData && (
            <div>
              <h3 className="font-medium mb-2">Customer Information</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {customerData.full_name}</p>
                <p><span className="font-medium">Phone:</span> {customerData.phone_number}</p>
                <p><span className="font-medium">Email:</span> {customerData.email || 'Not provided'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Editor form would go here */}
        <div className="mt-6">
          <p className="text-amber-600">This is a placeholder for the agreement editor form. In a real implementation, you would add form controls here to edit the agreement properties.</p>
        </div>
      </div>
    </div>
  );
};
