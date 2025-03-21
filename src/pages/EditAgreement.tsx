
import React from "react";
import { useParams } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { ClipboardCheck } from "lucide-react";
import AgreementForm from "@/components/agreements/AgreementForm";
import { useAgreements } from "@/hooks/use-agreements";

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const { useAgreement } = useAgreements();
  const { data: agreement, isLoading } = useAgreement(id || '');

  return (
    <PageContainer>
      <SectionHeader
        title="Edit Agreement"
        description="Update an existing rental agreement"
        icon={ClipboardCheck}
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p>Loading agreement data...</p>
        </div>
      ) : (
        <AgreementForm
          initialData={agreement}
          isEditMode={true}
        />
      )}
    </PageContainer>
  );
};

export default EditAgreement;
