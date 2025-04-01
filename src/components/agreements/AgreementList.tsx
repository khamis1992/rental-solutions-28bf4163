import React from 'react';
import { useAgreements } from '@/hooks/use-agreements';
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VehicleStatusBadge } from './VehicleStatusBadge';

interface AgreementListProps {
  searchQuery?: string;
}

const AgreementList: React.FC<AgreementListProps> = ({ searchQuery = '' }) => {
  const { agreements, isLoading, error, searchParams, setSearchParams } = useAgreements();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading agreements</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">Agreements</h1>
      <Button onClick={() => setSearchParams({})}>Reset Filters</Button>
      <Table>
        <thead>
          <tr>
            <th>Agreement Number</th>
            <th>Customer</th>
            <th>Vehicle</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {agreements.map((agreement) => (
            <tr key={agreement.id}>
              <td>{agreement.agreement_number}</td>
              <td>{agreement.customers?.full_name}</td>
              <td>{agreement.vehicles?.license_plate}</td>
              <td>
                <Badge variant={agreement.status === 'active' ? 'success' : 'warning'}>
                  {agreement.status}
                </Badge>
              </td>
              <td>
                <Button variant="outline">Edit</Button>
                <Button variant="destructive">Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AgreementList;
