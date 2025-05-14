
import React from 'react';
import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell 
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { formatDistance } from 'date-fns';

// Define colors for the pie chart
const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

const LegalReport = () => {
  const { getLegalCases } = useLegalCaseQuery();
  const { data: legalCases, isLoading, isError, error } = getLegalCases({});

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading legal case data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading legal cases</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error instanceof Error ? error.message : String(error)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare status distribution data for chart
  const statusCounts: Record<string, number> = {};
  legalCases.forEach(legalCase => {
    const status = legalCase.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  
  // Prepare case type distribution data for chart
  const typeCounts: Record<string, number> = {};
  legalCases.forEach(legalCase => {
    const caseType = legalCase.case_type || 'unknown';
    typeCounts[caseType] = (typeCounts[caseType] || 0) + 1;
  });

  const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

  // Calculate total amount owed
  const totalAmountOwed = legalCases.reduce((sum, c) => sum + (c.amount_owed || 0), 0);
  
  // Get recent cases
  const recentCases = [...legalCases]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Legal Case Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Case Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#6366F1" name="Number of Cases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Legal Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Case Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCases.map((item) => {
                  const customerName = item.profiles?.full_name || 'Unknown Customer';
                  const createdAt = new Date(item.created_at);
                  const timeAgo = formatDistance(createdAt, new Date(), { addSuffix: true });
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{customerName}</TableCell>
                      <TableCell>{item.case_type}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        {item.amount_owed ? formatCurrency(item.amount_owed) : 'N/A'}
                      </TableCell>
                      <TableCell>{timeAgo}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">No legal cases found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string | null }) => {
  let variant = 'default';
  
  switch (status) {
    case 'pending_reminder':
      variant = 'outline'; // Gray
      break;
    case 'reminder_sent':
      variant = 'secondary'; // Muted
      break;
    case 'escalated':
      variant = 'destructive'; // Red
      break;
    case 'in_progress':
      variant = 'warning'; // Amber/orange
      break;
    case 'resolved':
      variant = 'success'; // Green
      break;
    default:
      variant = 'outline';
  }
  
  return (
    <Badge variant={variant as any}>
      {status?.replace('_', ' ') || 'Unknown'}
    </Badge>
  );
};

export default LegalReport;
