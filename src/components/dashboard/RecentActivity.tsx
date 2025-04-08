
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { RecentAgreement, RecentPayment } from "@/hooks/use-dashboard";

interface RecentActivityProps {
  recentAgreements: RecentAgreement[] | undefined;
  recentPayments: RecentPayment[] | undefined;
  isLoadingAgreements: boolean;
  isLoadingPayments: boolean;
}

export function RecentActivity({
  recentAgreements,
  recentPayments,
  isLoadingAgreements,
  isLoadingPayments
}: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Recent agreements and payments in your system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="agreements">
          <TabsList className="mb-4">
            <TabsTrigger value="agreements">Recent Agreements</TabsTrigger>
            <TabsTrigger value="payments">Recent Payments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agreements">
            {isLoadingAgreements ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentAgreements && recentAgreements.length > 0 ? (
              <div className="space-y-4">
                {recentAgreements.map((agreement) => (
                  <div key={agreement.id} className="flex items-center justify-between border-b pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{agreement.customer_name}</p>
                        <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'}>
                          {agreement.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {agreement.vehicle_make} {agreement.vehicle_model} - {agreement.vehicle_license_plate}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(agreement.rent_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(agreement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent agreements found</p>
            )}
          </TabsContent>
          
          <TabsContent value="payments">
            {isLoadingPayments ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : recentPayments && recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-2">
                    <div className="space-y-1">
                      <p className="font-medium">{payment.customer_name}</p>
                      <div className="text-sm text-muted-foreground">
                        {payment.status === 'completed' ? 'Payment completed' : 'Payment recorded'}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No recent payments found</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
