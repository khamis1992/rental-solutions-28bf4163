
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Gavel, Loader2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { LegalCase } from '@/types/legal-case';
import { CustomerObligation } from './CustomerLegalObligations';
import LegalCaseDetails from './LegalCaseDetails';
import { LegalCaseTable } from './cases/LegalCaseTable';
import { LegalCaseSearch } from './cases/LegalCaseSearch';

const LegalCaseManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CustomerObligation | null>(null);
  const navigate = useNavigate();
  const { legalCases, isLoading, error } = useLegalCases();

  const filteredCases = useMemo(() => {
    if (!legalCases) return [];
    
    return legalCases.filter(legalCase => {
      const fullName = legalCase.profiles?.full_name || '';
      const caseType = legalCase.case_type || '';
      const description = legalCase.description || '';
      const searchLower = searchQuery.toLowerCase();
      
      return fullName.toLowerCase().includes(searchLower) ||
        caseType.toLowerCase().includes(searchLower) ||
        description.toLowerCase().includes(searchLower);
    });
  }, [legalCases, searchQuery]);

  const handleCaseClick = (legalCase: LegalCase) => {
    const obligation: CustomerObligation = {
      id: legalCase.id,
      customerId: legalCase.customer_id,
      customerName: legalCase.profiles?.full_name || 'Unknown Customer',
      description: legalCase.description || '',
      obligationType: 'legal_case',
      amount: legalCase.amount_owed || 0,
      dueDate: new Date(),
      urgency: getUrgencyFromPriority(legalCase.priority),
      status: legalCase.status || 'pending',
      daysOverdue: 0
    };
    setSelectedCase(obligation);
  };

  const handleCloseCase = () => {
    setSelectedCase(null);
  };

  const handleCreateCase = () => {
    navigate('/legal/cases/new');
  };

  const getUrgencyFromPriority = (priority: string | null): 'low' | 'medium' | 'high' | 'critical' => {
    if (!priority) return 'medium';
    switch (priority) {
      case 'high':
        return 'critical';
      case 'medium':
        return 'high';
      case 'low':
        return 'medium';
      default:
        return 'medium';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>Loading legal case records...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading cases...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Cases</CardTitle>
          <CardDescription>An error occurred while loading legal cases</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-destructive">{error instanceof Error ? error.message : String(error)}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry Loading
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedCase) {
    return <LegalCaseDetails obligation={selectedCase} onClose={handleCloseCase} />;
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-medium flex items-center">
              <Gavel className="h-5 w-5 mr-2 text-muted-foreground" />
              Legal Cases
            </CardTitle>
            <CardDescription>
              Manage and track legal cases and obligations
            </CardDescription>
          </div>
          <Button className="w-full md:w-auto" onClick={handleCreateCase}>
            <Plus className="mr-2 h-4 w-4" /> New Case
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <LegalCaseSearch 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
          />
        </div>
        
        <LegalCaseTable 
          cases={filteredCases}
          onCaseClick={handleCaseClick}
        />
      </CardContent>
    </Card>
  );
};

export default LegalCaseManagement;
