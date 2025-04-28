
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from '@/lib/date-utils';
import { MoreVertical, FileText, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LegalCase } from '@/types/legal-case';

interface LegalCaseTableProps {
  cases: LegalCase[];
  onCaseClick: (legalCase: LegalCase) => void;
}

export const LegalCaseTable: React.FC<LegalCaseTableProps> = ({ cases, onCaseClick }) => {
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Active</Badge>;
      case 'pending':
      case 'pending_reminder':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'closed':
      case 'resolved':
      case 'settled':
        return <Badge className="bg-green-500 hover:bg-green-600">Closed</Badge>;
      case 'escalated':
      case 'in_legal_process':
        return <Badge variant="destructive">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Case Type</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden md:table-cell">Amount</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((legalCase) => (
            <TableRow 
              key={legalCase.id}
              className="cursor-pointer"
              onClick={() => onCaseClick(legalCase)}
            >
              <TableCell className="font-medium">{legalCase.profiles?.full_name || "Unknown"}</TableCell>
              <TableCell className="hidden md:table-cell">{legalCase.case_type || "Unknown"}</TableCell>
              <TableCell className="hidden md:table-cell">{legalCase.description || "No description"}</TableCell>
              <TableCell className="hidden md:table-cell">
                {legalCase.amount_owed !== undefined ? 
                  legalCase.amount_owed.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'QAR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }) : 
                  'N/A'
                }
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDate(new Date(legalCase.created_at))}
              </TableCell>
              <TableCell>{getUrgencyBadge(legalCase.priority || 'low')}</TableCell>
              <TableCell>{getStatusBadge(legalCase.status || '')}</TableCell>
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
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onCaseClick(legalCase);
                    }}>
                      <FileText className="mr-2 h-4 w-4" /> View Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <AlertTriangle className="mr-2 h-4 w-4" /> Mark as Urgent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
