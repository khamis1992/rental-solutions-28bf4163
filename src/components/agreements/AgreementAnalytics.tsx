
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AgreementAnalytics() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-medium">Agreements Analytics</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
        <CardDescription>Quick insights about your agreements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upcoming Expirations */}
          <div className="flex items-start space-x-3 bg-muted/50 p-3 rounded-lg">
            <Calendar className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Upcoming Expirations</h4>
              <p className="text-xs text-muted-foreground">12 agreements will expire within 30 days</p>
            </div>
          </div>
          
          {/* Revenue Trend */}
          <div className="flex items-start space-x-3 bg-muted/50 p-3 rounded-lg">
            <TrendingUp className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Revenue Increase</h4>
              <p className="text-xs text-muted-foreground">15% increase from last month</p>
            </div>
          </div>
          
          {/* Suggested Action */}
          <div className="flex items-start space-x-3 bg-muted/50 p-3 rounded-lg">
            <BarChart4 className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium">Agreement Distribution</h4>
              <p className="text-xs text-muted-foreground">70% active, 20% pending, 10% others</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
