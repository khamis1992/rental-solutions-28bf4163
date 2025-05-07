
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, Clock, DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AgreementStatsProps {
  className?: string;
}

export function AgreementStats({ className }: AgreementStatsProps) {
  // This would be replaced with real data from your hooks
  const stats = {
    totalAgreements: 156,
    totalTrend: 12, // percentage increase
    activeAgreements: 98,
    activeTrend: 5, // percentage increase
    pendingAgreements: 14,
    pendingTrend: -3, // percentage decrease
    monthlyRevenue: 45680,
    revenueTrend: 8, // percentage increase
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-medium">Agreement Statistics</CardTitle>
          <Badge variant="outline" className="px-2 py-1 text-xs">
            Last 30 days
          </Badge>
        </div>
        <CardDescription>Overview of your rental agreements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Agreements */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Agreements</p>
                <p className="text-2xl font-semibold">{stats.totalAgreements}</p>
              </div>
              <div className="bg-primary/10 rounded-full p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              {stats.totalTrend > 0 ? (
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{stats.totalTrend}%
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {stats.totalTrend}%
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </div>

          {/* Active Agreements */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Active Agreements</p>
                <p className="text-2xl font-semibold">{stats.activeAgreements}</p>
              </div>
              <div className="bg-green-500/10 rounded-full p-2">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{stats.activeTrend}%
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </div>

          {/* Pending Agreements */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pending Agreements</p>
                <p className="text-2xl font-semibold">{stats.pendingAgreements}</p>
              </div>
              <div className="bg-amber-500/10 rounded-full p-2">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                <TrendingDown className="h-3 w-3 mr-1" />
                {stats.pendingTrend}%
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-semibold">{formatCurrency(stats.monthlyRevenue)}</p>
              </div>
              <div className="bg-blue-500/10 rounded-full p-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-center mt-4">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{stats.revenueTrend}%
              </Badge>
              <span className="text-xs text-muted-foreground ml-2">from last month</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
