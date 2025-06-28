
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Car, User, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { Agreement, SimpleAgreement } from '@/types/database';
import { AgreementDeletionDialog } from '@/components/agreements/dialogs/AgreementDeletionDialog';

interface AgreementListProps {
  agreements: SimpleAgreement[];
  isLoading?: boolean;
  onDeleteAgreement?: (id: string) => void;
}

export const AgreementList: React.FC<AgreementListProps> = ({
  agreements,
  isLoading = false,
  onDeleteAgreement
}) => {
  const [deletingAgreement, setDeletingAgreement] = useState<SimpleAgreement | null>(null);

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'active': { variant: 'default' as const, label: 'نشط' },
      'completed': { variant: 'secondary' as const, label: 'مكتمل' },
      'cancelled': { variant: 'destructive' as const, label: 'ملغي' },
      'draft': { variant: 'outline' as const, label: 'مسودة' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { variant: 'outline' as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleDeleteClick = (agreement: SimpleAgreement) => {
    setDeletingAgreement(agreement);
  };

  const handleDeleteConfirm = () => {
    if (deletingAgreement && onDeleteAgreement) {
      onDeleteAgreement(deletingAgreement.id);
      setDeletingAgreement(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Convert SimpleAgreement to Agreement format for consistency
  const convertedAgreements = agreements.map((agreement: SimpleAgreement): Agreement => ({
    id: agreement.id,
    agreement_number: agreement.agreement_number,
    customer_id: agreement.customer_id,
    vehicle_id: agreement.vehicle_id,
    start_date: agreement.start_date,
    end_date: agreement.end_date,
    rent_amount: agreement.rent_amount,
    deposit_amount: agreement.deposit_amount,
    status: agreement.status,
    terms: agreement.terms,
    created_at: agreement.created_at,
    updated_at: agreement.updated_at,
  }));

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {convertedAgreements.map((agreement) => (
          <Card key={agreement.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  {agreement.agreement_number}
                </CardTitle>
                {getStatusBadge(agreement.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{(agreements.find(a => a.id === agreement.id) as SimpleAgreement)?.customer_name || 'غير محدد'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span>{(agreements.find(a => a.id === agreement.id) as SimpleAgreement)?.vehicle_license_plate || 'غير محدد'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(agreement.start_date).toLocaleDateString('ar-QA')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatCurrency(agreement.rent_amount)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  عرض
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-4 w-4 mr-1" />
                  تعديل
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDeleteClick(agreements.find(a => a.id === agreement.id) as SimpleAgreement)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AgreementDeletionDialog
        agreement={deletingAgreement}
        isOpen={!!deletingAgreement}
        onClose={() => setDeletingAgreement(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default AgreementList;
