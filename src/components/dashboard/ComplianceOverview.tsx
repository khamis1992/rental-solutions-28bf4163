
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompliance } from '@/hooks/use-compliance';
import { FileCheck, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ComplianceOverview = () => {
  const navigate = useNavigate();
  const { useList, useExpiringDocuments } = useCompliance();
  const { data: documents } = useList();
  const { data: expiringDocuments } = useExpiringDocuments(30);
  
  const validDocuments = documents?.filter(d => d.status === 'valid').length || 0;
  const expiredDocuments = documents?.filter(d => d.status === 'expired').length || 0;
  const expiringCount = expiringDocuments?.length || 0;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Compliance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 mr-4">
              <FileCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Valid Documents</p>
              <p className="text-2xl font-bold">{validDocuments}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-100 mr-4">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Expiring Soon</p>
              <p className="text-2xl font-bold">{expiringCount}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 mr-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Expired Documents</p>
              <p className="text-2xl font-bold">{expiredDocuments}</p>
            </div>
          </div>
        </div>
        
        {expiringCount > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Documents Expiring Soon</h3>
            <div className="border rounded-md">
              <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 font-medium text-sm">
                <div className="col-span-2">Type</div>
                <div className="col-span-4">Entity</div>
                <div className="col-span-3">Expiry Date</div>
                <div className="col-span-3">Status</div>
              </div>
              {expiringDocuments?.slice(0, 5).map((doc) => (
                <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 items-center text-sm">
                  <div className="col-span-2 capitalize">{doc.document_type.replace('_', ' ')}</div>
                  <div className="col-span-4">{doc.entity_type}: {doc.entity_id}</div>
                  <div className="col-span-3">{new Date(doc.expiry_date || '').toLocaleDateString()}</div>
                  <div className="col-span-3">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      Expiring Soon
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => navigate('/compliance')}>
                View All Documents
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplianceOverview;
