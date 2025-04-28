
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gavel, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

interface LegalStatsProps {
  activeCases: number;
  highPriorityCases: number;
  pendingCases: number;
  resolvedCases: number;
  onViewAll: (filterType: string, value: string) => void;
}

export const LegalStats: React.FC<LegalStatsProps> = ({
  activeCases,
  highPriorityCases,
  pendingCases,
  resolvedCases,
  onViewAll
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-primary">
        <CardContent className="p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
              <h3 className="text-2xl font-bold text-primary">{activeCases}</h3>
            </div>
            <div className="p-2 rounded-full bg-primary/10">
              <Gavel className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-2">
            <Button variant="link" className="p-0 h-auto text-xs" onClick={() => onViewAll('status', 'active')}>
              View all active cases →
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-destructive">
        <CardContent className="p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">High Priority</p>
              <h3 className="text-2xl font-bold text-destructive">{highPriorityCases}</h3>
            </div>
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <div className="mt-2">
            <Button variant="link" className="p-0 h-auto text-xs text-destructive" onClick={() => onViewAll('priority', 'high')}>
              View high priority cases →
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
        <CardContent className="p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <h3 className="text-2xl font-bold text-amber-500">{pendingCases}</h3>
            </div>
            <div className="p-2 rounded-full bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <Button variant="link" className="p-0 h-auto text-xs text-amber-500" onClick={() => onViewAll('status', 'pending')}>
              View pending cases →
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
        <CardContent className="p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolved Cases</p>
              <h3 className="text-2xl font-bold text-green-500">{resolvedCases}</h3>
            </div>
            <div className="p-2 rounded-full bg-green-500/10">
              <ShieldAlert className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <div className="mt-2">
            <Button variant="link" className="p-0 h-auto text-xs text-green-500" onClick={() => onViewAll('status', 'resolved')}>
              View resolved cases →
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
