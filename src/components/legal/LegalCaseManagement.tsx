
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gavel, Plus, Search, MoreVertical, FileText, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import LegalCaseDetails from './LegalCaseDetails';
import { CustomerObligation } from './CustomerLegalObligations';
import { useMemo } from 'react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';

const MOCK_CASES = [
  {
    id: '1',
    customerId: 'cust-1',
    customerName: 'Ahmed Al-Mansour',
    description: 'Overdue payments (Agreement #AGR-202402-1234)',
    obligationType: 'payment',
    amount: 12000,
    dueDate: new Date(2023, 11, 15),
    urgency: 'high',
    status: 'Overdue Payment',
    daysOverdue: 28,
    agreementId: 'agr-1',
    agreementNumber: 'AGR-202402-1234'
  },
  {
    id: '2',
    customerId: 'cust-2',
    customerName: 'Fatima Al-Qasimi',
    description: 'Unpaid traffic fine (Agreement #AGR-202401-5678)',
    obligationType: 'traffic_fine',
    amount: 3500,
    dueDate: new Date(2024, 0, 5),
    urgency: 'medium',
    status: 'Unpaid Fine',
    daysOverdue: 15,
    agreementId: 'agr-2',
    agreementNumber: 'AGR-202401-5678'
  },
  {
    id: '3',
    customerId: 'cust-3',
    customerName: 'Mohamed Al-Farsi',
    description: 'Legal case (in legal process)',
    obligationType: 'legal_case',
    amount: 25000,
    dueDate: new Date(2023, 10, 20),
    urgency: 'critical',
    status: 'Legal Case',
    daysOverdue: 60,
    agreementId: 'agr-3',
    agreementNumber: 'AGR-202311-9012'
  }
];

const LegalCaseManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<CustomerObligation | null>(null);
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  const filteredCases = useMemo(() => {
    return MOCK_CASES.filter(
      (legalCase) =>
        legalCase.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        legalCase.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        legalCase.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (legalCase.agreementNumber && legalCase.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const handleCaseClick = (legalCase: any) => {
    setSelectedCase(legalCase);
  };

  const handleCloseCase = () => {
    setSelectedCase(null);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">{t('legal.urgency.critical')}</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">{t('legal.urgency.high')}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t('legal.urgency.medium')}</Badge>;
      case 'low':
      default:
        return <Badge variant="outline">{t('legal.urgency.low')}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status.includes('Overdue')) {
      return <Badge variant="destructive">{t(`legal.status.${status.toLowerCase().replace(' ', '')}`)}</Badge>;
    } else if (status.includes('Unpaid')) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">{t(`legal.status.${status.toLowerCase().replace(' ', '')}`)}</Badge>;
    } else if (status.includes('Legal Case')) {
      return <Badge className="bg-purple-500 hover:bg-purple-600">{t('legal.status.legalcase')}</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {selectedCase ? (
        <LegalCaseDetails obligation={selectedCase} onClose={handleCloseCase} />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>{t('legal.cases')}</CardTitle>
                <CardDescription>
                  {t('legal.manageCases')}
                </CardDescription>
              </div>
              <Button className={`w-full md:w-auto flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('legal.newCase')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center ${isRTL ? 'space-x-reverse' : 'space-x-2'} mb-4`}>
              <div className="relative flex-1">
                <Search className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-2.5 h-4 w-4 text-muted-foreground`} />
                <Input
                  placeholder={t('legal.searchCases')}
                  className={isRTL ? 'pr-8' : 'pl-8'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('legal.customer')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('common.description')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('common.amount')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('common.dueDate')}</TableHead>
                    <TableHead>{t('legal.urgency.title')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length > 0 ? (
                    filteredCases.map((legalCase) => (
                      <TableRow 
                        key={legalCase.id}
                        className="cursor-pointer"
                        onClick={() => handleCaseClick(legalCase)}
                      >
                        <TableCell className="font-medium">{legalCase.customerName}</TableCell>
                        <TableCell className="hidden md:table-cell">{legalCase.description}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {typeof legalCase.amount === 'number' ? 
                            legalCase.amount.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'QAR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }) : 
                            legalCase.amount
                          }
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(legalCase.dueDate)}</TableCell>
                        <TableCell>{getUrgencyBadge(legalCase.urgency)}</TableCell>
                        <TableCell>{getStatusBadge(legalCase.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? "start" : "end"}>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCaseClick(legalCase);
                                }}
                                className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
                              >
                                <Gavel className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('legal.viewDetails')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => e.stopPropagation()}
                                className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
                              >
                                <FileText className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('legal.viewDocuments')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => e.stopPropagation()}
                                className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}
                              >
                                <AlertTriangle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t('legal.markAsUrgent')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        {t('legal.noCasesFound')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LegalCaseManagement;
