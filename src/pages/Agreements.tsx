
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { ClipboardCheck } from "lucide-react";
import AgreementList from "@/components/agreements/AgreementList";

const Agreements = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Rental Agreements"
        description="Manage rental agreements between customers and vehicles"
        icon={ClipboardCheck}
      />
      <AgreementList />
    </PageContainer>
  );
};

export default Agreements;
