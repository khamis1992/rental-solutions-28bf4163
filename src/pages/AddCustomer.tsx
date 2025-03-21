
import React from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { UserPlus } from "lucide-react";
import CustomerForm from "@/components/customers/CustomerForm";

const AddCustomer = () => {
  return (
    <PageContainer>
      <SectionHeader
        title="Add Customer"
        description="Create a new customer in the system"
        icon={UserPlus}
      />
      <CustomerForm />
    </PageContainer>
  );
};

export default AddCustomer;
