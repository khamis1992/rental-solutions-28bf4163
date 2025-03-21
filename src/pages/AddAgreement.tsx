
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { ClipboardCheck } from "lucide-react";
import AgreementForm from "@/components/agreements/AgreementForm";

const AddAgreement = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Create Agreement"
        description="Create a new rental agreement"
        icon={ClipboardCheck}
      />
      <AgreementForm />
    </PageContainer>
  );
};

export default AddAgreement;
