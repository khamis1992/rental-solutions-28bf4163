
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { useTemplateSetup } from "@/components/agreements/form/TemplateSetup";
import AddAgreementForm from "@/components/agreements/form/AddAgreementForm";

const AddAgreement = () => {
  const {
    standardTemplateExists,
    specificUrlCheck
  } = useTemplateSetup();
  
  return (
    <PageContainer 
      title="Create New Agreement" 
      description="Create a new rental agreement with a customer" 
      backLink="/agreements"
    >
      <AddAgreementForm />
    </PageContainer>
  );
};

export default AddAgreement;
