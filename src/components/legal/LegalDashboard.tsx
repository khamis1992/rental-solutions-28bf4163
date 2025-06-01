import React from 'react';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

const LegalDashboard: React.FC = () => {
  const { legalCases, isLoading, error } = useLegalCases();

  // Calculate stats
  const totalCases = legalCases.length;
  const openCases = legalCases.filter(c => c.status === 'active' || c.status === 'pending').length;
  const resolvedCases = legalCases.filter(c => c.status === 'resolved').length;
  const highPriorityCases = legalCases.filter(c => c.priority === 'high').length;

  // Get 5 most recent cases
  const recentCases = [...legalCases]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span className="text-muted-foreground">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center bg-red-50 p-4 rounded">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
        <span className="text-red-700">Error loading dashboard: {error instanceof Error ? error.message : String(error)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{totalCases}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{openCases}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resolved Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{resolvedCases}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{highPriorityCases}</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Cases</h3>
        {recentCases.length === 0 ? (
          <div className="text-muted-foreground">No recent cases found.</div>
        ) : (
          <div className="space-y-2">
            {recentCases.map((c) => (
              <Card key={c.id} className="border p-2">
                <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-medium">{c.description || c.id}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(c.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{c.status || 'unknown'}</Badge>
                    <Badge variant="outline">{c.priority || 'unknown'}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LegalDashboard;
