import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CustomerObligation } from './CustomerLegalObligations.types';

interface CustomerLegalObligationsProps {
  obligations: CustomerObligation[];
}

export function CustomerLegalObligations({ obligations }: CustomerLegalObligationsProps) {

  const renderObligationRows = () => {
    return obligations.map((obligation: CustomerObligation) => {
      // Ensure obligation has required type and title properties
      const safeObligation: CustomerObligation = {
        ...obligation,
        type: obligation.type || obligation.obligationType || "UNKNOWN",
        title: obligation.title || `Obligation #${obligation.id.substring(0, 8)}`
      };
      
      return (
        <TableRow key={safeObligation.id}>
          <TableCell className="font-medium">{safeObligation.title}</TableCell>
          <TableCell>{safeObligation.description}</TableCell>
          <TableCell>{safeObligation.amount}</TableCell>
          <TableCell>{safeObligation.dueDate?.toString()}</TableCell>
          <TableCell>
            <Badge variant="secondary">{safeObligation.status}</Badge>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Obligations</CardTitle>
        <CardDescription>
          Here are the legal obligations for this customer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderObligationRows()}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
