import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, Gavel, Loader2, Plus } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';
import { LegalCase } from '@/types/legal-case';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

interface LegalCaseCompactViewProps {
  customerId?: string;
  agreementId?: string;
}

export const LegalCaseCompactView: React.FC<LegalCaseCompactViewProps> = ({
  customerId,
  agreementId
}) => {
  const navigate = useNavigate();
  const { getLegalCases } = useLegalCaseQuery();
  
  // Set up query parameters based on provided props
  const queryParams: Record<string, string> = {};
  if (customerId) queryParams.customerId = customerId;
  if (agreementId) queryParams.agreementId = agreementId;
  
  const { data: legalCases, isLoading, error } = getLegalCases(queryParams);
  
  const handleCreateCase = () => {
    navigate('/legal/new', { 
      state: { 
        customerId, 
        agreementId 
      } 
    });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-yellow-500">Active</Badge>;
      case 'closed':
        return <Badge className="bg-green-500">Closed</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500">Pending</Badge>;
      case 'escalated':
        return <Badge className="bg-red-500">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>Loading legal cases...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>Error loading legal cases</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'An error occurred while loading legal cases'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center">
            <Gavel className="mr-2 h-5 w-5" /> Legal Cases
          </CardTitle>
          <CardDescription>
            Legal cases associated with this {customerId ? 'customer' : 'agreement'}
          </CardDescription>
        </div>
        <Button onClick={handleCreateCase}>
          <Plus className="mr-2 h-4 w-4" /> New Case
        </Button>
      </CardHeader>
      <CardContent>
        {legalCases && legalCases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Filed Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Court</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {legalCases.map((legalCase: LegalCase) => (
                <TableRow 
                  key={legalCase.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/legal/${legalCase.id}`)}
                >
                  <TableCell className="font-medium">{legalCase.case_number || legalCase.id}</TableCell>
                  <TableCell>{legalCase.case_type}</TableCell>
                  <TableCell>{formatDate(legalCase.filing_date)}</TableCell>
                  <TableCell>{getStatusBadge(legalCase.status)}</TableCell>
                  <TableCell>{legalCase.court_name || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No legal cases found</p>
            <Button variant="outline" onClick={handleCreateCase}>
              <Plus className="mr-2 h-4 w-4" /> Create New Case
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
