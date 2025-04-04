// Fix status comparison issues
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

import { useAgreements, SimpleAgreement } from '@/hooks/use-agreements';
import { AgreementStatus } from '@/lib/validation-schemas/agreement';

const CustomerDetail = ({ customer }) => {
  const { customerId } = useParams<{ customerId: string }>();
  const [activeAgreements, setActiveAgreements] = useState<SimpleAgreement[]>([]);
  
  const { agreements, isLoading, error } = useAgreements({ customerId: customer.id });
  
  useEffect(() => {
    if (agreements) {
      setActiveAgreements(agreements);
    }
  }, [agreements]);
  
  const getBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case AgreementStatus.ACTIVE.toLowerCase():
        return "success";
      case AgreementStatus.PENDING.toLowerCase():
        return "warning";
      case AgreementStatus.CANCELLED.toLowerCase():
        return "destructive";
      case AgreementStatus.CLOSED.toLowerCase():
        return "outline";
      case AgreementStatus.EXPIRED.toLowerCase():
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={`https://avatar.vercel.sh/${customer?.full_name}.png`} alt={customer?.full_name} />
            <AvatarFallback>{customer?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-lg font-semibold">{customer?.full_name}</h2>
            <p className="text-sm text-muted-foreground">{customer?.email}</p>
            <p className="text-sm text-muted-foreground">{customer?.phone}</p>
            <p className="text-sm text-muted-foreground">
              ID Number: {customer?.id_number} ({customer?.id_type})
            </p>
            <p className="text-sm text-muted-foreground">Nationality: {customer?.nationality}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-1 md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>Rental Agreements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="m-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error instanceof Error ? error.message : String(error)}</AlertDescription>
            </Alert>
          )}
          {isLoading ? (
            <div className="p-4">Loading agreements...</div>
          ) : activeAgreements && activeAgreements.length > 0 ? (
            <ScrollArea className="h-[400px] w-full rounded-md">
              <div className="divide-y divide-border">
                {activeAgreements.map((agreement) => (
                  <div key={agreement.id} className="p-4 hover:bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/agreements/${agreement.id}`} className="font-medium hover:underline">
                          Agreement #{agreement.agreement_number}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(agreement.start_date), 'MMM d, yyyy')} - {format(new Date(agreement.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant={getBadgeVariant(agreement.status)}>
                        {agreement.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-4 text-center text-muted-foreground">No rental agreements found for this customer.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetail;
