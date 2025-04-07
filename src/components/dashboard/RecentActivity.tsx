
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import { formatCurrency } from "@/lib/utils";
import { Check, Clock, X } from "lucide-react";

interface RecentActivityProps {
  recentAgreements?: any[];
  recentPayments?: any[];
  isLoadingAgreements: boolean;
  isLoadingPayments: boolean;
}

export function RecentActivity({
  recentAgreements = [],
  recentPayments = [],
  isLoadingAgreements,
  isLoadingPayments
}: RecentActivityProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recent Agreements</CardTitle>
          <CardDescription>Latest rental agreements in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAgreements ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentAgreements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAgreements.slice(0, 5).map((agreement) => (
                  <TableRow key={agreement.id}>
                    <TableCell className="font-medium">
                      {agreement.agreement_number || `AGR-${agreement.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={agreement.status} />
                    </TableCell>
                    <TableCell>
                      {agreement.customer?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {agreement.vehicle ? 
                        `${agreement.vehicle.make} ${agreement.vehicle.model}` : 
                        "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No agreements found
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payments received</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPayments ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentPayments && recentPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Customer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.slice(0, 5).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {formatDate(payment.payment_date)}
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      {payment.customer_name || "Unknown"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              No payments found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Check className="mr-1 h-3 w-3" /> Active</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
    case 'expired':
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><X className="mr-1 h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
