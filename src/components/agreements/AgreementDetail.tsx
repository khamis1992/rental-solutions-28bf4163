import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  CalendarDays, User, Car, ChevronLeft, 
  Phone, Mail, MapPin, Clipboard
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AgreementTrafficFines } from './AgreementTrafficFines';
import { AgreementActions } from './AgreementActions';
import { AgreementTabs } from './AgreementTabs';
import { AgreementSummaryHeader } from './AgreementSummaryHeader';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useAgreements } from '@/hooks/use-agreements';

const AgreementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { getAgreement, isLoading: isAgreementLoading, error: agreementError } = useAgreements();
  const [agreement, setAgreement] = useState<any>(null);
  const { rentAmount, isLoading: isRentAmountLoading } = useRentAmount(agreement, id || '');

  useEffect(() => {
    if (id) {
      const fetchAgreementData = async () => {
        const data = await getAgreement(id);
        if (data) {
          setAgreement(data);
        }
      };
      fetchAgreementData();
    }
  }, [id, getAgreement]);

  if (isAgreementLoading || !agreement) {
    return <div className="flex items-center justify-center h-96">Loading agreement details...</div>;
  }

  if (agreementError) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <h2 className="text-xl font-semibold mb-4">Error Loading Agreement</h2>
        <p className="text-gray-500 mb-4">{agreementError instanceof Error ? agreementError.message : String(agreementError)}</p>
        <Button onClick={() => getAgreement(id || '')}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" className="gap-2" asChild>
          <a href="/agreements">
            <ChevronLeft className="h-4 w-4" /> Back to Agreements
          </a>
        </Button>
      </div>

      <AgreementSummaryHeader agreement={agreement} rentAmount={rentAmount} />

      <AgreementTabs agreement={agreement}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <Avatar className="h-10 w-10 bg-primary/10">
                  <AvatarFallback className="text-primary">
                    {agreement.customers?.full_name ? agreement.customers.full_name.charAt(0) : 'C'}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Name</span>
                  </div>
                  <p className="text-sm mt-1">{agreement.customers?.full_name || 'N/A'}</p>
                </div>
                
                {agreement.customers?.phone_number && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">Phone</span>
                    </div>
                    <p className="text-sm mt-1">{agreement.customers.phone_number}</p>
                  </div>
                )}
                
                {agreement.customers?.email && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-sm mt-1">{agreement.customers.email}</p>
                  </div>
                )}
                
                {agreement.customers?.address && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Address</span>
                    </div>
                    <p className="text-sm mt-1">{agreement.customers.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Vehicle Details</h3>
                <Car className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Make</div>
                    <p className="text-sm">{agreement.vehicles?.make || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Model</div>
                    <p className="text-sm">{agreement.vehicles?.model || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Year</div>
                    <p className="text-sm">{agreement.vehicles?.year || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Color</div>
                    <p className="text-sm">{agreement.vehicles?.color || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Plate</div>
                    <p className="text-sm">{agreement.vehicles?.license_plate || 'N/A'}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">VIN</div>
                    <p className="text-sm truncate">{agreement.vehicles?.vin || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Agreement Details</h3>
                <Clipboard className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Agreement #</div>
                    <p className="text-sm">{agreement.agreement_number}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Status</div>
                    <p className="text-sm">
                      <Badge variant={agreement.status === 'active' ? 'success' : 'secondary'}>
                        {agreement.status.toUpperCase()}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Start Date</div>
                    <p className="text-sm">{dateFormat(agreement.start_date)}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">End Date</div>
                    <p className="text-sm">{dateFormat(agreement.end_date)}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Rent Amount</div>
                    <p className="text-sm">QAR {rentAmount?.toLocaleString() || agreement.rent_amount?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground font-medium">Deposit</div>
                    <p className="text-sm">QAR {agreement.deposit_amount?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AgreementTabs>
    </div>
  );
};

const dateFormat = (date: string | Date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM d, yyyy');
};

export default AgreementDetail;
