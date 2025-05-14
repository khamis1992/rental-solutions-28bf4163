import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Loader2, AlertCircle, CheckCircle2, CircleDollarSign, CalendarDays } from 'lucide-react';
import { format, differenceInMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AgreementTrafficFineAnalyticsProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

export function AgreementTrafficFineAnalytics({ agreementId, startDate, endDate }: AgreementTrafficFineAnalyticsProps) {
  const { fines = [], isLoading } = useTrafficFines(agreementId);
  
  const agreementFines = useMemo(() => {
    if (!fines) return [];
    return fines.filter(fine => fine.lease_id === agreementId);
  }, [fines, agreementId]);
  
  const totalFineAmount = useMemo(() => {
    return agreementFines.reduce((total, fine) => total + (fine.fine_amount || 0), 0);
  }, [agreementFines]);
  
  const paymentStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = { paid: 0, pending: 0, disputed: 0 };
    
    agreementFines.forEach(fine => {
      const status = fine.payment_status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [agreementFines]);
  
  const monthlyFineData = useMemo(() => {
    if (agreementFines.length === 0) return [];
    
    // Create a map of months within the agreement period
    const months: Record<string, number> = {};
    const totalMonths = differenceInMonths(endDate, startDate) + 1;
    
    for (let i = 0; i < totalMonths; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      const monthKey = format(date, 'MMM yyyy');
      months[monthKey] = 0;
    }
    
    // Count fines in each month
    agreementFines.forEach(fine => {
      if (!fine.violation_date) return;
      const date = new Date(fine.violation_date);
      const monthKey = format(date, 'MMM yyyy');
      
      // Only count if it's within our range
      if (months[monthKey] !== undefined) {
        months[monthKey] += 1;
      }
    });
    
    return Object.entries(months).map(([month, count]) => ({
      month,
      count
    }));
  }, [agreementFines, startDate, endDate]);
  
  const COLORS = ['#00C49F', '#FFBB28', '#FF8042'];
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines Analytics</CardTitle>
          <CardDescription>Loading traffic fine analytics...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (agreementFines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Fines Analytics</CardTitle>
          <CardDescription>No traffic fines recorded for this agreement</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">There are no traffic fines recorded for this rental period.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Fines Analytics</CardTitle>
        <CardDescription>
          Analysis of traffic violations during the rental period
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex items-center p-4 rounded-lg bg-muted/50">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground mr-4" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Fines</p>
              <p className="text-2xl font-bold">{agreementFines.length}</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 rounded-lg bg-muted/50">
            <CircleDollarSign className="h-8 w-8 text-muted-foreground mr-4" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">
                QAR {totalFineAmount.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center p-4 rounded-lg bg-muted/50">
            <CalendarDays className="h-8 w-8 text-muted-foreground mr-4" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date Range</p>
              <p className="text-base font-medium">
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium mb-4">Monthly Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyFineData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" angle={-45} textAnchor="end" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} fines`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4">Payment Status</h3>
            <div className="h-64 flex flex-col items-center justify-center">
              {paymentStatusData.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} fines`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  No payment status data available
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
