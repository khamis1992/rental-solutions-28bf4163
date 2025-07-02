
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
  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline" className="text-xs px-2 py-1">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-xs px-2 py-1">Active</Badge>;
      case 'pending':
      case 'pending_reminder':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs px-2 py-1">Pending</Badge>;
      case 'closed':
      case 'resolved':
      case 'settled':
        return <Badge className="bg-green-500 hover:bg-green-600 text-xs px-2 py-1">Closed</Badge>;
      case 'escalated':
      case 'in_legal_process':
        return <Badge variant="destructive" className="text-xs px-2 py-1">Escalated</Badge>;
      default:
        return <Badge variant="outline" className="text-xs px-2 py-1">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-sm">Customer</TableHead>
            <TableHead className="hidden md:table-cell text-sm">Case Type</TableHead>
            <TableHead className="hidden md:table-cell text-sm">Description</TableHead>
            <TableHead className="hidden md:table-cell text-sm">Amount</TableHead>
            <TableHead className="hidden md:table-cell text-sm">Created</TableHead>
            <TableHead className="text-sm">Status</TableHead>
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
              <TableCell className="font-medium text-sm py-2">{legalCase.profiles?.full_name || "Unknown"}</TableCell>
              <TableCell className="hidden md:table-cell text-sm py-2">{legalCase.case_type || "Unknown"}</TableCell>
              <TableCell className="hidden md:table-cell text-sm py-2">{legalCase.description || "No description"}</TableCell>
              <TableCell className="hidden md:table-cell text-sm py-2">
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
              <TableCell className="hidden md:table-cell text-sm py-2">
                {formatDate(new Date(legalCase.created_at))}
              </TableCell>
              <TableCell className="py-2">{getStatusBadge(legalCase.status || '')}</TableCell>
              <TableCell className="py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onCaseClick(legalCase);
                    }} className="text-sm">
                      <FileText className="mr-2 h-3 w-3" /> View Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-sm">
                      <AlertTriangle className="mr-2 h-3 w-3" /> Mark as Urgent
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
