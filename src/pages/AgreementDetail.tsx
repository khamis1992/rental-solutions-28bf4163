
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { ClipboardCheck } from "lucide-react";
import AgreementDetail from "@/components/agreements/AgreementDetail";

const AgreementDetailPage = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Agreement Details"
        description="View and manage agreement information"
        icon={ClipboardCheck}
      />
      <AgreementDetail />
    </PageContainer>
  );
};

export default AgreementDetailPage;
