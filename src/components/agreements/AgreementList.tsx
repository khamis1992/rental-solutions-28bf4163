import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { DataTable } from '@/components/ui/data-table';
import { AgreementColumnDef } from '@/components/agreements/AgreementTableColumns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Copy, Edit, Trash, FileText, Download } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { toast } from 'sonner';
import { deleteAgreement, updateAgreement as updateAgreementAPI } from '@/lib/api/agreements';
import { Agreement, AgreementCreate } from '@/types/agreement';
import { useAgreements } from '@/hooks/use-agreements';
import { useDownload } from '@/hooks/use-download';
import { generateAgreementPDF } from '@/lib/agreement-pdf';
import { cn } from '@/lib/utils';

interface AgreementListProps {
  customerId?: string;
}

const AgreementList: React.FC<AgreementListProps> = ({ customerId }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { useList } = useAgreements();
  const { data: agreements, isLoading, error } = useList({ customer_id: customerId });
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const { download, isDownloading } = useDownload();

  const columns: AgreementColumnDef[] = [
    {
      accessorKey: 'agreement_number',
      header: 'Agreement #',
    },
    {
      accessorKey: 'start_date',
      header: 'Start Date',
    },
    {
      accessorKey: 'end_date',
      header: 'End Date',
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const agreement = row.original;

        const handleCopyAgreement = async () => {
          try {
            await navigator.clipboard.writeText(agreement.id);
            toast.success('Agreement ID copied to clipboard!');
          } catch (error) {
            toast.error('Failed to copy agreement ID to clipboard.');
          }
        };

        const handleEditAgreement = () => {
          navigate(`/agreements/${agreement.id}/edit`);
        };

        const handleDeleteAgreement = () => {
          setSelectedAgreementId(agreement.id);
          deleteAgreementMutation.mutate({ id: agreement.id });
        };

        const handleViewAgreement = () => {
          navigate(`/agreements/${agreement.id}`);
        };

        const handleDownloadAgreement = async () => {
          setSelectedAgreementId(agreement.id);
          const pdfBlob = await generateAgreementPDF(agreement);
          download(pdfBlob, `agreement-${agreement.agreement_number}.pdf`);
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleCopyAgreement}>
                <Copy className="mr-2 h-4 w-4" /> Copy ID
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditAgreement}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleViewAgreement}>
                <FileText className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadAgreement} disabled={isDownloading}>
                <Download className="mr-2 h-4 w-4" /> {isDownloading ? 'Downloading...' : 'Download'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDeleteAgreement}>
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const deleteAgreementMutation = useMutation(
    (id: { id: string }) => deleteAgreement(id.id),
    {
      onSuccess: () => {
        toast.success('Agreement deleted successfully!');
        queryClient.invalidateQueries('agreements');
      },
      onError: (error: any) => {
        toast.error(`Failed to delete agreement: ${error.message || 'Unknown error'}`);
      },
      onSettled: () => {
        setSelectedAgreementId(null);
      },
    }
  );

  const updateAgreementMutation = useMutation<Agreement, Error, { id: string; data: Partial<AgreementCreate> }>(
    ({ id, data }) => updateAgreementAPI(id, data),
    {
      onSuccess: () => {
        toast.success('Agreement updated successfully!');
        queryClient.invalidateQueries('agreements');
      },
      onError: (error: any) => {
        toast.error(`Failed to update agreement: ${error.message || 'Unknown error'}`);
      },
      onSettled: () => {
        setSelectedAgreementId(null);
      },
    }
  );

  return (
    <div className={cn("container mx-auto py-4", !customerId ? "page-transition" : "")}>
      {error && (
        <div className="text-red-500">Error: {error.message}</div>
      )}
      <DataTable columns={columns} data={agreements || []} isLoading={isLoading} />
      {deleteAgreementMutation.isLoading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-500 bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-md">
            Deleting Agreement...
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementList;
